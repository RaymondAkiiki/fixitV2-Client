import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Package, Phone, Mail, MapPin, Info, Edit, User, Wrench, Star, Calendar, AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { getVendorById, rateVendor } from '../../services/vendorService';
import { getAllRequests } from '../../services/requestService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const VendorDetailPage = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();
  const { user } = useAuth();
  
  const [vendor, setVendor] = useState(null);
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Rating modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  
  // Permissions based on role
  const canEditVendor = ['admin', 'propertymanager', 'landlord'].includes(user?.role);
  const canRateVendor = ['admin', 'propertymanager', 'landlord'].includes(user?.role);
  
  // Get base URL for routing based on user role
  const getBaseUrl = useCallback(() => {
    if (user?.role === 'admin') return '/admin';
    if (user?.role === 'propertymanager') return '/pm';
    if (user?.role === 'landlord') return '/landlord';
    return '';
  }, [user]);
  
  // Fetch vendor data and assigned requests
  const fetchVendorData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch vendor details
      const vendorData = await getVendorById(vendorId);
      setVendor(vendorData);
      
      // Fetch requests assigned to this vendor
      const requestsParams = {
        assignedToId: vendorId,
        assignedToModel: 'Vendor',
        limit: 10,
        sort: '-updatedAt'
      };
      
      const requestsResponse = await getAllRequests(requestsParams);
      const requestsData = Array.isArray(requestsResponse) 
        ? requestsResponse 
        : (requestsResponse.requests || requestsResponse.data || []);
      
      setAssignedRequests(requestsData);
    } catch (err) {
      console.error('Failed to load vendor details:', err);
      setError('Failed to load vendor details. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [vendorId]);
  
  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);
  
  // Submit a rating for the vendor
  const handleRateVendor = async () => {
    if (rating === 0) {
      showError('Please select a rating between 1 and 5 stars');
      return;
    }
    
    setIsSubmittingRating(true);
    try {
      await rateVendor(vendorId, {
        rating,
        comment: ratingComment.trim() || undefined
      });
      
      showSuccess('Vendor rating submitted successfully');
      setShowRatingModal(false);
      setRating(0);
      setRatingComment('');
      
      // Refresh vendor data to show updated rating
      fetchVendorData();
    } catch (err) {
      console.error('Failed to submit vendor rating:', err);
      showError('Failed to submit rating: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmittingRating(false);
    }
  };
  
  // Calculate vendor stats
  const calculateVendorStats = () => {
    if (!vendor || !assignedRequests || assignedRequests.length === 0) {
      return {
        totalRequests: 0,
        completedRequests: 0,
        completionRate: 0,
        averageRating: vendor?.rating?.average || 0,
        ratingCount: vendor?.rating?.count || 0
      };
    }
    
    const completed = assignedRequests.filter(req => 
      ['completed', 'verified'].includes(req.status?.toLowerCase())
    ).length;
    
    return {
      totalRequests: assignedRequests.length,
      completedRequests: completed,
      completionRate: Math.round((completed / assignedRequests.length) * 100),
      averageRating: vendor.rating?.average || 0,
      ratingCount: vendor.rating?.count || 0
    };
  };
  
  const vendorStats = calculateVendorStats();
  
  // Handle navigation back to vendors list
  const handleBackToList = () => {
    navigate(`${getBaseUrl()}/vendors`);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" color={PRIMARY_COLOR} />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Vendor</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={handleBackToList}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }
  
  if (!vendor) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Vendor Not Found</h2>
          <p className="text-gray-600 mb-6">The vendor you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button
            onClick={handleBackToList}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Vendors
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={handleBackToList}
          className="text-blue-600 hover:text-blue-800 flex items-center mb-4"
        >
          <ChevronRight className="h-5 w-5 transform rotate-180 mr-1" />
          Back to Vendors
        </button>
        
        <div className="flex flex-wrap justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-2">
            <Package className="mr-2 h-8 w-8" style={{ color: PRIMARY_COLOR }} />
            {vendor.name}
            <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
              vendor.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {vendor.active ? 'Active' : 'Inactive'}
            </span>
          </h1>
          
          <div className="flex space-x-3">
            {canRateVendor && (
              <Button
                onClick={() => setShowRatingModal(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Star className="mr-2 h-5 w-5" /> Rate Vendor
              </Button>
            )}
            
            {canEditVendor && (
              <Button
                onClick={() => navigate(`${getBaseUrl()}/vendors/edit/${vendor._id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Edit className="mr-2 h-5 w-5" /> Edit Vendor
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vendor Overview */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Info className="mr-2 h-5 w-5 text-blue-500" /> Vendor Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-gray-700">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-500 mr-2" />
                <span className="font-medium">Contact Person:</span>
                <span className="ml-2">{vendor.contactPerson || 'N/A'}</span>
              </div>
              
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-gray-500 mr-2" />
                <span className="font-medium">Email:</span>
                <a href={`mailto:${vendor.email}`} className="ml-2 text-blue-600 hover:underline">
                  {vendor.email}
                </a>
              </div>
              
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-gray-500 mr-2" />
                <span className="font-medium">Phone:</span>
                <a href={`tel:${vendor.phone}`} className="ml-2 text-blue-600 hover:underline">
                  {vendor.phone || 'N/A'}
                </a>
              </div>
              
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                <span className="font-medium">Added On:</span>
                <span className="ml-2">{formatDate(vendor.createdAt)}</span>
              </div>
              
              <div className="flex items-start md:col-span-2">
                <MapPin className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                <span className="font-medium">Address:</span>
                <span className="ml-2">{vendor.address || 'N/A'}</span>
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center mb-2">
                  <Info className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="font-medium">Description:</span>
                </div>
                <p className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {vendor.description || 'No description provided.'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Services Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Wrench className="mr-2 h-5 w-5 text-blue-500" /> Services Provided
            </h2>
            
            {vendor.services && vendor.services.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {vendor.services.map((service, index) => (
                  <div key={index} className="flex items-center bg-blue-50 p-3 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="text-blue-800 capitalize">{service.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No services listed for this vendor.</p>
            )}
          </div>
          
          {/* Assigned Requests Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Wrench className="mr-2 h-5 w-5 text-blue-500" /> Recent Service Requests
              </h2>
              
              <Link 
                to={`${getBaseUrl()}/requests?assignedToId=${vendor._id}&assignedToModel=Vendor`}
                className="text-blue-600 hover:underline flex items-center"
              >
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            {assignedRequests.length === 0 ? (
              <p className="text-gray-500 italic text-center py-4">
                No service requests have been assigned to this vendor yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property / Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {assignedRequests.slice(0, 5).map((request) => (
                      <tr key={request._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{request.title}</div>
                          <div className="text-sm text-gray-500 capitalize">{request.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {request.property?.name || 'N/A'}
                            {request.unit && ` / ${request.unit.unitName}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            request.status === 'completed' || request.status === 'verified' 
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'in_progress' 
                                ? 'bg-yellow-100 text-yellow-800'
                                : request.status === 'new' || request.status === 'assigned'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status?.replace(/_/g, ' ').toUpperCase() || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            to={`${getBaseUrl()}/requests/${request._id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Performance Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance</h2>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Rating</span>
                  <span className="text-sm font-medium flex items-center">
                    {vendorStats.averageRating ? vendorStats.averageRating.toFixed(1) : 'N/A'}
                    {vendorStats.averageRating > 0 && (
                      <Star className="h-4 w-4 ml-1 text-yellow-500" />
                    )}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-yellow-500 h-2.5 rounded-full"
                    style={{ width: `${(vendorStats.averageRating / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Based on {vendorStats.ratingCount} ratings
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">Completion Rate</span>
                  <span className="text-sm font-medium">{vendorStats.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-green-500 h-2.5 rounded-full"
                    style={{ width: `${vendorStats.completionRate}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {vendorStats.completedRequests} of {vendorStats.totalRequests} requests completed
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Total Requests</div>
                <div className="text-2xl font-bold">{vendorStats.totalRequests}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Completed</div>
                <div className="text-2xl font-bold">{vendorStats.completedRequests}</div>
              </div>
            </div>
          </div>
          
          {/* Associated Properties (if available) */}
          {vendor.associatedProperties && vendor.associatedProperties.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Associated Properties</h2>
              
              <ul className="divide-y divide-gray-200">
                {vendor.associatedProperties.map((property, index) => (
                  <li key={index} className="py-2">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Home className="h-5 w-5 text-gray-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {typeof property === 'string' ? property : (property.name || 'Unknown Property')}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Recently Completed Jobs */}
          {assignedRequests.filter(req => ['completed', 'verified'].includes(req.status?.toLowerCase())).length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Recently Completed</h2>
              
              <ul className="divide-y divide-gray-200">
                {assignedRequests
                  .filter(req => ['completed', 'verified'].includes(req.status?.toLowerCase()))
                  .slice(0, 5)
                  .map((request) => (
                    <li key={request._id} className="py-3">
                      <Link to={`${getBaseUrl()}/requests/${request._id}`} className="block hover:bg-gray-50">
                        <div className="flex items-center">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{request.title}</p>
                            <p className="text-sm text-gray-500">
                              {request.property?.name}{request.unit ? ` / ${request.unit.unitName}` : ''}
                            </p>
                          </div>
                          <div className="ml-3 flex-shrink-0">
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                              {formatDate(request.updatedAt || request.completedAt)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      {/* Rating Modal */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Rate Vendor"
      >
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            How would you rate your experience with {vendor.name}?
          </p>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 ${
                  rating >= star ? 'text-yellow-500' : 'text-gray-300'
                } hover:text-yellow-500`}
              >
                <Star className="h-10 w-10" />
              </button>
            ))}
          </div>
          
          <div className="mb-4">
            <label htmlFor="ratingComment" className="block text-sm font-medium text-gray-700 mb-1">
              Comments (Optional)
            </label>
            <textarea
              id="ratingComment"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Share your experience working with this vendor..."
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowRatingModal(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
              disabled={isSubmittingRating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRateVendor}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center"
              disabled={isSubmittingRating || rating === 0}
            >
              {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorDetailPage;