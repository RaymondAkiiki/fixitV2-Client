import React, { useEffect, useState } from "react";
import { getAllNotifications, markAsRead, markAllAsRead } from "../../services/notificationService";
import { Bell, Check, Loader2 } from "lucide-react";
import Button from "../../components/common/Button";
import Alert from "../../components/common/Alert";

const PRIMARY = "#219377";
const SECONDARY = "#ffbd59";

const PMNotificationPage = () => {
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
      // Optionally show error feedback here
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
      // Optionally show error feedback here
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-[#e6f7f2]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: PRIMARY }}>
          <Bell className="text-[#219377]" />
          Notifications
        </h2>
        {notifications.length > 0 && (
          <Button
            onClick={handleMarkAll}
            disabled={actionLoading}
            className="flex items-center px-4 py-2 bg-[#ffbd59] hover:bg-[#e7a741] text-[#1c2522] rounded-lg shadow-md transition"
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
        <div className="text-center py-10 text-gray-400">
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
                  ? "bg-[#f6fdfc] border-[#e6f7f2]"
                  : "bg-[#fffbe6] border-[#ffbd59]/40"
              }`}
            >
              <div>
                <p className={`text-sm ${notif.read ? "text-gray-500" : "text-gray-800 font-semibold"}`}>{notif.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.createdAt).toLocaleString()}
                </p>
              </div>
              {!notif.read && (
                <button
                  onClick={() => handleMarkAsRead(notif._id)}
                  className="text-xs font-semibold text-[#219377] hover:text-[#ffbd59] underline disabled:text-gray-400 transition"
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

export default PMNotificationPage;