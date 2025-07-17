import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from "../../services/adminService.js";
import Pagination from '../../components/admin/Pagination';

const AdminVendorManagementPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.listAllVendorsAdmin(filters);
      setVendors(response.data.vendors);
      setTotalPages(response.data.totalPages);
      setError('');
    } catch (err) {
      setError('Failed to load vendors. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (loading) return <div className="text-center p-10">Loading vendors...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Vendor Management (Admin View)</h2>
      <div className="mb-4">
        <input
          type="text"
          name="search"
          placeholder="Search vendors by name or specialty"
          value={filters.search}
          onChange={handleFilterChange}
          className="p-2 border rounded w-full md:w-1/3"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Added By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg. Rating</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendors.map(vendor => (
              <tr key={vendor._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{vendor.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.specialty?.join(', ') || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.contactEmail || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.contactPhone || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.addedBy?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vendor.averageRating?.toFixed(1) || 'N/A'}</td>
                {/* Add actions like View Details if needed */}
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

export default AdminVendorManagementPage;