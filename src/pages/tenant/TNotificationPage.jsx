import React, { useEffect, useState } from "react";
import { getAllNotifications, markAsRead, markAllAsRead } from "../../services/notificationService";
import { Bell, Check, Loader2 } from "lucide-react";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";

const PRIMARY_COLOR = "#219377";

const TNotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getAllNotifications();
      setNotifications(data);
    } catch (err) {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      setActionLoading(true);
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      // Consider showing user-friendly error here
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAll = async () => {
    try {
      setActionLoading(true);
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      // Consider showing user-friendly error here
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 min-h-full bg-white rounded-xl shadow-lg border"
      style={{ borderColor: PRIMARY_COLOR + "20" }}
    >
      <div className="flex justify-between items-center mb-7 border-b pb-3"
        style={{ borderColor: PRIMARY_COLOR }}
      >
        <h2 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: PRIMARY_COLOR }}>
          <Bell className="text-[#219377]" /> Notifications
        </h2>
        {notifications.length > 0 && (
          <Button
            onClick={handleMarkAll}
            disabled={actionLoading}
            className="flex items-center bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold rounded-lg px-4 py-2"
            style={{ fontWeight: 600 }}
          >
            <Check className="w-4 h-4 mr-2" /> Mark All as Read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-600">
          <Loader2 className="animate-spin w-6 h-6 mx-auto mb-2" />
          Loading notifications...
        </div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : notifications.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <Bell className="w-10 h-10 mx-auto mb-2" />
          No notifications found.
        </div>
      ) : (
        <ul className="space-y-4">
          {notifications.map((notif) => (
            <li
              key={notif._id}
              className={`flex items-start justify-between p-4 rounded-lg border transition ${
                notif.read
                  ? "bg-gray-50 border-gray-100"
                  : "bg-yellow-50 border-yellow-200 shadow"
              }`}
            >
              <div>
                <p className={`text-sm ${notif.read ? "text-gray-600" : "text-gray-800 font-semibold"}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.read && (
                <button
                  onClick={() => handleMarkAsRead(notif._id)}
                  className="text-xs text-blue-600 hover:underline disabled:text-gray-400 ml-6"
                  disabled={actionLoading}
                >
                  Mark as Read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TNotificationPage;