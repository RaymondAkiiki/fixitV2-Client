import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from "../../services/adminService.js";

const AdminMediaManagementPage = () => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaStats, setMediaStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ type: '', uploaderId: '', requestId: '', propertyId: '', page: 1, limit: 10 });
  const [totalPages, setTotalPages] = useState(1);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.listAllMediaAdmin(filters);
      setMediaFiles(response.data.mediaFiles);
      setTotalPages(response.data.totalPages);
      const statsResponse = await adminService.getMediaStorageStats();
      setMediaStats(statsResponse.data);
      setError('');
    } catch (err) {
      setError('Failed to load media files. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleDeleteMedia = async (requestId, mediaId, filename) => {
    if (!window.confirm(`Are you sure you want to delete the media file "${filename}"? This action might be irreversible depending on backend setup.`)) return;
    try {
      await adminService.deleteMediaFileAdmin(requestId, mediaId);
      alert('Media file deleted successfully (from database record). Ensure backend also deletes from storage.');
      fetchMedia(); // Refresh list
    } catch (err) {
      alert('Failed to delete media: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="text-center p-10">Loading media files...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Media Management (Admin View)</h2>

      {mediaStats && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg shadow">
          <h3 className="text-lg font-semibold">Media Storage Stats</h3>
          <p>Total Files: {mediaStats.totalFiles}</p>
          <p>Total Size: {mediaStats.totalSizeMB} MB</p>
          {mediaStats.notes && <p className="text-sm text-gray-600 mt-1">{mediaStats.notes}</p>}
        </div>
      )}
      
      {/* Filters - Add more specific filters as needed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow">
        <input type="text" name="type" placeholder="Filter by type (e.g., image, video)" value={filters.type} onChange={handleFilterChange} className="p-2 border rounded"/>
        <input type="text" name="uploaderId" placeholder="Uploader User ID" value={filters.uploaderId} onChange={handleFilterChange} className="p-2 border rounded"/>
        <input type="text" name="requestId" placeholder="Request ID" value={filters.requestId} onChange={handleFilterChange} className="p-2 border rounded"/>
        <input type="text" name="propertyId" placeholder="Property ID" value={filters.propertyId} onChange={handleFilterChange} className="p-2 border rounded"/>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview/Filename</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploader</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mediaFiles.map(media => (
              <tr key={media._id || media.filename}> {/* Ensure unique key */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {media.mimetype?.startsWith('image/') ? (
                    <img src={media.url} alt={media.filename} className="h-10 w-10 object-cover rounded" />
                  ) : (
                    <a href={media.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{media.filename}</a>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{media.mimetype}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{media.size ? (media.size / 1024).toFixed(2) + ' KB' : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(media.uploadedAt).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {media.requestId ? `ID: ${media.requestId}` : 'N/A'}
                    {media.requestTitle && <span className="block text-xs">({media.requestTitle})</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{media.uploader?.name || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => handleDeleteMedia(media.requestId, media._id, media.filename)} 
                    className="text-red-600 hover:text-red-900"
                    disabled={!media.requestId || !media._id} // Disable if IDs are missing
                  >
                    Delete
                  </button>
                </td>
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

export default AdminMediaManagementPage;