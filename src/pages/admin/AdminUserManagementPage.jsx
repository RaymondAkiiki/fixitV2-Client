import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmationModal from '../../components/common/modals/ConfirmationModal.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { USER_ROLES, ROUTES } from '../../utils/constants.js';

// Import a rich set of icons for the new UI
import { Users, UserPlus, SlidersHorizontal, Edit, KeyRound, UserCheck, UserX, MoreVertical, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminUserManagementPage = () => {
  // --- STATE AND LOGIC (UNCHANGED) ---
  const { showSuccess, showError } = useGlobalAlert();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', page: 1, limit: 10 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const abortControllerRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true);
    try {
      const response = await adminService.getAllUsers({ ...filters, role: filters.role.toLowerCase() }, abortControllerRef.current.signal);
      const formattedUsers = Array.isArray(response.data) ? response.data.map(adminService.formatUser) : [];
      setUsers(formattedUsers);
      setTotalPages(response.pagination.pages);
      setTotalUsers(response.pagination.total);
    } catch (err) {
      if (err.name !== 'CanceledError') showError('Failed to load users: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  useEffect(() => {
    fetchUsers();
    return () => abortControllerRef.current?.abort();
  }, [filters.page, filters.limit]); // Re-fetch on page/limit change

  useEffect(() => {
    const handleDebounce = setTimeout(() => {
        if (filters.search || filters.role || filters.status) {
            fetchUsers();
        }
    }, 500); // Debounce search/filter requests
    return () => clearTimeout(handleDebounce);
  }, [filters.search, filters.role, filters.status, fetchUsers]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS (LOGIC UNCHANGED) ---
  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handleResetFilters = () => {
    setFilters({ search: '', role: '', status: '', page: 1, limit: 10 });
    // This will trigger a re-fetch via the useEffect for filters
  };

  const executeAction = async (action) => {
    setActionLoading(true);
    try {
      await action();
      fetchUsers();
    } catch (err) {
      showError(err.message || 'An error occurred.');
    } finally {
      setActionLoading(false);
      // Close all modals
      setShowRoleModal(false);
      setShowStatusModal(false);
      setShowApproveModal(false);
      setShowResetPasswordModal(false);
    }
  };

  const handleUpdateRole = () => executeAction(async () => {
    await adminService.updateUser(selectedUser._id, { role: newRole.toLowerCase() });
    showSuccess(`User role updated successfully!`);
  });
  const handleToggleStatus = () => executeAction(async () => {
    const isActivating = !selectedUser.isActive;
    await adminService.toggleUserStatus(selectedUser._id, isActivating);
    showSuccess(`User ${isActivating ? 'activated' : 'deactivated'} successfully!`);
  });
  const handleApproveUser = () => executeAction(async () => {
    await adminService.approveUser(selectedUser._id);
    showSuccess(`User approved successfully!`);
  });
  const handleResetPassword = () => executeAction(async () => {
    await adminService.resetUserPassword(selectedUser._id, newPassword);
    showSuccess(`Password reset successfully!`);
    setNewPassword('');
  });

  const openActionModal = (user, action) => {
    setSelectedUser(user);
    setActiveDropdown(null);
    switch (action) {
      case 'role': setNewRole(user.role); setShowRoleModal(true); break;
      case 'status': setShowStatusModal(true); break;
      case 'approve': setShowApproveModal(true); break;
      case 'password': setNewPassword(''); setShowResetPasswordModal(true); break;
      default: break;
    }
  };

  // --- RENDER LOGIC ---
  if (loading && users.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-[#f8fafc]"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      <div className="flex flex-wrap justify-between items-center mb-8 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-[#219377] flex items-center">
            <Users className="w-8 h-8 mr-3" /> User Management
          </h1>
          <p className="text-gray-500 mt-1">View, manage, and take action on all users in the system.</p>
        </div>
        <Link to={ROUTES.ADMIN_USER_CREATE}>
          <Button className="bg-[#219377] hover:bg-[#1a7c67] text-white">
            <UserPlus className="w-5 h-5 mr-2" /> Add New User
          </Button>
        </Link>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center"><SlidersHorizontal className="w-5 h-5 mr-2" /> Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input name="search" placeholder="Search by name or email..." value={filters.search} onChange={handleFilterChange} />
          <select name="role" value={filters.role} onChange={handleFilterChange} className="w-full p-2 border rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-[#e6f7f2] focus:border-[#219377]">
            <option value="">All Roles</option>
            {Object.keys(USER_ROLES).map(key => <option key={key} value={USER_ROLES[key]}>{key}</option>)}
          </select>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 border rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-[#e6f7f2] focus:border-[#219377]">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending_approval">Pending</option>
          </select>
          <Button onClick={handleResetFilters} variant="secondary"><RefreshCw className="w-4 h-4 mr-2" /> Reset</Button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-lg border border-[#e6f7f2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr className="text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              <th className="px-6 py-3">User</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Last Active</th><th className="px-6 py-3">Joined</th><th className="px-6 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4"><div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center font-bold text-[#219377]">
                      {user.avatar ? <img src={user.avatar} alt={user.displayName} className="h-full w-full object-cover" /> : <span>{user.initials}</span>}
                    </div>
                    <div className="ml-4">
                      <Link to={`${ROUTES.ADMIN_USERS}/${user._id}`} className="text-sm font-semibold text-gray-900 hover:text-[#219377]">{user.displayName}</Link>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.roleDisplay}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.statusClasses}`}>{user.statusDisplay}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.lastLoginFormatted || 'Never'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{user.createdAtFormatted}</td>
                  <td className="px-6 py-4 text-right relative">
                    <Button variant="icon" onClick={() => setActiveDropdown(activeDropdown === user._id ? null : user._id)}><MoreVertical className="w-5 h-5" /></Button>
                    {activeDropdown === user._id && <div ref={dropdownRef} className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <a href="#" onClick={e => { e.preventDefault(); openActionModal(user, 'role') }} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><Edit className="w-4 h-4 mr-2" />Change Role</a>
                        <a href="#" onClick={e => { e.preventDefault(); openActionModal(user, 'status') }} className={`block px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${user.isActive ? 'text-red-600' : 'text-green-600'}`}>{user.isActive ? <UserX className="w-4 h-4 mr-2" /> : <UserCheck className="w-4 h-4 mr-2" />}{user.isActive ? 'Deactivate' : 'Activate'}</a>
                        {user.status === 'pending_approval' && <a href="#" onClick={e => { e.preventDefault(); openActionModal(user, 'approve') }} className="text-yellow-600 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><UserCheck className="w-4 h-4 mr-2" />Approve</a>}
                        <a href="#" onClick={e => { e.preventDefault(); openActionModal(user, 'password') }} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><KeyRound className="w-4 h-4 mr-2" />Reset Password</a>
                      </div>
                    </div>}
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && <tr><td colSpan="6" className="py-10 text-center text-gray-500">No users found for the selected filters.</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-700">Page <span className="font-bold">{filters.page}</span> of <span className="font-bold">{totalPages}</span> ({totalUsers} users)</span>
          <div className="flex gap-2">
            <Button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page <= 1} variant="secondary"><ChevronLeft className="w-4 h-4 mr-1" />Previous</Button>
            <Button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page >= totalPages} variant="secondary">Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>}
      </section>

      <ConfirmationModal isOpen={showRoleModal} title="Change User Role" message={`Update role for ${selectedUser?.displayName}?`} confirmButtonClass="bg-blue-600" confirmText={actionLoading ? "Updating..." : "Update Role"} onConfirm={handleUpdateRole} onClose={() => setShowRoleModal(false)} customBody={<select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full mt-4 p-2 border rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-[#e6f7f2] focus:border-[#219377]">{Object.keys(USER_ROLES).map(key => <option key={key} value={USER_ROLES[key]}>{key}</option>)}</select>} />
      <ConfirmationModal isOpen={showStatusModal} title={`${selectedUser?.isActive ? 'Deactivate' : 'Activate'} User`} message={`Are you sure you want to ${selectedUser?.isActive ? 'deactivate' : 'activate'} ${selectedUser?.displayName}?`} confirmButtonClass={selectedUser?.isActive ? "bg-red-600" : "bg-green-600"} confirmText={actionLoading ? "Processing..." : (selectedUser?.isActive ? "Deactivate" : "Activate")} onConfirm={handleToggleStatus} onClose={() => setShowStatusModal(false)} />
      <ConfirmationModal isOpen={showApproveModal} title="Approve User" message={`Approve ${selectedUser?.displayName}? This will grant them access.`} confirmButtonClass="bg-[#ffbd59] text-black" confirmText={actionLoading ? "Approving..." : "Approve User"} onConfirm={handleApproveUser} onClose={() => setShowApproveModal(false)} />
      <ConfirmationModal isOpen={showResetPasswordModal} title="Reset User Password" message={`Set a new password for ${selectedUser?.displayName}.`} confirmText={actionLoading ? "Resetting..." : "Reset Password"} onConfirm={handleResetPassword} onClose={() => setShowResetPasswordModal(false)} customBody={<Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min. 8 chars)" className="mt-4" minLength={8} />} />
    </div>
  );
};

export default AdminUserManagementPage;