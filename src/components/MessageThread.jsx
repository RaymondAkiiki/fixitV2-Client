import React, { useEffect, useRef } from "react";

/**
 * MessageThread shows a conversation between users.
 * @param {Object[]} messages - Array of message objects { _id, sender, content, createdAt }
 * @param {string} userId - Current user's ID for alignment
 */
const MessageThread = ({ messages, userId }) => {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{
      background: "#f8fafc",
      border: "1px solid #e5e7eb",
      borderRadius: "8px",
      padding: "1rem",
      height: "400px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column"
    }}>
      {messages && messages.length ? (
        messages.map(msg => (
          <div
            key={msg._id}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: msg.sender === userId ? "flex-end" : "flex-start",
              marginBottom: "1rem"
            }}
          >
            <div style={{
              background: msg.sender === userId ? "#1e40af" : "#e0e7ef",
              color: msg.sender === userId ? "#fff" : "#1e293b",
              padding: "0.7rem 1rem",
              borderRadius: "1.2rem",
              maxWidth: "65%",
              wordBreak: "break-word",
              fontSize: "1rem"
            }}>
              {msg.content}
            </div>
            <span style={{
              fontSize: "0.8rem",
              color: "#64748b",
              marginTop: "0.2rem"
            }}>
              {msg.senderName || "User"} &middot; {new Date(msg.createdAt).toLocaleString()}
            </span>
          </div>
        ))
      ) : (
        <div style={{ color: "#64748b", textAlign: "center" }}>No messages yet.</div>
      )}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageThread;