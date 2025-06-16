import React from "react";

const DashboardFilters = ({
  filters,
  setFilters,
  properties = [],
  statusOptions = [
    "all", "new", "assigned", "in_progress", "completed", "verified", "reopened", "archived", "scheduled", "cancelled"
  ],
  categoryOptions = [
    "All", "plumbing", "electrical", "structural", "pest_control", "hvac", "appliance", "landscaping", "other", "cleaning", "security"
  ],
  showPropertyFilter = true,
  showStatusFilter = true,
  showCategoryFilter = true,
  showDateRangeFilter = true,
}) => {
  // Generic handler for filter change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      propertyId: "",
      status: "all",
      category: "all",
      startDate: "",
      endDate: ""
    });
  };

  return (
    <div className="flex flex-wrap items-center space-x-4 my-4">
      {/* Property Filter */}
      {showPropertyFilter && (
        <div>
          <label htmlFor="propertyId" className="block text-sm font-semibold">
            Property:
          </label>
          <select
            id="propertyId"
            value={filters.propertyId}
            onChange={e => handleFilterChange("propertyId", e.target.value)}
            className="border p-2 rounded w-full"
            aria-label="Filter by property"
          >
            <option value="">All</option>
            {properties.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Status Filter */}
      {showStatusFilter && (
        <div>
          <label htmlFor="status" className="block text-sm font-semibold">
            Status:
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={e => handleFilterChange("status", e.target.value)}
            className="border p-2 rounded w-full"
            aria-label="Filter by status"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{status.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      )}

      {/* Category Filter */}
      {showCategoryFilter && (
        <div>
          <label htmlFor="category" className="block text-sm font-semibold">
            Category:
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={e => handleFilterChange("category", e.target.value)}
            className="border p-2 rounded w-full"
            aria-label="Filter by category"
          >
            {categoryOptions.map((category) => (
              <option key={category} value={category}>{category.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date Range Filter */}
      {showDateRangeFilter && (
        <>
          <div>
            <label htmlFor="startDate" className="block text-sm font-semibold">
              Start Date:
            </label>
            <input
              type="date"
              id="startDate"
              value={filters.startDate}
              onChange={e => handleFilterChange("startDate", e.target.value)}
              className="border p-2 rounded w-full"
              aria-label="Filter by start date"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-semibold">
              End Date:
            </label>
            <input
              type="date"
              id="endDate"
              value={filters.endDate}
              onChange={e => handleFilterChange("endDate", e.target.value)}
              className="border p-2 rounded w-full"
              aria-label="Filter by end date"
            />
          </div>
        </>
      )}

      {/* Reset Filters Button */}
      <div>
        <button
          onClick={resetFilters}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          aria-label="Reset all filters"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default DashboardFilters;