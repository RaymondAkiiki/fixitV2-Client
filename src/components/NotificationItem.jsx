import React from "react";

const iconMap = {
  lease_expiry: "⏳",
  rent_due: "💰",
  approval_request: "🔔",
  password_reset: "🔑",
};

const NotificationItem = ({ notification, onRead, onDelete }) => {
  if (!notification) return null;
  const icon = iconMap[notification.type] || "🔔";
  const { read, createdAt, data = {} } = notification;

  return (
    <div
      className="notification-item"
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1rem",
        marginBottom: "0.75rem",
        background: read ? "#f1f5f9" : "#dbeafe",
        display: "flex",
        alignItems: "center",
        gap: "1rem"
      }}
    >
      <span style={{ fontSize: "1.6rem" }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div>
          <b>{notification.type.replace(/_/g, " ").toUpperCase()}</b>
        </div>
        <div style={{ fontSize: "0.97rem", color: "#475569" }}>
          {data.message || data.text || notification.message || JSON.stringify(data)}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>
          {createdAt ? new Date(createdAt).toLocaleString() : ""}
        </div>
      </div>
      <div>
        {typeof onRead === "function" && !read && (
          <button
            onClick={() => onRead(notification._id)}
            style={{
              background: "#1e40af",
              color: "#fff",
              border: "none",
              borderRadius: "0.3rem",
              padding: "0.35rem 0.7rem",
              fontSize: "0.97rem",
              marginRight: "0.5rem",
              cursor: "pointer"
            }}
          >
            Mark Read
          </button>
        )}
        {typeof onDelete === "function" && (
          <button
            onClick={() => onDelete(notification._id)}
            style={{
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "0.3rem",
              padding: "0.35rem 0.7rem",
              fontSize: "0.97rem",
              cursor: "pointer"
            }}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;