import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatEntityId } from "../../lib/format.js";
import "./ChatPanel.css";

function resolveText(payload) {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload?.body === "string") return payload.body;
  if (typeof payload?.body === "object" && payload.body !== null) {
    if (typeof payload.body.text === "string") return payload.body.text;
    if (typeof payload.body.message === "string") return payload.body.message;
  }
  if (typeof payload.text === "string") return payload.text;
  if (typeof payload.message === "string") return payload.message;
  return null;
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function debugMessage(message, index) {
  console.debug(`[ChatPanel] Message ${index}:`, {
    id: message.id,
    sender: message.sender,
    cid: message.cid,
    hasPayload: !!message.payload,
    payloadType: typeof message.payload,
    resolvedText: resolveText(message.payload),
    createdAt: message.createdAt,
    rawPayload: message.payload
  });
}

export default function ChatPanel({
  title,
  subtitle,
  messages,
  currentAccount,
  peerLabel,
  peerAvatar,
  metadata,
  onSend,
  sending = false,
  disabled = false,
  closed = false,
  canClose = false,
  onClose,
  placeholder = "Write a message…"
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  const normalizedMessages = useMemo(() => {
    const msgArray = messages || [];
    console.debug("[ChatPanel] Processing messages", {
      messageCount: msgArray.length,
      currentAccount,
      messages: msgArray.map((msg, idx) => {
        debugMessage(msg, idx);
        return {
          id: msg.id,
          sender: msg.sender,
          hasPayload: !!msg.payload,
          resolvedText: resolveText(msg.payload)
        };
      })
    });
    return msgArray;
  }, [messages, currentAccount]);

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [normalizedMessages]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (disabled || closed || sending) return;
    const text = draft.trim();
    if (!text.length) return;
    onSend?.(text);
    setDraft("");
  };

  return (
    <div className="chat-panel">
      <header className="chat-panel-header">
        <div className="chat-header-info">
          {peerAvatar && (
            <div className="chat-header-avatar">
              {getInitials(peerLabel || title)}
            </div>
          )}
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>
        <div className="chat-panel-status">
          <span className={`chat-status-dot ${closed ? "closed" : "open"}`} />
          <span>{closed ? "Closed" : "Active"}</span>
          {canClose && !closed && (
            <button type="button" onClick={onClose} className="chat-close-btn">
              Close Chat
            </button>
          )}
        </div>
      </header>

      {metadata && (
        <section className="chat-metadata">
          {metadata.subject && <strong>{metadata.subject}</strong>}
          {metadata.reason && <p>{metadata.reason}</p>}
          <ul>
            {metadata.appointmentId && (
              <li>Appointment {formatEntityId("APT", metadata.appointmentId)}</li>
            )}
            {metadata.patientId && (
              <li>Patient {formatEntityId("PAT", metadata.patientId)}</li>
            )}
            {metadata.doctorId && (
              <li>Doctor {formatEntityId("DOC", metadata.doctorId)}</li>
            )}
            {metadata.createdAt && <li>Opened {formatDate(metadata.createdAt)}</li>}
          </ul>
        </section>
      )}

      <section className="chat-messages">
        {normalizedMessages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. {closed ? "Chat is closed." : "Start the conversation."}</p>
          </div>
        ) : (
          normalizedMessages.map((message, index) => {
            const text = resolveText(message.payload);
            const fallbackText = text || `Message CID: ${message.cid}`;
            const isSelf = currentAccount && message.sender && message.sender.toLowerCase() === currentAccount.toLowerCase();

            console.debug(`[ChatPanel] Rendering message ${index}:`, {
              messageId: message.id,
              sender: message.sender,
              currentAccount,
              isSelf,
              hasText: !!text,
              text: text || 'NO TEXT',
              fallbackText
            });

            return (
              <article
                key={message.id}
                className={`chat-message ${isSelf ? "self" : "peer"}`}
              >
                <div className="chat-message-meta">
                  <span>{isSelf ? "You" : peerLabel || "Participant"}</span>
                  <time>{formatDate(message.createdAt)}</time>
                </div>
                <p>{fallbackText}</p>
              </article>
            );
          })
        )}
        <div ref={endRef} />
      </section>

      <footer className="chat-composer">
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder={placeholder}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={disabled || closed || sending}
            rows={3}
          />
          <div className="chat-composer-actions">
            <span className="chat-composer-hint">
              {closed
                ? "Chat closed. Reopen required for new messages."
                : "IPFS-backed messages are immutable once sent."}
            </span>
            <button type="submit" className="chat-send-btn" disabled={disabled || closed || sending}>
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </footer>
    </div>
  );
}
