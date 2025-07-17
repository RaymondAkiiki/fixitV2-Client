import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2, ServerCrash } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext.jsx";
import { getAllRequests } from "../../services/requestService.js";

// --- STATUS BADGE ---
const StatusBadge = ({ status }) => {
  const baseClasses = "px-2.5 py-1 rounded-full text-xs font-semibold capitalize";
  const statusStyles = {
    new: "bg-blue-100 text-blue-800",
    assigned: "bg-purple-100 text-purple-800",
    "in progress": "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    "verified & closed": "bg-teal-100 text-teal-800",
    default: "bg-gray-100 text-gray-800"
  };
  const style = statusStyles[status.toLowerCase()] || statusStyles["default"];
  return (
    <span className={`${baseClasses} ${style}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
};

// --- PAGINATION ---
const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 p-4">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`h-10 w-10 rounded-md transition ${
            currentPage === page
              ? "bg-[#219377] text-white"
              : "bg-gray-200 text-gray-700 hover:bg-emerald-100"
          }`}
        >
          {page}
        </button>
      ))}
    </div>
  );
};

// --- MAIN COMPONENT ---
const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Filtering and Pagination State
  const [filters, setFilters] = useState({ status: "all", category: "all" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getAllRequests();
      setRequests(response.requests || []);
    } catch (err) {
      setError("Failed to load your requests. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // --- FILTERING & PAGINATION ---
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const statusMatch =
        filters.status === "all" ||
        req.status.toLowerCase() === filters.status;
      const categoryMatch =
        filters.category === "all" ||
        req.category?.toLowerCase() === filters.category;
      return statusMatch && categoryMatch;
    });
  }, [requests, filters]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const uniqueCategories = useMemo(
    () => [...new Set(requests.map((req) => req.category?.toLowerCase() || ""))].filter(Boolean),
    [requests]
  );

  // --- RESET PAGE TO 1 WHEN FILTERS CHANGE ---
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-7 border-b pb-3">
        <div>
          <h1 className="text-3xl font-extrabold text-[#219377]">My Maintenance Requests</h1>
          <p className="text-gray-500 mt-1">
            Track the status of all your submitted issues.
          </p>
        </div>
        <button
          onClick={() => navigate("/tenant/requests/add")}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#219377] text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-emerald-700 transition"
        >
          <Plus size={16} />
          Submit New Request
        </button>
      </header>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="statusFilter"
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#219377] focus:border-[#219377]"
            >
              <option value="all">All</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="verified & closed">Verified & Closed</option>
            </select>
          </div>
          <div>
            <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="categoryFilter"
              value={filters.category}
              onChange={(e) =>
                setFilters((f) => ({ ...f, category: e.target.value }))
              }
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#219377] focus:border-[#219377]"
            >
              <option value="all">All</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-10 h-10 text-[#219377] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 bg-red-50 rounded-lg">
            <ServerCrash className="w-12 h-12 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : paginatedRequests.length === 0 ? (
          <p className="text-center py-10 text-gray-500">
            No requests match your filters. Try adjusting them or submitting a new request.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRequests.map((req) => (
                  <tr
                    key={req._id}
                    className="hover:bg-emerald-50 cursor-pointer transition"
                    onClick={() => navigate(`/tenant/requests/${req._id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-700">
                      {req.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {req.property?.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : ""}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {req.updatedAt ? new Date(req.updatedAt).toLocaleDateString() : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filteredRequests.length > itemsPerPage && (
          <Pagination
            currentPage={currentPage}
            totalItems={filteredRequests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
};

export default MyRequestsPage;