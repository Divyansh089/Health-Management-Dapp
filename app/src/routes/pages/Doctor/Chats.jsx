import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ChatPanel from "../../../components/Chat/ChatPanel.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import {
  fetchAppointmentsByDoctor,
  fetchChatsByDoctor,
  fetchChatMessages,
  fetchPatients
} from "../../../lib/queries.js";
import { uploadJSONToIPFS } from "../../../lib/ipfs.js";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import "./Doctor.css";

export default function DoctorChats() {
  const queryClient = useQueryClient();
  const { role, doctorId, signerContract, readonlyContract, account } = useWeb3();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [toast, setToast] = useState(null);

  const isDoctor = role === ROLES.DOCTOR;

  const appointmentsQuery = useQuery({
    queryKey: ["doctor", "appointments", doctorId, "chat"],
    enabled: isDoctor && !!readonlyContract && !!doctorId,
    queryFn: () => fetchAppointmentsByDoctor(readonlyContract, doctorId)
  });

  const patientsQuery = useQuery({
    queryKey: ["doctor", "patients", doctorId, "chat"],
    enabled: isDoctor && !!readonlyContract,
    queryFn: () => fetchPatients(readonlyContract)
  });

  const chatListQuery = useQuery({
    queryKey: ["doctor", "chats", doctorId],
    enabled: isDoctor && !!readonlyContract && !!doctorId,
    queryFn: () => fetchChatsByDoctor(readonlyContract, doctorId)
  });

  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", selectedChatId],
    enabled: !!selectedChatId && !!readonlyContract,
    queryFn: async () => {
      const result = await fetchChatMessages(readonlyContract, selectedChatId);
      return result;
    },
    retry: 2,
    retryDelay: 1000,
    onError: (error) => {
      console.error("[DoctorChats] Message query error:", error);
      setToast({ type: "error", message: `Failed to load messages: ${error.message}` });
    }
  });

  // Manual refresh function
  const refreshMessages = async () => {
    if (selectedChatId) {
      await queryClient.invalidateQueries({ queryKey: ["chat", "messages", selectedChatId] });
    }
  };

  useEffect(() => {
    if (!chatListQuery.data?.length) return;
    if (!selectedChatId) {
      setSelectedChatId(chatListQuery.data[0].id);
      return;
    }
    const exists = chatListQuery.data.some((chat) => chat.id === selectedChatId);
    if (!exists) {
      setSelectedChatId(chatListQuery.data[0].id);
    }
  }, [chatListQuery.data, selectedChatId]);

  const startChatMutation = useMutation({
    mutationFn: async ({ appointmentId, patientId, intro }) => {
      if (!signerContract) throw new Error("Connect your wallet as an approved doctor.");

      const metadata = {
        type: "medifuse.chat/session",
        version: 1,
        appointmentId,
        patientId,
        doctorId,
        createdAt: new Date().toISOString(),
        intro: intro?.trim() || null
      };

      const upload = await uploadJSONToIPFS(metadata);
      const tx = await signerContract.startChat(appointmentId, upload.ipfsUrl || upload.cid || "");
      await tx.wait();

      let chatId = Number(await signerContract.chatIdByAppointment(appointmentId));

      if (intro?.trim()) {
        const payload = {
          type: "medifuse.chat/message",
          version: 1,
          chatId,
          from: "doctor",
          sender: account,
          createdAt: new Date().toISOString(),
          body: { text: intro.trim() }
        };
        const messageUpload = await uploadJSONToIPFS(payload);
        const msgTx = await signerContract.postChatMessage(chatId, messageUpload.ipfsUrl || messageUpload.cid || "");
        await msgTx.wait();
      }

      return chatId;
    },
    onSuccess: async (chatId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["doctor", "chats", doctorId] }),
        queryClient.invalidateQueries({ queryKey: ["doctor", "appointments", doctorId, "chat"] }),
        queryClient.invalidateQueries({ queryKey: ["chat", "messages", chatId] })
      ]);
      setSelectedChatId(chatId);
      setToast({ type: "success", message: "Chat session started." });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to start chat." })
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, text }) => {
      if (!signerContract) throw new Error("Connect your wallet to send messages.");
      const payload = {
        type: "medifuse.chat/message",
        version: 1,
        chatId,
        from: "doctor",
        sender: account,
        createdAt: new Date().toISOString(),
        body: { text }
      };
      const upload = await uploadJSONToIPFS(payload);
      const tx = await signerContract.postChatMessage(chatId, upload.ipfsUrl || upload.cid || "");
      await tx.wait();
    },
    onSuccess: (_, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", chatId] });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to send message." })
  });

  const closeChatMutation = useMutation({
    mutationFn: async (chatId) => {
      if (!signerContract) throw new Error("Connect your wallet to close chats.");
      const tx = await signerContract.closeChat(chatId);
      await tx.wait();
    },
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ["doctor", "chats", doctorId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", chatId] });
      setToast({ type: "success", message: "Chat closed." });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to close chat." })
  });

  if (!isDoctor) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Access Restricted</h2>
          <p>You must connect with a registered doctor wallet.</p>
        </div>
      </section>
    );
  }

  const appointments = appointmentsQuery.data || [];
  const patients = patientsQuery.data || [];
  const chats = chatListQuery.data || [];
  const messages = messagesQuery.data || [];

  const availableAppointments = useMemo(() => {
    // Get all chatted appointment IDs
    const chattedAppointmentIds = new Set(chats.map(chat => chat.appointmentId));

    return appointments
      .filter((appt) => appt.open && !chattedAppointmentIds.has(appt.id))
      .sort((a, b) => a.startAt - b.startAt);
  }, [appointments, chats]);

  const patientLookup = useMemo(() => {
    const map = {};
    patients.forEach((patient) => {
      map[patient.id] = patient;
    });
    return map;
  }, [patients]);

  const activeChat = chats.find((chat) => chat.id === selectedChatId) || null;
  const peerLabel = activeChat
    ? patientLookup[activeChat.patientId]?.displayName ||
    patientLookup[activeChat.patientId]?.humanId ||
    formatEntityId("PAT", activeChat.patientId)
    : "Patient";

  return (
    <section className="page page-grid">
      <header className="page-header">
        <div>
          <h2>Consultation Chats</h2>
          <p>Start conversations with patients ahead of appointments and capture the context on IPFS.</p>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="chat-sidebar">
          {availableAppointments.length > 0 && (
            <section className="chat-sidebar-section">
              <div className="chat-sidebar-header">
                <h3>🗓️ Upcoming Appointments</h3>
                <span className="badge">{availableAppointments.length}</span>
              </div>
              <ul className="chat-appointment-list">
                {availableAppointments.map((appointment) => {
                  const patient = patientLookup[appointment.patientId];
                  const label =
                    patient?.displayName ||
                    patient?.humanId ||
                    formatEntityId("PAT", appointment.patientId);
                  return (
                    <li key={appointment.id} className="chat-appointment-item">
                      <div className="appointment-info">
                        <div className="patient-avatar">{label.charAt(0).toUpperCase()}</div>
                        <div className="appointment-details">
                          <strong className="patient-name">{label}</strong>
                          <span className="appointment-time">📅 {formatDate(appointment.startAt * 1000)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="chat-start-btn"
                        disabled={startChatMutation.isPending}
                        onClick={() =>
                          startChatMutation.mutate({
                            appointmentId: appointment.id,
                            patientId: appointment.patientId
                          })
                        }
                      >
                        {startChatMutation.isPending ? "Starting…" : "Start Chat"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <section className="chat-sidebar-section">
            <div className="chat-sidebar-header">
              <h3>💬 All Patients</h3>
              <span className="badge">{chats.length}</span>
            </div>
            {chats.length === 0 ? (
              <p className="chat-sidebar-empty">Start a chat with a patient from upcoming appointments.</p>
            ) : (
              <ul className="chat-session-list">
                {chats.map((chat) => {
                  const patient = patientLookup[chat.patientId];
                  const label =
                    patient?.displayName ||
                    patient?.humanId ||
                    formatEntityId("PAT", chat.patientId);
                  const isActive = selectedChatId === chat.id;
                  const patientId = patient?.humanId || `PAT-${chat.patientId}`;
                  
                  return (
                    <li key={chat.id}>
                      <button
                        type="button"
                        className={`chat-session-btn ${isActive ? "active" : ""}`}
                        onClick={() => setSelectedChatId(chat.id)}
                      >
                        <div className="session-avatar patient-avatar">
                          {label.charAt(0).toUpperCase()}
                        </div>
                        <div className="session-info">
                          <div className="session-name-row">
                            <strong className="session-name">{label}</strong>
                            {!chat.closed ? (
                              <span className="chat-session-pill open">Active</span>
                            ) : (
                              <span className="chat-session-pill closed">Closed</span>
                            )}
                          </div>
                          <span className="session-id">{patientId}</span>
                          <span className="session-date">💬 Started {formatDate(chat.createdAt)}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </aside>

        <div className="chat-main">
          {activeChat ? (
            <ChatPanel
              title={`Chat with ${peerLabel}`}
              subtitle={`Started ${formatDate(activeChat.createdAt)}`}
              messages={messages}
              currentAccount={account}
              peerLabel={peerLabel}
              peerAvatar={true}
              metadata={{
                appointmentId: activeChat.appointmentId,
                patientId: activeChat.patientId,
                doctorId: activeChat.doctorId,
                createdAt: activeChat.createdAt,
                subject: activeChat.metadata?.subject,
                reason: activeChat.metadata?.reason
              }}
              onSend={(text) => sendMessageMutation.mutate({ chatId: activeChat.id, text })}
              sending={sendMessageMutation.isPending}
              closed={activeChat.closed}
              canClose={!activeChat.closed}
              onClose={() => closeChatMutation.mutate(activeChat.id)}
            />
          ) : (
            <div className="chat-empty-state panel">
              <h3>💬 Select a chat</h3>
              <p>Choose an active chat session or start a new conversation with a patient from the left panel.</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
          duration={4000}
        />
      )}
    </section>
  );
}
