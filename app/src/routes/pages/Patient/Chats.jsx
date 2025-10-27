import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ChatPanel from "../../../components/Chat/ChatPanel.jsx";
import Toast from "../../../components/Toast/Toast.jsx";
import { useWeb3 } from "../../../state/Web3Provider.jsx";
import { ROLES } from "../../../lib/constants.js";
import {
  fetchChatsByPatient,
  fetchChatMessages,
  fetchDoctors
} from "../../../lib/queries.js";
import { uploadJSONToIPFS } from "../../../lib/ipfs.js";
import { formatDate, formatEntityId } from "../../../lib/format.js";
import "./Patient.css";

export default function PatientChats() {
  const queryClient = useQueryClient();
  const { role, patientId, signerContract, readonlyContract, account } = useWeb3();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [toast, setToast] = useState(null);

  const isPatient = role === ROLES.PATIENT;

  const chatListQuery = useQuery({
    queryKey: ["patient", "chats", patientId],
    enabled: isPatient && !!readonlyContract && !!patientId,
    queryFn: () => fetchChatsByPatient(readonlyContract, patientId),
    refetchInterval: 20000
  });

  const doctorQuery = useQuery({
    queryKey: ["patient", "doctor-directory"],
    enabled: isPatient && !!readonlyContract,
    queryFn: () => fetchDoctors(readonlyContract)
  });

  const messagesQuery = useQuery({
    queryKey: ["chat", "messages", selectedChatId],
    enabled: !!selectedChatId && !!readonlyContract,
    queryFn: async () => {
      console.log("[PatientChats] Fetching messages for chat:", selectedChatId);
      const result = await fetchChatMessages(readonlyContract, selectedChatId);
      console.log("[PatientChats] Fetched messages result:", result);
      return result;
    },
    refetchInterval: 15000,
    retry: 3,
    retryDelay: 2000,
    onError: (error) => {
      console.error("[PatientChats] Message query error:", error);
      setToast({ type: "error", message: `Failed to load messages: ${error.message}` });
    }
  });

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

  const sendMessageMutation = useMutation({
    mutationFn: async ({ chatId, text }) => {
      if (!signerContract) throw new Error("Connect your wallet to send messages.");
      const payload = {
        type: "medifuse.chat/message",
        version: 1,
        chatId,
        from: "patient",
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
      queryClient.invalidateQueries({ queryKey: ["patient", "chats", patientId] });
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", chatId] });
      setToast({ type: "success", message: "Chat closed." });
    },
    onError: (error) => setToast({ type: "error", message: error.message || "Failed to close chat." })
  });

  if (!isPatient) {
    return (
      <section className="page">
        <div className="panel">
          <h2>Access Restricted</h2>
          <p>You must connect with a registered patient wallet.</p>
        </div>
      </section>
    );
  }

  const chats = chatListQuery.data || [];
  const messages = messagesQuery.data || [];
  const doctors = doctorQuery.data || [];

  const doctorLookup = useMemo(() => {
    const map = {};
    doctors.forEach((doc) => {
      map[doc.id] = doc;
    });
    return map;
  }, [doctors]);

  const activeChat = chats.find((chat) => chat.id === selectedChatId) || null;
  const doctorInfo = activeChat ? doctorLookup[activeChat.doctorId] : null;
  const peerLabel = doctorInfo?.displayName
    ? `Dr. ${doctorInfo.displayName}`
    : doctorInfo?.humanId || formatEntityId("DOC", activeChat?.doctorId);

  return (
    <section className="page page-grid">
      <header className="page-header">
        <div>
          <h2>Consultation Chats</h2>
          <p>Respond to your doctor and keep pre-visit notes organised on the blockchain.</p>
        </div>
      </header>

      <div className="chat-layout">
        <aside className="chat-sidebar">
          <section>
            <h3>Your Chats</h3>
            {chats.length === 0 ? (
              <p className="chat-sidebar-empty">
                Your doctor will start a chat before each appointment. Once it appears here you can reply in real time.
              </p>
            ) : (
              <ul className="chat-session-list">
                {chats.map((chat) => {
                  const doctor = doctorLookup[chat.doctorId];
                  const label = doctor?.displayName
                    ? `Dr. ${doctor.displayName}`
                    : doctor?.humanId || formatEntityId("DOC", chat.doctorId);
                  return (
                    <li key={chat.id}>
                      <button
                        type="button"
                        className={`chat-session-btn ${selectedChatId === chat.id ? "active" : ""}`}
                        onClick={() => setSelectedChatId(chat.id)}
                      >
                        <strong>{label}</strong>
                        <span>{formatDate(chat.createdAt)}</span>
                        {!chat.closed ? (
                          <span className="chat-session-pill">Open</span>
                        ) : (
                          <span className="chat-session-pill closed">Closed</span>
                        )}
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
              title={peerLabel}
              subtitle={`Opened ${formatDate(activeChat.createdAt)}`}
              messages={messages}
              currentAccount={account}
              peerLabel={peerLabel}
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
              placeholder="Describe your symptoms or share updates…"
            />
          ) : (
            <div className="chat-empty-state panel">
              <h3>No chat selected</h3>
              <p>When a doctor opens a consultation chat it will appear here. Select it to reply and share details.</p>
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
