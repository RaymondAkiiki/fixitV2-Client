import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, XCircle, RefreshCw, Clock, UserPlus, Filter, Search, ChevronDown, CheckCircle, XCircle as XMark, AlertTriangle } from 'lucide-react';
import { getAllInvites, cancelInvite, resendInvite } from '../../services/inviteService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const InviteListPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();
  const { user } = useAuth();
  
  // State
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState({ 
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvites, setTotalInvites] = useState(0);

  // Get base URL for navigation based on user role
  const getBaseUrl = useCallback(() => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'propertymanager') return '/pm';
    if (user?.role === 'landlord') return '/landlord';
    return '';
  }, [user]);

  // Fetch invites data
  const fetchInvites = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = {
        ...filters,
        email: filters.search || undefined // Use search as email filter
      };
      
      const response = await getAllInvites(queryParams);
      
      setInvites(response.data || []);
      setTotalPages(response.pages || 1);
      setTotalInvites(response.total || 0);
    } catch (err) {
      console.error('Failed to load invites:', err);
      setError('Failed to load invites. Please try again.');
      setInvites([]);
      setTotalPages(1);
      setTotalInvites(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  // Initial load and when dependencies change
  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ 
      ...prev, 
      [name]: value,
      page: 1 // Reset to first page on filter change
    }));
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      status: '',
      search: '',
      page: 1,
      limit: 10
    });
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };
  
  // Open confirmation modal for an action
  const confirmActionHandler = (action, invite) => {
    setConfirmAction({
      type: action,
      invite,
      title: action === 'cancel' ? 'Cancel Invitation' : 'Resend Invitation',
      message: action === 'cancel' 
        ? `Are you sure you want to cancel the invitation sent to ${invite.email}?` 
        : `Are you sure you want to resend the invitation to ${invite.email}?`
    });
  };
  
  // Handle invite actions (cancel/revoke or resend)
  const handleInviteAction = async () => {
    if (!confirmAction) return;
    
    setProcessingAction(true);
    
    try {
      if (confirmAction.type === 'cancel') {
        await cancelInvite(confirmAction.invite._id);
        showSuccess(`Invitation to ${confirmAction.invite.email} has been cancelled.`);
      } else if (confirmAction.type === 'resend') {
        await resendInvite(confirmAction.invite._id);
        showSuccess(`Invitation to ${confirmAction.invite.email} has been resent.`);
      }
      
      // Refresh invites list
      fetchInvites();
    } catch (err) {
      console.error('Failed to perform action:', err);
      showError(`Failed to ${confirmAction.type === 'cancel' ? 'cancel' : 'resend'} invitation. Please try again.`);
    } finally {
      setProcessingAction(false);
      setConfirmAction(null);
    }
  };
  
  // Render status badge with appropriate styling
  const renderStatusBadge = (status) => {
    let bgColor, textColor, icon;
    
    switch (status?.toLowerCase()) {
      case 'pending':
        bgColor = 'bg-yellow-100';
        textColor = 'text-yellow-800';
        icon = <Clock className="w-3.5 h-3.5 mr-1" />;
        break;
      case 'accepted':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        icon = <CheckCircle className="w-3.5 h-3.5 mr-1" />;
        break;
      case 'expired':
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        icon = <AlertTriangle className="w-3.5 h-3.5 mr-1" />;
        break;
      case 'revoked':
      case 'cancelled':
        bgColor = 'bg-red-100';
        textColor = 'text-red-800';
        icon = <XMark className="w-3.5 h-3.5 mr-1" />;
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
        icon = null;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {icon}
        {status}
      </span>
    );
  };
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Mail className="mr-2 h-8 w-8" style={{ color: PRIMARY_COLOR }} />
          Invitation Management
        </h1>
        
        <Button
          onClick={() => navigate(`${getBaseUrl()}/invites/send`)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <UserPlus className="mr-2 h-5 w-5" /> Send New Invitation
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-700">Filters</h2>
          <button 
            onClick={resetFilters}
            className="ml-auto text-blue-600 flex items-center text-sm hover:underline"
          >
            Reset Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <div className="relative">
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="appearance-none w-full border border-gray-300 rounded-md py-2 px-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search by Email</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by email address"
                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Invites List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500 mb-4">{error}</div>
            <Button onClick={fetchInvites} className="bg-blue-600 hover:bg-blue-700 text-white">
              Try Again
            </Button>
          </div>
        ) : invites.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No invitations found</h3>
            <p className="text-gray-500">
              {filters.status || filters.search ? 
                "Try adjusting your filters or search terms." : 
                "No invitations have been sent yet."}
            </p>
            <Button
              onClick={() => navigate(`${getBaseUrl()}/invites/send`)}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
            >
              <UserPlus className="mr-2 h-5 w-5" /> Send Your First Invitation
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property / Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invites.map((invite) => (
                  <tr key={invite._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invite.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{invite.roleToInvite || invite.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {invite.property?.name || 'N/A'}
                        {invite.unit && ` / ${invite.unit.unitName || invite.unit.unitIdentifier || 'Unit'}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(invite.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invite.expiresAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {invite.status?.toLowerCase() === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => confirmActionHandler('resend', invite)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Resend"
                          >
                            <RefreshCw className="h-5 w-5" />
                          </Button>
                          <Button
                            onClick={() => confirmActionHandler('cancel', invite)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Cancel"
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && invites.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {invites.length} of {totalInvites} invitations
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className={`px-3 py-1 rounded-md ${
                  filters.page === 1 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 rounded-md ${
                      page === filters.page
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === totalPages}
                className={`px-3 py-1 rounded-md ${
                  filters.page === totalPages 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title || 'Confirm Action'}
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">{confirmAction?.message}</p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setConfirmAction(null)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              disabled={processingAction}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteAction}
              className={`${
                confirmAction?.type === 'cancel' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white px-4 py-2 rounded-lg flex items-center`}
              disabled={processingAction}
            >
              {processingAction ? 'Processing...' : confirmAction?.type === 'cancel' ? 'Cancel Invitation' : 'Resend Invitation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InviteListPage;