import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as onboardingService from '../../services/onboardingService';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import Spinner from '../../components/common/Spinner';
import { 
  FaArrowLeft, FaDownload, FaEdit, FaTrash, FaCheck, 
  FaBuilding, FaHome, FaUser, FaEye, FaCalendarAlt, FaTag
} from 'react-icons/fa';

export default function OnboardingDetailPage() {
  const { documentId } = useParams();
  const { showSuccess, showError } = useGlobalAlert();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isPropertyManager = user?.role === USER_ROLES.PROPERTY_MANAGER;
  const isLandlord = user?.role === USER_ROLES.LANDLORD;
  const isTenant = user?.role === USER_ROLES.TENANT;
  
  // Determine if the current user can edit/delete the document
  const canManageDocument = isAdmin || isPropertyManager || isLandlord;
  
  // Fetch document data
  const fetchDocument = useCallback(async () => {
    if (!documentId) return;
    
    setLoading(true);
    try {
      const data = await onboardingService.getOnboardingById(documentId);
      setDocument(data);
    } catch (error) {
      console.error('Error fetching document:', error);
      showError(error.message || 'Failed to load document');
      navigate('/onboarding');
    } finally {
      setLoading(false);
    }
  }, [documentId, navigate, showError]);
  
  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);
  
  // Handle document download
  const handleDownload = async () => {
    if (!document) return;
    
    try {
      setProcessingAction(true);
      const downloadInfo = await onboardingService.getOnboardingDocumentDownloadInfo(documentId);
      await onboardingService.downloadOnboardingDocument(downloadInfo.downloadUrl, downloadInfo.fileName);
      showSuccess('Document download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      showError('Failed to download document');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Handle document completion
  const handleMarkAsCompleted = async () => {
    if (!document || document.isCompleted) return;
    
    try {
      setProcessingAction(true);
      await onboardingService.markOnboardingCompleted(documentId);
      showSuccess('Document marked as completed');
      fetchDocument(); // Refresh document data
    } catch (error) {
      console.error('Error marking document as completed:', error);
      showError('Failed to mark document as completed');
    } finally {
      setProcessingAction(false);
    }
  };
  
  // Handle document deletion
  const handleDelete = async () => {
    if (!document || !canManageDocument) return;
    
    if (!window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }
    
    try {
      setProcessingAction(true);
      await onboardingService.deleteOnboarding(documentId);
      showSuccess('Document deleted successfully');
      navigate('/onboarding');
    } catch (error) {
      console.error('Error deleting document:', error);
      showError('Failed to delete document');
      setProcessingAction(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
        <span className="ml-2">Loading document...</span>
      </div>
    );
  }
  
  if (!document) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-lg text-gray-600">Document not found.</p>
          <Link to="/onboarding" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Onboarding
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/onboarding" className="mr-4 text-blue-600">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">{document.title}</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Document status banner */}
          <div className={`px-4 py-2 text-sm font-medium ${document.statusClass}`}>
            {document.statusDisplay}
          </div>
          
          {/* Document content */}
          <div className="p-6">
            {/* Document metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start">
                <FaTag className="mt-1 mr-2 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{document.categoryDisplay}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FaCalendarAlt className="mt-1 mr-2 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Date Added</p>
                  <p className="font-medium">{document.formattedCreatedAt}</p>
                </div>
              </div>
              
              {document.isCompleted && (
                <div className="flex items-start">
                  <FaCheck className="mt-1 mr-2 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Completed On</p>
                    <p className="font-medium">{document.formattedCompletedAt}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <FaUser className="mt-1 mr-2 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-medium">{document.creatorName}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <FaEye className="mt-1 mr-2 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Visibility</p>
                  <p className="font-medium">{document.visibilityDisplay}</p>
                </div>
              </div>
              
              {document.propertyName !== 'All Properties' && (
                <div className="flex items-start">
                  <FaBuilding className="mt-1 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Property</p>
                    <p className="font-medium">{document.propertyName}</p>
                  </div>
                </div>
              )}
              
              {document.unitName !== 'All Units' && (
                <div className="flex items-start">
                  <FaHome className="mt-1 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Unit</p>
                    <p className="font-medium">{document.unitName}</p>
                  </div>
                </div>
              )}
              
              {document.tenantName !== 'All Tenants' && (
                <div className="flex items-start">
                  <FaUser className="mt-1 mr-2 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Specific Tenant</p>
                    <p className="font-medium">{document.tenantName}</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Document description */}
            {document.description && (
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-2">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{document.description}</p>
              </div>
            )}
            
            {/* Document file */}
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Document</h2>
              <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-blue-600 mr-4">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-medium">{document.fileName}</p>
                    <p className="text-sm text-gray-500">Click to download</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={processingAction}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaDownload />
                </button>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-wrap justify-between mt-8">
              <div className="space-x-2 mb-2">
                {canManageDocument && (
                  <>
                    <Link
                      to={`/onboarding/edit/${documentId}`}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <FaEdit className="mr-2" />
                      Edit
                    </Link>
                    
                    <button
                      onClick={handleDelete}
                      disabled={processingAction}
                      className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md bg-white text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FaTrash className="mr-2" />
                      Delete
                    </button>
                  </>
                )}
              </div>
              
              <div className="space-x-2 mb-2">
                <button
                  onClick={handleDownload}
                  disabled={processingAction}
                  className="inline-flex items-center px-4 py-2 border border-blue-600 rounded-md bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaDownload className="mr-2" />
                  Download
                </button>
                
                {isTenant && !document.isCompleted && (
                  <button
                    onClick={handleMarkAsCompleted}
                    disabled={processingAction}
                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaCheck className="mr-2" />
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}