import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Edit, Trash2, MessageSquare, Play, Pause, Clock, UserCheck, PlusCircle, FileText, Download, Share2, Check, XCircle } from 'lucide-react';
import { 
  getScheduledMaintenanceById, 
  addScheduledMaintenanceComment, 
  pauseScheduledMaintenance, 
  resumeScheduledMaintenance,
  createRequestFromScheduledMaintenance,
  enableScheduledMaintenancePublicLink,
  disableScheduledMaintenancePublicLink,
  deleteScheduledMaintenance
} from '../../services/scheduledMaintenanceService';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

// Constants
const PRIMARY_COLOR = '#219377';
const SECONDARY_COLOR = '#ffbd59';

const ScheduledMaintenanceDetailPage = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();
  const { user } = useAuth();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCreateRequestModal, setShowCreateRequestModal] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const [publicLinkDays, setPublicLinkDays] = useState(7);
  
  // Check permissions
  const isAdmin = user?.role === 'admin';
  const isPropertyManager = user?.role === 'propertymanager';
  const isLandlord = user?.role === 'landlord';
  const isTenant = user?.role === 'tenant';
  
  const canEdit = isAdmin || isPropertyManager || isLandlord;
  const canDelete = isAdmin || isPropertyManager || isLandlord;
  const canChangeStatus = isAdmin || isPropertyManager || isLandlord;
  const canCreateRequest = isAdmin || isPropertyManager || isLandlord;
  
  // Get base URL for navigation
  const getBaseUrl = () => {
    if (isAdmin) return '/admin';
    if (isPropertyManager) return '/pm';
    if (isLandlord) return '/landlord';
    if (isTenant) return '/tenant';
    return '';
  };
  
  // Fetch task details
  const fetchTaskDetails = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getScheduledMaintenanceById(taskId);
      setTask(data);
    } catch (error) {
      console.error('Failed to fetch task details:', error);
      showError('Failed to load task details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [taskId, showError]);
  
  // Load task on mount
  useEffect(() => {
    if (taskId) {
      fetchTaskDetails();
    }
  }, [taskId, fetchTaskDetails]);
  
  // Handle comment submission
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setIsAddingComment(true);
    try {
      await addScheduledMaintenanceComment(taskId, commentText, false);
      showSuccess('Comment added successfully');
      setCommentText('');
      fetchTaskDetails(); // Refresh task to show new comment
    } catch (error) {
      console.error('Failed to add comment:', error);
      showError('Failed to add comment. Please try again.');
    } finally {
      setIsAddingComment(false);
    }
  };
  
  // Handle task pause/resume
  const handleToggleStatus = async (action) => {
    setIsActionInProgress(true);
    try {
      if (action === 'pause') {
        await pauseScheduledMaintenance(taskId);
        showSuccess('Task paused successfully');
      } else if (action === 'resume') {
        await resumeScheduledMaintenance(taskId);
        showSuccess('Task resumed successfully');
      }
      fetchTaskDetails(); // Refresh task with updated status
    } catch (error) {
      console.error(`Failed to ${action} task:`, error);
      showError(`Failed to ${action} task. Please try again.`);
    } finally {
      setIsActionInProgress(false);
    }
  };
  
  // Handle task deletion
  const handleDeleteTask = async () => {
    setIsActionInProgress(true);
    try {
      await deleteScheduledMaintenance(taskId);
      showSuccess('Task deleted successfully');
      navigate(`${getBaseUrl()}/scheduled-maintenance`);
    } catch (error) {
      console.error('Failed to delete task:', error);
      showError('Failed to delete task. Please try again.');
      setIsActionInProgress(false);
      setShowDeleteModal(false);
    }
  };
  
  // Handle public link generation
  const handleGeneratePublicLink = async () => {
    setIsActionInProgress(true);
    try {
      const response = await enableScheduledMaintenancePublicLink(taskId, publicLinkDays);
      setPublicLink(response.publicLink);
      showSuccess('Public link generated successfully');
    } catch (error) {
      console.error('Failed to generate public link:', error);
      showError('Failed to generate public link. Please try again.');
    } finally {
      setIsActionInProgress(false);
    }
  };
  
  // Handle public link disabling
  const handleDisablePublicLink = async () => {
    setIsActionInProgress(true);
    try {
      await disableScheduledMaintenancePublicLink(taskId);
      setPublicLink('');
      showSuccess('Public link disabled successfully');
    } catch (error) {
      console.error('Failed to disable public link:', error);
      showError('Failed to disable public link. Please try again.');
    } finally {
      setIsActionInProgress(false);
    }
  };
  
  // Handle create maintenance request
  const handleCreateRequest = async () => {
    setIsActionInProgress(true);
    try {
      await createRequestFromScheduledMaintenance(taskId);
      showSuccess('Maintenance request created successfully');
      fetchTaskDetails(); // Refresh task
      setShowCreateRequestModal(false);
    } catch (error) {
      console.error('Failed to create maintenance request:', error);
      showError('Failed to create maintenance request. Please try again.');
    } finally {
      setIsActionInProgress(false);
    }
  };
  
  // Copy public link to clipboard
  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicLink);
    showSuccess('Link copied to clipboard');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Not Found</h2>
          <p className="text-gray-600 mb-6">The scheduled maintenance task you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button
            onClick={() => navigate(`${getBaseUrl()}/scheduled-maintenance`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Scheduled Maintenance
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6 flex flex-wrap justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-2 sm:mb-0">
          <Calendar className="mr-2 h-8 w-8" style={{ color: PRIMARY_COLOR }} />
          {task.title}
        </h1>
        
        <div className="flex space-x-2">
          {canEdit && (
            <Button
              onClick={() => navigate(`${getBaseUrl()}/scheduled-maintenance/edit/${taskId}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg flex items-center"
            >
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          
          {canChangeStatus && task.status !== 'completed' && task.status !== 'canceled' && (
            <Button
              onClick={() => handleToggleStatus(task.status === 'paused' ? 'resume' : 'pause')}
              className={`${
                task.status === 'paused' ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
              } text-white px-3 py-2 rounded-lg flex items-center`}
              disabled={isActionInProgress}
            >
              {task.status === 'paused' ? (
                <>
                  <Play className="mr-2 h-4 w-4" /> Resume
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Pause
                </>
              )}
            </Button>
          )}
          
          {canCreateRequest && (
            <Button
              onClick={() => setShowCreateRequestModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center"
              disabled={isActionInProgress}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Create Request
            </Button>
          )}
          
          {canDelete && (
            <Button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center"
              disabled={isActionInProgress}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Task Details</h2>
            
            <div className="prose max-w-full">
              <p className="whitespace-pre-line">{task.description}</p>
            </div>
            
            {task.publicAccessUrl && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-medium text-blue-800 flex items-center mb-2">
                  <Share2 className="h-4 w-4 mr-1" /> Public Access Link
                </h3>
                <div className="flex items-center">
                  <input 
                    type="text" 
                    value={task.publicAccessUrl} 
                    readOnly
                    className="flex-1 text-sm border border-gray-300 rounded-md py-1 px-2"
                  />
                  <Button
                    onClick={() => navigator.clipboard.writeText(task.publicAccessUrl)}
                    className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm"
                  >
                    Copy
                  </Button>
                  {canEdit && (
                    <Button
                      onClick={handleDisablePublicLink}
                      className="ml-2 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                      disabled={isActionInProgress}
                    >
                      Disable
                    </Button>
                  )}
                </div>
                {task.publicAccessExpiry && (
                  <p className="text-xs text-blue-700 mt-1">
                    Expires on {formatDate(task.publicAccessExpiry)}
                  </p>
                )}
              </div>
            )}
            
            {!task.publicAccessUrl && canEdit && (
              <Button
                onClick={() => setShowShareModal(true)}
                className="mt-4 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded flex items-center w-auto"
              >
                <Share2 className="h-4 w-4 mr-1" /> Generate Public Link
              </Button>
            )}
          </div>
          
          {/* Comments section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" /> Comments
            </h2>
            
            <div className="space-y-4 mb-6">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => (
                  <div key={comment._id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-gray-900">
                        {comment.user?.firstName} {comment.user?.lastName}
                        {comment.isFromVendor && <span className="text-blue-600 ml-1">(Vendor)</span>}
                        {comment.isInternalNote && <span className="text-orange-600 ml-1">(Internal)</span>}
                      </div>
                      <div className="text-sm text-gray-500">{formatDate(comment.createdAt)}</div>
                    </div>
                    <p className="mt-2 text-gray-700">{comment.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-center py-4">No comments yet.</p>
              )}
            </div>
            
            {/* Add comment form */}
            <form onSubmit={handleAddComment}>
              <div className="mb-3">
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                  Add a Comment
                </label>
                <textarea
                  id="comment"
                  rows={3}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter your comment here..."
                  disabled={isAddingComment}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  disabled={!commentText.trim() || isAddingComment}
                >
                  {isAddingComment ? 'Posting...' : 'Post Comment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Sidebar - right side */}
        <div className="space-y-6">
          {/* Status card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Status</h2>
            
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: 
                      task.status === 'scheduled' ? '#dbeafe' :
                      task.status === 'in_progress' ? '#fef3c7' :
                      task.status === 'completed' ? '#d1fae5' :
                      task.status === 'paused' ? '#ffedd5' :
                      task.status === 'canceled' ? '#fee2e2' : '#f3f4f6',
                    color:
                      task.status === 'scheduled' ? '#1e40af' :
                      task.status === 'in_progress' ? '#92400e' :
                      task.status === 'completed' ? '#065f46' :
                      task.status === 'paused' ? '#9a3412' :
                      task.status === 'canceled' ? '#b91c1c' : '#374151',
                  }}
                >
                  {task.statusDisplay}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium text-gray-900">{task.categoryDisplay}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Scheduled Date</p>
                <p className="font-medium text-gray-900 flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> 
                  {formatDate(task.scheduledDate)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Frequency</p>
                <p className="font-medium text-gray-900">{task.frequencyDisplay}</p>
              </div>
              
              {task.lastExecutedAt && (
                <div>
                  <p className="text-sm text-gray-500">Last Executed</p>
                  <p className="font-medium text-gray-900">{formatDate(task.lastExecutedAt)}</p>
                </div>
              )}
              
              {task.nextDueDate && (
                <div>
                  <p className="text-sm text-gray-500">Next Due Date</p>
                  <p className="font-medium text-gray-900">{formatDate(task.nextDueDate)}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Location card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Location</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Property</p>
                <p className="font-medium text-gray-900">{task.propertyName}</p>
              </div>
              
              {task.unitName !== 'No Unit' && (
                <div>
                  <p className="text-sm text-gray-500">Unit</p>
                  <p className="font-medium text-gray-900">{task.unitName}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Assignment card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium text-gray-900">{task.creatorName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <div className="flex items-center">
                  <UserCheck className="h-4 w-4 mr-1 text-gray-400" />
                  <p className="font-medium text-gray-900">{task.assigneeName}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Created On</p>
                <p className="font-medium text-gray-900">{formatDate(task.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium text-gray-900">{formatDate(task.updatedAt)}</p>
              </div>
            </div>
          </div>
          
          {/* Media files */}
          {task.media && task.media.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Media Files</h2>
              
              <div className="grid grid-cols-2 gap-2">
                {task.media.map((file, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden">
                    {file.mimeType && file.mimeType.startsWith('image/') ? (
                      <img 
                        src={file.url} 
                        alt={`Task media ${index + 1}`} 
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-100 flex justify-center items-center">
                        <FileText className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    <div className="p-2 bg-gray-50 flex justify-between items-center">
                      <span className="text-xs truncate">{file.filename || 'File'}</span>
                      <a 
                        href={file.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Scheduled Maintenance Task"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Are you sure you want to delete this scheduled maintenance task? This action cannot be undone.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowDeleteModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
              disabled={isActionInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
              disabled={isActionInProgress}
            >
              {isActionInProgress ? 'Deleting...' : 'Delete Task'}
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Generate Public Access Link"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            Create a public link that can be shared with vendors or others who need to access this task without logging in.
          </p>
          <div className="mb-4">
            <label htmlFor="expiryDays" className="block text-sm font-medium text-gray-700 mb-1">
              Link expiry (in days)
            </label>
            <input
              type="number"
              id="expiryDays"
              min="1"
              max="90"
              value={publicLinkDays}
              onChange={(e) => setPublicLinkDays(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {publicLink && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Public Link
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={publicLink}
                  readOnly
                  className="flex-grow border border-gray-300 rounded-l-md shadow-sm py-2 px-3"
                />
                <Button
                  onClick={copyPublicLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-r-md"
                >
                  Copy
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowShareModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              Close
            </Button>
            {!publicLink && (
              <Button
                onClick={handleGeneratePublicLink}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
                disabled={isActionInProgress}
              >
                {isActionInProgress ? 'Generating...' : 'Generate Link'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
      
      {/* Create Request Modal */}
      <Modal
        isOpen={showCreateRequestModal}
        onClose={() => setShowCreateRequestModal(false)}
        title="Create Maintenance Request"
      >
        <div className="p-6">
          <p className="mb-4 text-gray-700">
            This will create a new maintenance request based on this scheduled maintenance task. 
            The request will include all details and media from this task.
          </p>
          <div className="flex justify-end space-x-3">
            <Button
              onClick={() => setShowCreateRequestModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded flex items-center"
              disabled={isActionInProgress}
            >
              <XCircle className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button
              onClick={handleCreateRequest}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              disabled={isActionInProgress}
            >
              <Check className="h-4 w-4 mr-1" /> 
              {isActionInProgress ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ScheduledMaintenanceDetailPage;