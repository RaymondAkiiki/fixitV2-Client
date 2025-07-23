// frontend/src/pages/tenant/ScheduledWorksPage.jsx

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext.jsx";
import * as scheduledMaintenanceService from "../../services/scheduledMaintenanceService.js";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import { Loader2, ServerCrash } from "lucide-react";
import { FaCalendarAlt } from "react-icons/fa";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx";

// Brand Colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const ScheduledWorksPage = () => {
  const [filter, setFilter] = useState("upcoming"); // 'upcoming' or 'past'
  const { user } = useAuth();
  const { showError } = useGlobalAlert();

  // Fetch scheduled maintenance tasks
  const { data: maintenanceTasks, isLoading, error } = useQuery({
    queryKey: ['scheduledMaintenance'],
    queryFn: () => scheduledMaintenanceService.getAllScheduledMaintenance(),
    onError: (err) => {
      showError("Failed to load scheduled works: " + (err.message || "Unknown error"));
    }
  });

  // Filter and sort tasks based on the selected filter
  const filteredTasks = useMemo(() => {
    if (!maintenanceTasks || !maintenanceTasks.tasks) return [];
    
    const tasks = maintenanceTasks.tasks;
    const now = new Date();
    
    if (filter === "upcoming") {
      return tasks
        .filter((task) => new Date(task.scheduledDate) >= now)
        .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    } else if (filter === "past") {
      return tasks
        .filter((task) => new Date(task.scheduledDate) < now)
        .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate)); // Latest first
    }
    
    return tasks; // Default return all tasks
  }, [maintenanceTasks, filter]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <LoadingSpinner size="lg" color={PRIMARY_COLOR} className="mr-4" />
        <p className="text-xl text-gray-700 font-semibold">Loading scheduled maintenance...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <ServerCrash size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
        <p className="text-gray-600 max-w-md text-center mb-6">
          We couldn't load your scheduled maintenance tasks. Please try again later.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 min-h-full bg-gray-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 
            className="text-3xl font-extrabold mb-2" 
            style={{ color: PRIMARY_COLOR }}
          >
            Scheduled Maintenance
          </h1>
          <p className="text-gray-600">
            View upcoming and past scheduled maintenance for your unit and property.
          </p>
        </div>
        
        {/* Filter Controls */}
        <div className="flex mt-4 md:mt-0 bg-white rounded-lg shadow-sm">
          <button
            className={`px-5 py-2.5 rounded-l-lg font-medium transition ${
              filter === "upcoming"
                ? `bg-${PRIMARY_COLOR.replace("#", "")} text-white`
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
            style={filter === "upcoming" ? { backgroundColor: PRIMARY_COLOR } : {}}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`px-5 py-2.5 rounded-r-lg font-medium transition ${
              filter === "past"
                ? `bg-${PRIMARY_COLOR.replace("#", "")} text-white`
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
            style={filter === "past" ? { backgroundColor: PRIMARY_COLOR } : {}}
            onClick={() => setFilter("past")}
          >
            Past
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <FaCalendarAlt className="text-gray-400 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700">No scheduled maintenance {filter === "upcoming" ? "upcoming" : "in the past"}</h3>
          <p className="text-gray-500 mt-2">
            {filter === "upcoming"
              ? "There is no scheduled maintenance planned at this time."
              : "No past maintenance records were found."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTasks.map((task) => (
            <div
              key={task._id}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {task.title}
                  </h3>
                  <StatusBadge status={task.status} />
                </div>
                
                <div className="mt-4 space-y-2 text-gray-600">
                  <p>
                    <strong>Scheduled:</strong>{" "}
                    {task.scheduledDateFormatted || new Date(task.scheduledDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Property:</strong> {task.propertyName || "N/A"}
                  </p>
                  <p>
                    <strong>Unit:</strong> {task.unitName || "N/A"}
                  </p>
                  <p>
                    <strong>Category:</strong> {task.categoryDisplay || task.category || "General"}
                  </p>
                  {task.assigneeName && (
                    <p>
                      <strong>Assigned To:</strong> {task.assigneeName}
                    </p>
                  )}
                </div>

                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {task.description && task.description.length > 200
                      ? `${task.description.substring(0, 200)}...`
                      : task.description || "No additional details provided."}
                  </div>
                </div>

                {/* Status Information */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  {task.status === "completed" ? (
                    <div className="text-green-600">
                      Completed on {task.lastExecutedAtFormatted || new Date(task.lastExecutedAt).toLocaleDateString()}
                    </div>
                  ) : task.status === "in_progress" ? (
                    <div className="text-yellow-600">
                      Work in progress
                    </div>
                  ) : task.recurring ? (
                    <div className="text-blue-600">
                      {task.frequencyDisplay || `Recurring: ${task.frequency?.type || "regularly"}`}
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      One-time scheduled maintenance
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledWorksPage;