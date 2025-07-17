import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from "../../services/adminService.js";
import Pagination from '../../components/admin/Pagination';

const AdminUnitManagementPage = () => {
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]); // For property filter dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ propertyId: '', page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);

  const fetchUnits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.listAllUnitsAdmin(filters);
      setUnits(response.data.units);
      setTotalPages(response.data.totalPages);
      setError('');
    } catch (err) {
      setError('Failed to load units. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // Fetch properties for the filter dropdown
    const fetchPropertiesForFilter = async () => {
        try {
            const res = await adminService.listAllPropertiesAdmin({ limit: 1000 }); // Fetch all for dropdown
            setProperties(res.data.properties);
        } catch (error) {
            console.error("Failed to fetch properties for filter", error);
        }
    };
    fetchPropertiesForFilter();
    fetchUnits();
  }, [fetchUnits]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (loading && units.length === 0) return <div className="text-center p-10">Loading units...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Unit Management (Admin View)</h2>
      <div className="mb-4">
        <select 
          name="propertyId" 
          value={filters.propertyId} 
          onChange={handleFilterChange}
          className="p-2 border rounded"
        >
          <option value="">All Properties</option>
          {properties.map(prop => (
            <option key={prop._id} value={prop._id}>{prop.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {units.map(unit => (
              <tr key={unit._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{unit.unitName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.property?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.tenant?.name || 'Vacant'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{unit.details}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(unit.createdAt).toLocaleDateString()}</td>
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

export default AdminUnitManagementPage;