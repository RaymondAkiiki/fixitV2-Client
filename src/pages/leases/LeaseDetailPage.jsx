import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLease, useLeaseMutations, useLeaseDocuments } from '../../hooks/useLeases';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import Spinner from '../../components/common/Spinner';
import { USER_ROLES } from '../../utils/constants';
import { 
  FaEdit, FaTrash, FaFileDownload, FaFilePdf, 
  FaFileSignature, FaPrint, FaPlus, FaEnvelope,
  FaChevronLeft, FaExclamationTriangle, FaClock
} from 'react-icons/fa';

const LeaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  
  // State for document generation
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isShowingAmendmentForm, setIsShowingAmendmentForm] = useState(false);
  const [amendmentData, setAmendmentData] = useState({ description: '' });
  
  // Get current user role
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isPropertyManager = user?.role === USER_ROLES.PROPERTY_MANAGER;
  const isLandlord = user?.role === USER_ROLES.LANDLORD;
  const isTenant = user?.role === USER_ROLES.TENANT;
  const canEdit = isAdmin || isPropertyManager || isLandlord;
  
  // Fetch lease data
  const { data: lease, isLoading, isError, refetch } = useLease(id);
  
  // Get mutation functions
  const { 
    deleteLease, 
    isDeleting,
    markRenewalNoticeSent, 
    isMarkingRenewalSent,
    addAmendment,
    isAddingAmendment
  } = useLeaseMutations();
  
  // Get document utilities
  const { downloadDocument, generateDocument } = useLeaseDocuments();
  
  // Delete lease handler
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lease? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteLease(id);
      showSuccess('Lease deleted successfully');
      navigate('/leases');
    } catch (error) {
      showError('Failed to delete lease');
    }
  };
  
  // Mark renewal notice sent handler
  const handleMarkRenewalSent = async () => {
    try {
      await markRenewalNoticeSent(id);
      refetch();
    } catch (error) {
      showError('Failed to mark renewal notice as sent');
    }
  };
  
  // Download document handler
  const handleDownloadDocument = async (documentId) => {
    try {
      await downloadDocument(id, documentId);
    } catch (error) {
      showError('Failed to download document');
    }
  };
  
  // Generate document handler
  const handleGenerateDocument = async (documentType) => {
    setIsGeneratingDoc(true);
    try {
      const response = await generateDocument(id, documentType);
      if (response?.documentId) {
        await downloadDocument(id, response.documentId);
      }
    } catch (error) {
      showError('Failed to generate document');
    } finally {
      setIsGeneratingDoc(false);
    }
  };
  
  // Add amendment handler
  const handleAddAmendment = async (e) => {
    e.preventDefault();
    if (!amendmentData.description.trim()) {
      showError('Amendment description is required');
      return;
    }
    
    try {
      await addAmendment({ leaseId: id, amendmentData });
      setAmendmentData({ description: '' });
      setIsShowingAmendmentForm(false);
      refetch();
      showSuccess('Amendment added successfully');
    } catch (error) {
      showError('Failed to add amendment');
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
        <span className="ml-2">Loading lease details...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-center">
          An error occurred while loading lease details. Please try again.
        </div>
        <div className="mt-4 text-center">
          <Link to="/leases" className="inline-flex items-center text-blue-600">
            <FaChevronLeft className="mr-1" /> Back to Leases
          </Link>
        </div>
      </div>
    );
  }
  
  if (!lease) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md text-center">
          No lease found with the specified ID.
        </div>
        <div className="mt-4 text-center">
          <Link to="/leases" className="inline-flex items-center text-blue-600">
            <FaChevronLeft className="mr-1" /> Back to Leases
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/leases" className="mr-4 text-blue-600 hover:text-blue-800">
            <FaChevronLeft /> Back
          </Link>
          <h1 className="text-2xl font-bold">Lease Details</h1>
        </div>
        
        {canEdit && (
          <div className="flex space-x-2">
            <Link
              to={`/leases/${id}/edit`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaEdit className="mr-2" />
              Edit Lease
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? <Spinner size="sm" className="mr-2" /> : <FaTrash className="mr-2" />}
              Delete
            </button>
          </div>
        )}
      </div>
      
      {/* Status banner */}
      <div className={`mb-6 p-4 rounded-md ${lease.statusClass} flex items-center justify-between`}>
        <div className="flex items-center">
          <span className="font-bold mr-2">Status:</span> {lease.statusDisplay}
        </div>
        
        {lease.status === 'active' && lease.daysRemaining > 0 && (
          <div className="flex items-center">
            <FaClock className="mr-2" />
            <span>{lease.daysRemaining} days remaining</span>
          </div>
        )}
      </div>
      
      {/* Expiry warning if approaching */}
      {lease.status === 'active' && lease.daysRemaining <= 60 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
          <FaExclamationTriangle className="text-yellow-500 mr-3 text-xl" />
          <div>
            <h3 className="font-semibold text-yellow-700">Lease Expiring Soon</h3>
            <p className="text-yellow-600">
              This lease will expire in {lease.daysRemaining} days on {lease.formattedEndDate}.
            </p>
          </div>
          
          {canEdit && (
            <div className="ml-auto">
              {lease.renewalNoticeSent ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Renewal Notice Sent
                </span>
              ) : (
                <button
                  onClick={handleMarkRenewalSent}
                  disabled={isMarkingRenewalSent}
                  className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 disabled:opacity-50"
                >
                  {isMarkingRenewalSent ? (
                    <Spinner size="sm" className="mr-1" />
                  ) : (
                    <FaEnvelope className="mr-1" />
                  )}
                  Mark Renewal Notice Sent
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Main Lease Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Lease Information</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="font-medium">{lease.formattedStartDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className="font-medium">{lease.formattedEndDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Monthly Rent</p>
              <p className="font-medium">{lease.formattedRent}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Security Deposit</p>
              <p className="font-medium">{lease.formattedDeposit}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Due Day</p>
              <p className="font-medium">{lease.paymentDueDay || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Late Fee</p>
              <p className="font-medium">
                {lease.lateFee ? `${lease.currency} ${lease.lateFee}` : 'N/A'}
                {lease.gracePeriod ? ` (${lease.gracePeriod} days grace)` : ''}
              </p>
            </div>
          </div>
          
          {lease.terms && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Terms & Conditions</p>
              <p className="text-sm mt-1">{lease.terms}</p>
            </div>
          )}
          
          {lease.notes && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-sm mt-1">{lease.notes}</p>
            </div>
          )}
        </div>
        
        {/* Property & Tenant Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Property & Unit</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Property</p>
                <p className="font-medium">{lease.propertyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Unit</p>
                <p className="font-medium">{lease.unitName}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Tenant Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tenant</p>
                <p className="font-medium">{lease.tenantName}</p>
              </div>
              {lease.tenant?.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{lease.tenant.email}</p>
                </div>
              )}
              {lease.tenant?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{lease.tenant.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Documents Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Documents</h2>
          
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setIsGeneratingDoc(!isGeneratingDoc)}
                disabled={isGeneratingDoc}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isGeneratingDoc ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <FaFilePdf className="mr-2" />
                )}
                Generate Document
              </button>
              
              {isGeneratingDoc && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-xl z-20">
                  <button
                    onClick={() => handleGenerateDocument('lease_agreement')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Lease Agreement
                  </button>
                  <button
                    onClick={() => handleGenerateDocument('welcome_letter')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Welcome Letter
                  </button>
                  <button
                    onClick={() => handleGenerateDocument('renewal_notice')}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    Renewal Notice
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {lease.hasDocuments ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lease.documents?.map((doc) => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {doc.fileName || 'Document'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {doc.documentType || 'Document'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDownloadDocument(doc._id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download Document"
                      >
                        <FaFileDownload />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaFileSignature className="mx-auto text-gray-300 text-4xl mb-3" />
            <p>No documents have been uploaded for this lease.</p>
          </div>
        )}
      </div>
      
      {/* Amendments Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Amendments</h2>
          
          {canEdit && (
            <button
              onClick={() => setIsShowingAmendmentForm(!isShowingAmendmentForm)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaPlus className="mr-2" />
              Add Amendment
            </button>
          )}
        </div>
        
        {isShowingAmendmentForm && (
          <div className="mb-6 p-4 border border-gray-200 rounded-md">
            <h3 className="text-lg font-medium mb-2">Add New Amendment</h3>
            <form onSubmit={handleAddAmendment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="description">
                  Amendment Description*
                </label>
                <textarea
                  id="description"
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  value={amendmentData.description}
                  onChange={(e) => setAmendmentData({...amendmentData, description: e.target.value})}
                  required
                ></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsShowingAmendmentForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingAmendment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingAmendment ? <Spinner size="sm" /> : 'Save Amendment'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {lease.hasAmendments ? (
          <div className="space-y-4">
            {lease.amendments?.map((amendment, index) => (
              <div key={amendment._id || index} className="p-4 border border-gray-200 rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">
                    Added on {new Date(amendment.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-sm font-medium">
                    Amendment #{index + 1}
                  </span>
                </div>
                <p className="mt-2">{amendment.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FaFileSignature className="mx-auto text-gray-300 text-4xl mb-3" />
            <p>No amendments have been added to this lease.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaseDetailPage;