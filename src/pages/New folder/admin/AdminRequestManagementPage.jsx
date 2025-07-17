import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from "../../services/adminService.js";
import { Link } from 'react-router-dom';

const AdminRequestManagementPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    propertyId: '',
    category: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [properties, setProperties] = useState([]); // For filter

  // Fetch properties for the filter dropdown
  useEffect(() => {
    const fetchPropertiesForFilter = async () => {
      try {
        const res = await adminService.listAllPropertiesAdmin({ limit: 1000 });
        setProperties(res.data.properties);
      } catch (error) {
        console.error("Failed to fetch properties for filter", error);
      }
    };
    fetchPropertiesForFilter();
  }, []);
  
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.listAllRequestsAdmin(filters);
      setRequests(response.data.requests);
      setTotalPages(response.data.totalPages);
      setError('');
    } catch (err) {
      setError('Failed to load requests. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };
  
  const handleDateChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };
  
  const requestCategories = ['Plumbing', 'Electrical', 'HVAC', 'Appliance', 'Structural', 'Landscaping', 'Other'];
  const requestStatuses = ['New', 'Pending Assignment', 'Assigned', 'In Progress', 'Awaiting Vendor Action', 'On Hold', 'Completed', 'Verified & Closed', 'Re-opened', 'Cancelled'];
  const requestPriorities = ['Low', 'Medium', 'High', 'Urgent'];

  if (loading) return <div className="text-center p-10">Loading maintenance requests...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Maintenance Requests (Admin View)</h2>
      
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow">
        <input
          type="text"
          name="search"
          placeholder="Search by title"
          value={filters.search}
          onChange={handleFilterChange}
          className="p-2 border rounded w-full"
        />
        <select name="status" value={filters.status} onChange={handleFilterChange} className="p-2 border rounded w-full">
          <option value="">All Statuses</option>
          {requestStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select name="priority" value={filters.priority} onChange={handleFilterChange} className="p-2 border rounded w-full">
          <option value="">All Priorities</option>
          {requestPriorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="propertyId" value={filters.propertyId} onChange={handleFilterChange} className="p-2 border rounded w-full">
          <option value="">All Properties</option>
          {properties.map(prop => <option key={prop._id} value={prop._id}>{prop.name}</option>)}
        </select>
        <select name="category" value={filters.category} onChange={handleFilterChange} className="p-2 border rounded w-full">
          <option value="">All Categories</option>
          {requestCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">From</label>
          <input type="date" name="dateFrom" id="dateFrom" value={filters.dateFrom} onChange={handleDateChange} className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">To</label>
          <input type="date" name="dateTo" id="dateTo" value={filters.dateTo} onChange={handleDateChange} className="p-2 border rounded w-full"/>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map(req => (
              <tr key={req._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.property?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.unit?.unitIdentifier || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.priority}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.reportedBy?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {/* Link to a detailed view if you create one */}
                  {/* <Link to={`/admin/requests/${req._id}`} className="text-indigo-600 hover:text-indigo-900">View</Link> */}
                  <button onClick={() => alert(`Viewing details for ${req.title}`)} className="text-indigo-600 hover:text-indigo-900">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page <= 1} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Previous</button>
        <span>Page {filters.page} of {totalPages}</span>
        <button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page >= totalPages} className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50">Next</button>
      </div>
    </div>
  );
};

export default AdminRequestManagementPage;