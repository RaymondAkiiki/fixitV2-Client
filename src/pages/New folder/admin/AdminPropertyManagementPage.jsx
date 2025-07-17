import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from "../../services/adminService.js";
import Pagination from '../../components/admin/Pagination';

const AdminPropertyManagementPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);

  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.listAllPropertiesAdmin(filters);
      setProperties(response.data.properties);
      setTotalPages(response.data.totalPages);
      setError('');
    } catch (err) {
      setError('Failed to load properties. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (loading) return <div className="text-center p-10">Loading properties...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Property Management (Admin View)</h2>
      <div className="mb-4">
        <input
          type="text"
          name="search"
          placeholder="Search properties by name or address"
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Landlord</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Units</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.map(prop => (
              <tr key={prop._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{prop.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{`${prop.address?.street || ''}, ${prop.address?.city || ''}`}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prop.landlord?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prop.propertyManager?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{prop.units?.length || 0}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(prop.createdAt).toLocaleDateString()}</td>
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

export default AdminPropertyManagementPage;