import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as onboardingService from '../services/onboardingService';
import { useGlobalAlert } from '../contexts/GlobalAlertContext';

function OnboardingDetailPage() {
    const { id } = useParams();
    const [document, setDocument] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const { showSuccess, showError } = useGlobalAlert();
    
    // Fetch document
    useEffect(() => {
        const fetchDocument = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await onboardingService.getOnboardingById(id);
                setDocument(response.data);
            } catch (err) {
                console.error(`Could not load document ${id}:`, err);
                setError(err.message || "Failed to load document");
                showError(`Error loading document: ${err.message || "Unknown error"}`);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDocument();
    }, [id, showError]);
    
    // Mark as completed
    const handleMarkCompleted = async () => {
        try {
            const response = await onboardingService.markOnboardingCompleted(id);
            setDocument(response.data);
            showSuccess('Document marked as completed!');
        } catch (err) {
            showError(`Failed to mark document as completed: ${err.message}`);
        }
    };
    
    // Download document
    const handleDownload = async () => {
        try {
            // Get download info
            const downloadInfo = await onboardingService.getOnboardingDocumentDownloadInfo(id);
            
            // Download document
            await onboardingService.downloadOnboardingDocument(
                downloadInfo.downloadUrl,
                downloadInfo.fileName
            );
            
            showSuccess('Download started!');
        } catch (err) {
            showError(`Failed to download document: ${err.message}`);
        }
    };
    
    // Render the component...
    if (loading) return <p>Loading...</p>;
    if (error) return <div className="alert alert-error">{error}</div>;
    if (!document) return <p>Document not found</p>;
    
    return (
        <div className="container mx-auto p-4">
            <div className="bg-white shadow rounded-lg p-6">
                <h1 className="text-2xl font-bold mb-4">{document.title}</h1>
                
                <div className="flex items-center mb-4">
                    <span className={`px-2 py-1 rounded text-xs mr-2 ${document.statusClass}`}>
                        {document.statusDisplay}
                    </span>
                    <span className="text-sm text-gray-500">{document.categoryDisplay}</span>
                </div>
                
                {document.description && (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Description</h3>
                        <p>{document.description}</p>
                    </div>
                )}
                
                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Details</h3>
                    <ul className="space-y-2">
                        <li><strong>Created:</strong> {document.formattedCreatedAt}</li>
                        <li><strong>Created By:</strong> {document.creatorName}</li>
                        <li><strong>Visibility:</strong> {document.visibilityDisplay}</li>
                        {document.propertyName !== 'All Properties' && (
                            <li><strong>Property:</strong> {document.propertyName}</li>
                        )}
                        {document.unitName !== 'All Units' && (
                            <li><strong>Unit:</strong> {document.unitName}</li>
                        )}
                        {document.isCompleted && (
                            <li><strong>Completed:</strong> {document.formattedCompletedAt}</li>
                        )}
                    </ul>
                </div>
                
                <div className="flex space-x-4 mt-6">
                    <button
                        className="btn btn-primary"
                        onClick={handleDownload}
                    >
                        Download Document
                    </button>
                    
                    {!document.isCompleted && (
                        <button
                            className="btn btn-success"
                            onClick={handleMarkCompleted}
                        >
                            Mark as Completed
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}