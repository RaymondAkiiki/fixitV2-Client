// frontend/src/pages/tenant/TenantRequestsPage.jsx

import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { PlusCircle, Wrench, Search, Filter, ChevronDown } from "lucide-react";
import * as requestService from "../../services/requestService.js";
import Button from "../../components/common/Button.jsx";
import LoadingSpinner from "../../components/common/LoadingSpinner.jsx";
import StatusBadge from "../../components/common/StatusBadge.jsx";
import Select from "../../components/common/Select.jsx";
import Input from "../../components/common/Input.jsx";
import { ROUTES } from "../../utils/constants.js";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext.jsx";

// Define brand colors for consistent styling
const PRIMARY_COLOR = "#219377";

const TenantRequestsPage = () => {
  const { user } = useAuth();
  const { showError } = useGlobalAlert();
  
  // State for filters
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    sortBy: "createdAt",
    sortDirection: "desc",
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Available filter options
  const statusOptions = [
    { value: "", label: "All Statuses" },
    { value: "new", label: "New" },
    { value: "assigned", label: "Assigned" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "verified", label: "Verified" },
    { value: "reopened", label: "Reopened" },
    { value: "archived", label: "Archived" },
  ];
  
  const categoryOptions = [
    { value: "", label: "All Categories" },
    { value: "plumbing", label: "Plumbing" },
    { value: "electrical", label: "Electrical" },
    { value: "hvac", label: "HVAC" },
    { value: "appliance", label: "Appliance" },
    { value: "structural", label: "Structural" },
    { value: "pest", label: "Pest Control" },
    { value: "cleaning", label: "Cleaning" },
    { value: "safety", label: "Safety & Security" },
    { value: "general", label: "General Maintenance" },
  ];
  
  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "updatedAt", label: "Last Updated" },
    { value: "priority", label: "Priority" },
    { value: "status", label: "Status" },
  ];
  
  // Fetch maintenance requests using React Query
  const {
    data: requestsData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['maintenanceRequests', filters],
    queryFn: () => requestService.getAllRequests({
      search: filters.search,
      status: filters.status,
      category: filters.category,
      sort: filters.sortBy,
      order: filters.sortDirection,
      tenant: user?._id, // Ensure we only get the current user's requests
    }),
    onError: (err) => {
      showError("Failed to load maintenance requests: " + (err.message || "Unknown error"));
    }
  });
  
  // Filter handlers
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  
  const toggleSortDirection = () => {
    setFilters((prev) => ({
      ...prev,
      sortDirection: prev.sortDirection === "asc" ? "desc" : "asc",
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      category: "",
      sortBy: "createdAt",
      sortDirection: "desc",
    });
  };
  
  // Process the request data
  const requests = useMemo(() => {
    if (!requestsData || !requestsData.requests) return [];
    return requestsData.requests;
  }, [requestsData]);
  
  const totalRequests = requestsData?.total || 0;
  
  return (
    <div className="p-4 md:p-8 min-h-full bg-gray-50">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 
            className="text-3xl font-extrabold mb-2"
            style={{ color: PRIMARY_COLOR }}
          >
            My Maintenance Requests
          </h1>
          <p className="text-gray-600">
            View and manage all your maintenance requests
          </p>
        </div>
        <Link
          to={ROUTES.REQUEST_ADD}
          className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg flex items-center shadow-sm transition"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          New Request
        </Link>
      </div>
      
      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by title or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10 py-2.5"
              />
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <Button
            onClick={() => setShowFilters(!showFilters)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            <ChevronDown className={`w-5 h-5 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          
          <Select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange("sortBy", e.target.value)}
            className="min-w-[150px]"
            label="Sort By"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          
          <Button
            onClick={toggleSortDirection}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3"
          >
            {filters.sortDirection === "asc" ? "↑" : "↓"}
          </Button>
        </div>
        
        {/* Additional Filters - Shown when filters button is clicked */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
            <Select
              label="Status"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            
            <Select
              label="Category"
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            
            <div className="flex items-end">
              <Button
                onClick={clearFilters}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center my-20">
          <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
          <span className="ml-3 text-gray-600">Loading maintenance requests...</span>
        </div>
      )}
      
      {/* Error State */}
      {isError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center mb-6">
          <p className="font-medium">Failed to load maintenance requests.</p>
          <p className="text-sm mt-1">{error?.message || "Please try again later."}</p>
          <Button
            onClick={() => refetch()}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-700"
          >
            Try Again
          </Button>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoading && !isError && requests.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Wrench className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No maintenance requests found</h3>
          <p className="text-gray-500 mb-6">
            {filters.search || filters.status || filters.category
              ? "No requests match your current filters. Try adjusting your search criteria."
              : "You haven't submitted any maintenance requests yet."}
          </p>
          <Link
            to={ROUTES.REQUEST_ADD}
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Submit a New Request
          </Link>
        </div>
      )}
      
      {/* Request List */}
      {!isLoading && !isError && requests.length > 0 && (
        <>
          <p className="text-gray-600 mb-4">
            Showing {requests.length} of {totalRequests} maintenance requests
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((request) => (
              <Link
                key={request._id}
                to={ROUTES.REQUEST_DETAILS.replace(':requestId', request._id)}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      {request.title}
                    </h3>
                    <StatusBadge status={request.status} />
                  </div>
                  
                  <div className="mt-4 space-y-2 text-gray-600">
                    <p>
                      <strong>Category:</strong>{" "}
                      {request.categoryDisplay || request.category}
                    </p>
                    <p>
                      <strong>Priority:</strong>{" "}
                      {request.priorityDisplay || request.priority}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {request.createdAtFormatted || new Date(request.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Property:</strong> {request.propertyName}
                    </p>
                    {request.unitName && (
                      <p>
                        <strong>Unit:</strong> {request.unitName}
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 text-gray-700 line-clamp-2">
                    {request.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Basic Pagination - In real app, you'd want to implement actual pagination */}
          {totalRequests > requests.length && (
            <div className="flex justify-center mt-8">
              <button
                className="bg-white border border-gray-300 rounded-md py-2 px-4 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  // Implement pagination logic
                  console.log("Load more results");
                }}
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TenantRequestsPage;