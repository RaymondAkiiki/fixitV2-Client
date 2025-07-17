import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from "../../services/adminService.js";

const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    entity: '',
    entityId: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 15
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getAuditLogsAdmin(filters);
      setLogs(response.data.auditLogs);
      setTotalPages(response.data.totalPages);
      setError('');
    } catch (err) {
      setError('Failed to load audit logs. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (loading) return <div className="text-center p-10">Loading audit logs...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Audit Logs</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow">
        <input type="text" name="userId" placeholder="User ID" value={filters.userId} onChange={handleFilterChange} className="p-2 border rounded"/>
        <input type="text" name="action" placeholder="Action (e.g., USER_LOGIN)" value={filters.action} onChange={handleFilterChange} className="p-2 border rounded"/>
        <input type="text" name="entity" placeholder="Entity (e.g., User)" value={filters.entity} onChange={handleFilterChange} className="p-2 border rounded"/>
        <input type="text" name="entityId" placeholder="Entity ID" value={filters.entityId} onChange={handleFilterChange} className="p-2 border rounded"/>
        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">From</label>
          <input type="date" name="dateFrom" id="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="p-2 border rounded w-full"/>
        </div>
        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">To</label>
          <input type="date" name="dateTo" id="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="p-2 border rounded w-full"/>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map(log => (
              <tr key={log._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.user?.name || 'System'} ({log.user?.email})</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.targetModel}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.targetId}</td>
                <td className="px-6 py-4 text-sm text-gray-500"><pre className="whitespace-pre-wrap text-xs">{JSON.stringify(log.details, null, 2)}</pre></td>
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

export default AdminAuditLogPage;