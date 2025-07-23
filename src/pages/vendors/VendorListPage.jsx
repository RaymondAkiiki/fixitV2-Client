import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, PlusCircle, Search, Filter, RotateCcw, Edit, Trash2, Star, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { getAllVendors, deleteVendor, getVendorStats } from '../../services/vendorService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { useAuth } from '../../contexts/AuthContext';
import useDebounce from '../../hooks/useDebounce';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

// Service categories options
const SERVICE_CATEGORIES = [
  'plumbing',
  'electrical',
  'hvac',
  'appliance',
  'structural',
  'landscaping',
  'other',
  'cleaning',
  'security',
  'pest_control',
];

const VendorListPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useGlobalAlert();
  const { user } = useAuth();
  
  // State
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    search: '',
    service: '',
    active: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVendors, setTotalVendors] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  // Search debounce
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // Get base URL for routing based on user role
  const getBaseUrl = useCallback(() => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'propertymanager') return '/pm';
    if (user?.role === 'landlord') return '/landlord';
    return '';
  }, [user]);
  
  // Check permissions based on role
  const canAddVendor = user?.role !== 'tenant';
  const canEditVendor = user?.role !== 'tenant';
  const canDeleteVendor = ['admin', 'propertymanager'].includes(user?.role);
  
  // Fetch vendors based on current filters and pagination
  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch,
        service: filters.service || undefined,
        active: filters.active || undefined,
      };
      
      const response = await getAllVendors(queryParams);
      
      setVendors(response.data || []);
      setTotalVendors(response.total || 0);
      setTotalPages(response.pages || Math.ceil(response.total / itemsPerPage) || 1);
      
      // Also fetch vendor stats
      try {
        const statsData = await getVendorStats();
        setStats(statsData);
      } catch (statsErr) {
        console.error('Failed to load vendor stats:', statsErr);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
      showError('Failed to load vendors. Please try again.');
      setVendors([]);
      setTotalVendors(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, filters.service, filters.active, showError]);
  
  // Initial load and when dependencies change
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      search: '',
      service: '',
      active: '',
    });
    setCurrentPage(1);
  };
  
  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  // Delete vendor
  const handleDeleteClick = (vendor) => {
    setVendorToDelete(vendor);
    setShowDeleteModal(true);
  };
  
  const confirmDelete = async () => {
    if (!vendorToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteVendor(vendorToDelete._id);
      showSuccess(`Vendor "${vendorToDelete.name}" was deleted successfully`);
      setShowDeleteModal(false);
      setVendorToDelete(null);
      fetchVendors(); // Refresh list
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      showError('Failed to delete vendor: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Package className="mr-2 h-8 w-8" style={{ color: PRIMARY_COLOR }} />
          Vendor Management
        </h1>
        
        {canAddVendor && (
          <Button
            onClick={() => navigate(`${getBaseUrl()}/vendors/add`)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Add New Vendor
          </Button>
        )}
      </div>
      
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-1">Total Vendors</div>
            <div className="text-2xl font-bold">{stats.totalVendors || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-1">Active Vendors</div>
            <div className="text-2xl font-bold">{stats.activeVendors || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-1">Top Service</div>
            <div className="text-2xl font-bold capitalize">{stats.topService || 'N/A'}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500 mb-1">Avg. Rating</div>
            <div className="text-2xl font-bold flex items-center">
              {stats.averageRating?.toFixed(1) || 'N/A'}
              {stats.averageRating && <Star className="h-5 w-5 ml-1 text-yellow-500" />}
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 mr-2 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-700">Filters</h2>
          <button 
            onClick={resetFilters}
            className="ml-auto text-blue-600 flex items-center text-sm hover:underline"
          >
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by name, email or contact"
                className="pl-10 w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
            <select
              name="service"
              value={filters.service}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Services</option>
              {SERVICE_CATEGORIES.map(service => (
                <option key={service} value={service}>
                  {service.charAt(0).toUpperCase() + service.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="active"
              value={filters.active}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No vendors found</h3>
            <p className="text-gray-500">
              {filters.search || filters.service || filters.active ? 
                "Try adjusting your filters or search terms." : 
                "No vendors are available yet."}
            </p>
            {canAddVendor && (
              <Button
                onClick={() => navigate(`${getBaseUrl()}/vendors/add`)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center"
              >
                <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Vendor
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                          <div className="text-sm text-gray-500">{vendor.contactPerson || 'No contact person'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{vendor.email}</div>
                      <div className="text-sm text-gray-500">{vendor.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {vendor.services && vendor.services.length > 0 ? (
                          vendor.services.slice(0, 3).map((service, idx) => (
                            <span key={idx} className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 capitalize">
                              {service.replace('_', ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No services listed</span>
                        )}
                        {vendor.services && vendor.services.length > 3 && (
                          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            +{vendor.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        vendor.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {vendor.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => navigate(`${getBaseUrl()}/vendors/${vendor._id}`)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </Button>
                        
                        {canEditVendor && (
                          <Button
                            onClick={() => navigate(`${getBaseUrl()}/vendors/edit/${vendor._id}`)}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </Button>
                        )}
                        
                        {canDeleteVendor && (
                          <Button
                            onClick={() => handleDeleteClick(vendor)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && vendors.length > 0 && (
          <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  currentPage >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * itemsPerPage, totalVendors)}
                  </span>{" "}
                  of <span className="font-medium">{totalVendors}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                      currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNumber = idx + 1;
                    const isActive = pageNumber === currentPage;
                    
                    // Show limited page numbers for better UX
                    if (
                      pageNumber === 1 ||
                      pageNumber === totalPages ||
                      (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            isActive
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    }
                    
                    // Add ellipsis
                    if (
                      (pageNumber === 2 && currentPage > 3) ||
                      (pageNumber === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <span
                          key={`ellipsis-${pageNumber}`}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    
                    return null;
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                      currentPage >= totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Vendor"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete <span className="font-semibold">{vendorToDelete?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Vendor'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorListPage;