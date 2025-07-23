import React, { useState, useEffect, useCallback } from 'react';
import * as onboardingService from '../services/onboardingService';
import { useGlobalAlert } from '../contexts/GlobalAlertContext';
import { useProperty } from '../contexts/PropertyContext';

function OnboardingListPage() {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    
    const { current: currentProperty } = useProperty();
    const { showSuccess, showError } = useGlobalAlert();
    
    const fetchDocuments = useCallback(async (page = 1, filters = {}) => {
        try {
            setLoading(true);
            setError(null);
            
            // Add property filter if available
            const params = {
                ...filters,
                page,
                limit: pagination.limit
            };
            
            if (currentProperty) {
                params.propertyId = currentProperty._id;
            }
            
            const response = await onboardingService.getOnboarding(params);
            
            setDocuments(response.data || []);
            setPagination(response.pagination);
        } catch (err) {
            console.error("Could not load onboarding documents:", err);
            setError(err.message || "Failed to load onboarding documents");
            showError(`Error loading onboarding documents: ${err.message || "Unknown error"}`);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    }, [currentProperty, pagination.limit, showError]);
    
    // Initial data fetch
    useEffect(() => {
        fetchDocuments(1);
    }, [fetchDocuments]);
    
    // Handle document deletion
    const handleDeleteDocument = async (documentId) => {
        try {
            await onboardingService.deleteOnboarding(documentId);
            showSuccess('Document deleted successfully!');
            fetchDocuments(pagination.page); // Refresh list
        } catch (err) {
            showError(`Failed to delete document: ${err.message}`);
        }
    };
    
    // Handle pagination change
    const handlePageChange = (newPage) => {
        fetchDocuments(newPage);
    };
    
    // Render the component...
    return (
        <div>
            {/* Component rendering logic */}
            {loading ? (
                <p>Loading...</p>
            ) : error ? (
                <div className="alert alert-error">{error}</div>
            ) : (
                <>
                    {/* Render documents list */}
                    <div className="grid gap-4">
                        {documents.map(doc => (
                            <div key={doc._id} className="card">
                                <div className="card-body">
                                    <h3 className="card-title">{doc.title}</h3>
                                    <p className="text-sm text-gray-500">{doc.categoryDisplay}</p>
                                    <p>{doc.description}</p>
                                    <div className="flex items-center mt-2">
                                        <span className={`px-2 py-1 rounded text-xs ${doc.statusClass}`}>
                                            {doc.statusDisplay}
                                        </span>
                                    </div>
                                    <div className="card-actions justify-end mt-4">
                                        <button 
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handleDeleteDocument(doc._id)}
                                        >
                                            Delete
                                        </button>
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={() => {/* Navigate to detail view */}}
                                        >
                                            View
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Pagination controls */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center mt-6">
                            {Array.from({ length: pagination.pages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    className={`mx-1 px-3 py-1 rounded ${pagination.page === i + 1 ? 'bg-primary text-white' : 'bg-gray-200'}`}
                                    onClick={() => handlePageChange(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}