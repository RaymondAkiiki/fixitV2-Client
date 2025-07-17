import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from "../../services/adminService.js";
import Pagination from '../../components/admin/Pagination'; 

const AdminUserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', role: '', page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null); // For modals
  const [newRole, setNewRole] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.listAllUsers(filters);
      setUsers(response.data.users);
      setTotalPages(response.data.totalPages);
      setError('');
    } catch (err) {
      setError('Failed to load users. ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleUpdateRole = async (userId, role) => {
    if (!role) {
      alert("Please select a role.");
      return;
    }
    try {
      await adminService.updateUserRole(userId, role);
      alert('User role updated successfully!');
      fetchUsers(); // Refresh list
      setSelectedUser(null);
    } catch (err) {
      alert('Failed to update role: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await adminService.toggleUserActiveStatus(userId, !currentStatus);
      alert(`User status changed to ${!currentStatus ? 'active' : 'inactive'}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to toggle status: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApproveUser = async (userId) => {
     try {
      await adminService.manuallyApproveUser(userId);
      alert('User approved successfully!');
      fetchUsers();
    } catch (err) {
      alert('Failed to approve user: ' + (err.response?.data?.message || err.message));
    }
  }

  if (loading) return <div className="text-center p-10">Loading users...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">User Management</h2>
      
      {/* Filters */}
      <div className="mb-4 flex space-x-4">
        <input
          type="text"
          name="search"
          placeholder="Search by name or email"
          value={filters.search}
          onChange={handleFilterChange}
          className="p-2 border rounded w-1/3"
        />
        <select name="role" value={filters.role} onChange={handleFilterChange} className="p-2 border rounded">
          <option value="">All Roles</option>
          <option value="Tenant">Tenant</option>
          <option value="Landlord">Landlord</option>
          <option value="PropertyManager">PropertyManager</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approved</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {user.isApproved ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => { setSelectedUser(user); setNewRole(user.role); }} className="text-indigo-600 hover:text-indigo-900">Edit Role</button>
                  <button onClick={() => handleToggleStatus(user._id, user.isActive)} className={user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}>
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  {!user.isApproved && (
                    <button onClick={() => handleApproveUser(user._id)} className="text-blue-600 hover:text-blue-900">Approve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination (Simplified) */}
      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => handlePageChange(filters.page - 1)}
          disabled={filters.page <= 1}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {filters.page} of {totalPages}</span>
        <button
          onClick={() => handlePageChange(filters.page + 1)}
          disabled={filters.page >= totalPages}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Modal for Editing Role (Example) */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h3 className="text-lg font-medium mb-4">Edit Role for {selectedUser.name}</h3>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="p-2 border rounded w-full mb-4"
            >
              <option value="Tenant">Tenant</option>
              <option value="Landlord">Landlord</option>
              <option value="PropertyManager">PropertyManager</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setSelectedUser(null)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
              <button onClick={() => handleUpdateRole(selectedUser._id, newRole)} className="px-4 py-2 bg-blue-500 text-white rounded">Save Role</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagementPage;