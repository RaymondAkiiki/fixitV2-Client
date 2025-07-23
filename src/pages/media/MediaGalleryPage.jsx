import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Image, 
  FileText, 
  File, 
  Filter, 
  Grid, 
  List, 
  Trash2, 
  Download, 
  Edit, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Search,
  Upload,
  Calendar,
  Tag,
  Info
} from "lucide-react";
import * as mediaService from "../../services/mediaService";
import * as documentService from "../../services/documentGenerationService";
import { useGlobalAlert } from "../../contexts/GlobalAlertContext";
import { formatDistanceToNow, format } from "date-fns";

// Main component
const MediaGalleryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess, showError } = useGlobalAlert();
  const searchParams = new URLSearchParams(location.search);
  
  // Refs
  const fileInputRef = useRef(null);

  // State
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [viewMode, setViewMode] = useState(localStorage.getItem("mediaViewMode") || "grid");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", tags: "" });
  const [pagination, setPagination] = useState({
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "20"),
    total: 0,
    pages: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    type: searchParams.get("type") || "",
    resourceType: searchParams.get("resourceType") || "",
    resourceId: searchParams.get("resourceId") || "",
    startDate: searchParams.get("startDate") || "",
    endDate: searchParams.get("endDate") || "",
    search: searchParams.get("search") || ""
  });
  
  // Fetch media with current filters and pagination
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build params from filters and pagination
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== "")
        )
      };
      
      const response = await mediaService.getMedia(params);
      setMedia(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.total || 0,
        pages: response.pages || 1
      }));
      
      // Update URL with search params
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value) searchParams.set(key, value);
      }
      navigate({ search: searchParams.toString() }, { replace: true });
      
    } catch (error) {
      showError("Failed to load media files: " + error.message);
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, navigate, showError]);

  // Fetch media stats
  const fetchStats = useCallback(async () => {
    try {
      const stats = await mediaService.getMediaStats();
      setStats(stats);
    } catch (error) {
      console.error("Error fetching media stats:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMedia();
    fetchStats();
  }, [fetchMedia, fetchStats]);

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("mediaViewMode", mode);
  };

  // Handle filter change
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filters change
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Apply filters
  const applyFilters = () => {
    fetchMedia();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      type: "",
      resourceType: "",
      resourceId: "",
      startDate: "",
      endDate: "",
      search: ""
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle media selection
  const handleMediaSelect = (mediaItem) => {
    setSelectedMedia(mediaItem);
  };

  // Handle media deletion
  const handleDeleteMedia = async () => {
    if (!selectedMedia) return;
    
    try {
      await mediaService.deleteMedia(selectedMedia._id);
      showSuccess("Media successfully deleted");
      setIsDeleteModalOpen(false);
      setSelectedMedia(null);
      fetchMedia(); // Refresh the list
    } catch (error) {
      showError("Failed to delete media: " + error.message);
    }
  };

  // Handle media download
  const handleDownloadMedia = async (mediaItem) => {
    try {
      // If it's a document that was generated, use the document service
      if (mediaItem.metadata?.documentType) {
        await documentService.downloadDocument(mediaItem._id);
      } else {
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = mediaItem.url;
        link.target = '_blank';
        link.download = mediaItem.originalname || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      showSuccess("Download started");
    } catch (error) {
      showError("Failed to download file: " + error.message);
    }
  };

  // Open edit modal
  const openEditModal = (mediaItem) => {
    setSelectedMedia(mediaItem);
    setEditForm({
      title: mediaItem.title || "",
      description: mediaItem.description || "",
      tags: (mediaItem.tags || []).join(", ")
    });
    setIsEditModalOpen(true);
  };

  // Handle media update
  const handleUpdateMedia = async () => {
    if (!selectedMedia) return;
    
    try {
      const updatedData = {
        title: editForm.title,
        description: editForm.description,
        tags: editForm.tags.split(",").map(tag => tag.trim()).filter(tag => tag)
      };
      
      await mediaService.updateMedia(selectedMedia._id, updatedData);
      showSuccess("Media successfully updated");
      setIsEditModalOpen(false);
      fetchMedia(); // Refresh the list
    } catch (error) {
      showError("Failed to update media: " + error.message);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      // This is a placeholder since we don't have a direct upload method in the service
      // In a real implementation, you would use a proper upload service
      showSuccess("Upload functionality would be implemented here");
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // After successful upload, refresh the media list
      fetchMedia();
    } catch (error) {
      showError("Failed to upload files: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Get the appropriate icon for a media type
  const getMediaIcon = (mediaItem) => {
    const mimeType = mediaItem.mimetype || "";
    
    if (mimeType.startsWith("image/")) {
      return <Image className="w-6 h-6" />;
    } else if (mimeType.startsWith("video/")) {
      return <Video className="w-6 h-6" />;
    } else if (mimeType.startsWith("audio/")) {
      return <Music className="w-6 h-6" />;
    } else if (mimeType.includes("pdf")) {
      return <FileText className="w-6 h-6" />;
    } else if (mimeType.includes("document") || mimeType.includes("sheet")) {
      return <FileText className="w-6 h-6" />;
    } else {
      return <File className="w-6 h-6" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown";
    
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + " " + sizes[i];
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "";
    }
  };

  // Determine if media is an image that can be previewed
  const isPreviewable = (mediaItem) => {
    return mediaItem && mediaItem.mimetype && mediaItem.mimetype.startsWith("image/");
  };

  // Render file type badge
  const renderFileTypeBadge = (mediaItem) => {
    const mimeType = mediaItem.mimetype || "";
    let badgeClass = "px-2 py-1 text-xs rounded-full";
    let label = "File";
    
    if (mimeType.startsWith("image/")) {
      badgeClass += " bg-blue-100 text-blue-800";
      label = "Image";
    } else if (mimeType.startsWith("video/")) {
      badgeClass += " bg-purple-100 text-purple-800";
      label = "Video";
    } else if (mimeType.startsWith("audio/")) {
      badgeClass += " bg-pink-100 text-pink-800";
      label = "Audio";
    } else if (mimeType.includes("pdf")) {
      badgeClass += " bg-red-100 text-red-800";
      label = "PDF";
    } else if (mimeType.includes("document")) {
      badgeClass += " bg-green-100 text-green-800";
      label = "Document";
    } else if (mimeType.includes("sheet")) {
      badgeClass += " bg-green-100 text-green-800";
      label = "Spreadsheet";
    } else {
      badgeClass += " bg-gray-100 text-gray-800";
    }
    
    return <span className={badgeClass}>{label}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Media Gallery</h1>
        
        <div className="flex space-x-4">
          {/* View toggle */}
          <div className="bg-white rounded-md shadow-sm border border-gray-200 flex">
            <button
              className={`p-2 ${viewMode === "grid" ? "bg-gray-100" : "bg-white"}`}
              onClick={() => handleViewModeChange("grid")}
              title="Grid view"
            >
              <Grid className="w-5 h-5 text-gray-600" />
            </button>
            <button
              className={`p-2 ${viewMode === "list" ? "bg-gray-100" : "bg-white"}`}
              onClick={() => handleViewModeChange("list")}
              title="List view"
            >
              <List className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {/* Upload button */}
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Upload className="w-5 h-5 mr-2" />
            )}
            Upload Files
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileUpload}
          />
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filter sidebar */}
        <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-500 mr-2" />
            <h2 className="text-lg font-medium">Filters</h2>
          </div>
          
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Search files..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* File Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File Type
              </label>
              <select
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
              >
                <option value="">All Types</option>
                <option value="image">Images</option>
                <option value="document">Documents</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
              </select>
            </div>
            
            {/* Resource Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Type
              </label>
              <select
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={filters.resourceType}
                onChange={(e) => handleFilterChange("resourceType", e.target.value)}
              >
                <option value="">All Resources</option>
                <option value="property">Properties</option>
                <option value="unit">Units</option>
                <option value="lease">Leases</option>
                <option value="request">Maintenance Requests</option>
                <option value="scheduledMaintenance">Scheduled Maintenance</option>
                <option value="document">Documents</option>
                <option value="onboarding">Onboarding</option>
              </select>
            </div>
            
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  />
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Filter buttons */}
            <div className="flex flex-col space-y-2 pt-4">
              <button
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={applyFilters}
              >
                Apply Filters
              </button>
              <button
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>
          
          {/* Media statistics */}
          {stats && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center mb-3">
                <Info className="w-5 h-5 text-gray-500 mr-2" />
                <h3 className="text-md font-medium">Media Statistics</h3>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Files:</span>
                  <span className="font-medium">{stats.totalCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Size:</span>
                  <span className="font-medium">{formatFileSize(stats.totalSize || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Images:</span>
                  <span className="font-medium">{stats.imageCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Documents:</span>
                  <span className="font-medium">{stats.documentCount || 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Main content */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow-md">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mr-2" />
              <span className="text-gray-600">Loading media files...</span>
            </div>
          ) : media.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow-md text-gray-500">
              <File className="w-16 h-16 mb-4 text-gray-300" />
              <p>No media files found</p>
              <p className="text-sm mt-1">Try adjusting your filters or upload new files</p>
            </div>
          ) : (
            <>
              {/* Grid View */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {media.map((mediaItem) => (
                    <div
                      key={mediaItem._id}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => handleMediaSelect(mediaItem)}
                    >
                      {isPreviewable(mediaItem) ? (
                        <div className="h-40 overflow-hidden bg-gray-100 relative">
                          <img
                            src={mediaItem.url}
                            alt={mediaItem.originalname || "Media preview"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                              <button
                                className="p-1 bg-white rounded-full shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMedia(mediaItem);
                                  setIsPreviewModalOpen(true);
                                }}
                                title="Preview"
                              >
                                <Image className="w-5 h-5 text-gray-700" />
                              </button>
                              <button
                                className="p-1 bg-white rounded-full shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadMedia(mediaItem);
                                }}
                                title="Download"
                              >
                                <Download className="w-5 h-5 text-gray-700" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-40 flex items-center justify-center bg-gray-100">
                          {getMediaIcon(mediaItem)}
                          <span className="text-sm text-gray-500 ml-2">
                            {mediaItem.originalname?.split('.').pop() || "Unknown"}
                          </span>
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-medium text-gray-900 truncate" title={mediaItem.title || mediaItem.originalname}>
                            {mediaItem.title || mediaItem.originalname || "Untitled"}
                          </h3>
                          {renderFileTypeBadge(mediaItem)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(mediaItem.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* List View */}
              {viewMode === "list" && (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          File
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Size
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Uploaded
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {media.map((mediaItem) => (
                        <tr key={mediaItem._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center">
                                {getMediaIcon(mediaItem)}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={mediaItem.title || mediaItem.originalname}>
                                  {mediaItem.title || mediaItem.originalname || "Untitled"}
                                </div>
                                {mediaItem.description && (
                                  <div className="text-xs text-gray-500 truncate max-w-xs" title={mediaItem.description}>
                                    {mediaItem.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {renderFileTypeBadge(mediaItem)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatFileSize(mediaItem.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(mediaItem.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              {isPreviewable(mediaItem) && (
                                <button
                                  className="text-indigo-600 hover:text-indigo-900"
                                  onClick={() => {
                                    setSelectedMedia(mediaItem);
                                    setIsPreviewModalOpen(true);
                                  }}
                                  title="Preview"
                                >
                                  <Image className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                className="text-blue-600 hover:text-blue-900"
                                onClick={() => handleDownloadMedia(mediaItem)}
                                title="Download"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                              <button
                                className="text-gray-600 hover:text-gray-900"
                                onClick={() => openEditModal(mediaItem)}
                                title="Edit"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                className="text-red-600 hover:text-red-900"
                                onClick={() => {
                                  setSelectedMedia(mediaItem);
                                  setIsDeleteModalOpen(true);
                                }}
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {/* Pagination controls */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page >= pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{" "}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                        disabled={pagination.page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      
                      {/* Pagination numbers logic */}
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        // Logic to show current page and surrounding pages
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === pagination.page
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(Math.min(pagination.pages, pagination.page + 1))}
                        disabled={pagination.page >= pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedMedia.title || selectedMedia.originalname || "this file"}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={handleDeleteMedia}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {isEditModalOpen && selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Media Information</h3>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <div className="flex items-center">
                  <Tag className="h-5 w-5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={handleUpdateMedia}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Preview Modal */}
      {isPreviewModalOpen && selectedMedia && isPreviewable(selectedMedia) && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-4xl w-full max-h-screen overflow-auto bg-white rounded-lg p-1">
            <div className="relative">
              <img
                src={selectedMedia.url}
                alt={selectedMedia.title || selectedMedia.originalname || "Preview"}
                className="w-full h-auto object-contain max-h-[80vh]"
              />
              <button
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md"
                onClick={() => setIsPreviewModalOpen(false)}
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>
            </div>
            <div className="p-4 bg-white">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedMedia.title || selectedMedia.originalname || "Untitled"}
              </h3>
              {selectedMedia.description && (
                <p className="text-gray-600 mt-1">{selectedMedia.description}</p>
              )}
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  {formatDate(selectedMedia.createdAt)}
                </div>
                <div className="flex space-x-2">
                  <button
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 flex items-center"
                    onClick={() => handleDownloadMedia(selectedMedia)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </button>
                  <button
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                    onClick={() => {
                      setIsPreviewModalOpen(false);
                      openEditModal(selectedMedia);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaGalleryPage;