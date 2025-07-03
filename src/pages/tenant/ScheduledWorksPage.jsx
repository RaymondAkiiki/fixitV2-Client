import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getAllScheduledMaintenance } from "../../services/scheduledMaintenanceService.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import { Loader2, ServerCrash } from "lucide-react";
import { FaCalendarAlt } from "react-icons/fa";

// Brand Colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const ScheduledWorksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const [filter, setFilter] = useState("upcoming"); // 'upcoming' or 'past'

  const fetchScheduledWorks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAllScheduledMaintenance();
      setTasks(response.tasks || []);
    } catch (err) {
      setError("Failed to load scheduled works. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchScheduledWorks();
  }, [fetchScheduledWorks]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    if (filter === "upcoming") {
      return tasks
        .filter((task) => new Date(task.scheduledDate) >= now)
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    } else {
      return tasks
        .filter((task) => new Date(task.scheduledDate) < now)
        .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));
    }
  }, [tasks, filter]);

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <header className="mb-7 border-b pb-3" style={{ borderColor: PRIMARY_COLOR }}>
        <h1 className="text-3xl font-extrabold" style={{ color: PRIMARY_COLOR }}>
          Scheduled Works
        </h1>
        <p className="text-gray-500 mt-1">
          View planned maintenance for your property.
        </p>
      </header>

      {/* Filter Tabs */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          onClick={() => setFilter("upcoming")}
          className={`py-2 px-4 text-sm font-semibold transition ${
            filter === "upcoming"
              ? "border-b-2 border-[#219377] text-[#219377]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter("past")}
          className={`py-2 px-4 text-sm font-semibold transition ${
            filter === "past"
              ? "border-b-2 border-[#219377] text-[#219377]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Past Works
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-[#219377] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">
            <ServerCrash className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-sm">
            <FaCalendarAlt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">
              No {filter} scheduled works to display.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task._id}
              className="bg-white p-5 rounded-xl shadow-md border border-l-4"
              style={{ borderColor: PRIMARY_COLOR, borderLeftWidth: 6 }}
            >
              <div className="flex flex-col sm:flex-row justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{task.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    For Property:{" "}
                    <span className="font-medium text-gray-700">
                      {task.property?.name || "N/A"}
                    </span>
                    {task.unit && ` | Unit: ${task.unit.unitName}`}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:text-right">
                  <p className="text-sm text-gray-600 font-medium">Scheduled for:</p>
                  <p className="text-lg font-bold text-[#219377]">
                    {new Date(task.scheduledDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">{task.description}</p>
                <div className="mt-3">
                  <StatusBadge status={task.status} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScheduledWorksPage;