import React from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import NotificationItem from "../../components/NotificationItem";

const NotificationPage = () => {
  const { notifications, loading, error, refresh } = useNotifications();

  return (
    <div>
      <h2>Notifications</h2>
      <button onClick={refresh} style={{ marginBottom: 12 }}>Refresh</button>
      {loading ? (
        <div>Loading notifications...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : notifications.length ? (
        notifications.map(n => <NotificationItem key={n._id} notification={n} />)
      ) : (
        <div>No notifications found.</div>
      )}
    </div>
  );
};

export default NotificationPage;