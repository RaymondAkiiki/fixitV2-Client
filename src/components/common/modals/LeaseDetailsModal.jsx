// frontend/src/components/common/modals/LeaseDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import Modal from '../Modal.jsx'; // Ensure correct path
import Button from '../Button.jsx'; // Ensure correct path
import LoadingSpinner from '../LoadingSpinner.jsx'; // Ensure correct path
import { FileText, Calendar, DollarSign, User, Home, Building } from 'lucide-react'; // Icons

import { getLeaseById } from '../../services/leaseService.js'; // Service to fetch lease details
import { formatDate } from '../../utils/helpers.js'; // Helper for date formatting
import { LEASE_STATUS_ENUM } from '../../utils/constants.js'; // Assuming LEASE_STATUS_ENUM

// Branding colors
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

// Re-usable Lease Status Badge (copied for self-containment)
const LeaseStatusBadge = ({ status }) => {
  const base = "px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
  switch (status?.toLowerCase()) {
    case LEASE_STATUS_ENUM.ACTIVE: return `${base} bg-green-100 text-green-800`;
    case LEASE_STATUS_ENUM.EXPIRED: return `${base} bg-red-100 text-red-800`;
    case LEASE_STATUS_ENUM.PENDING_RENEWAL: return `${base} bg-yellow-100 text-yellow-800`;
    case LEASE_STATUS_ENUM.TERMINATED: return `${base} bg-gray-100 text-gray-800`;
    case LEASE_STATUS_ENUM.DRAFT: return `${base} bg-blue-100 text-blue-800`;
    default: return `${base} bg-gray-100 text-gray-800`;
  }
};

/**
 * A modal for displaying detailed lease agreement information.
 * Fetches lease details if leaseId is provided, otherwise displays provided lease object.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Function to call when the modal is requested to be closed.
 * @param {string} [props.leaseId] - The ID of the lease to fetch and display.
 * @param {object} [props.lease] - Optional: A lease object to display directly (if already fetched).
 * @param {string} [props.title="Lease Details"] - The title of the modal.
 */
const LeaseDetailsModal = ({ isOpen, onClose, leaseId, lease: initialLease, title = "Lease Details" }) => {
  const [lease, setLease] = useState(initialLease);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      if (!leaseId && !initialLease) {
        setError("No lease ID or lease object provided.");
        setLoading(false);
        return;
      }

      if (initialLease) {
        setLease(initialLease);
        setLoading(false);
        setError('');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const fetchedLease = await getLeaseById(leaseId);
        setLease(fetchedLease);
      } catch (err) {
        setError("Failed to load lease details: " + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchDetails();
    }
  }, [isOpen, leaseId, initialLease]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-2xl">
      {loading ? (
        <div className="p-8 flex justify-center items-center">
          <LoadingSpinner size="md" color={PRIMARY_COLOR} />
          <p className="ml-4 text-gray-700">Loading lease data...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-red-700 bg-red-100 border border-red-300 rounded-lg">
          <p>{error}</p>
        </div>
      ) : lease ? (
        <div className="p-6 space-y-5 text-gray-700">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-500" />
            <p className="text-xl font-semibold">Lease Agreement</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-gray-500" />
              <p><strong>Property:</strong> {lease.property?.name || 'N/A'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-gray-500" />
              <p><strong>Unit:</strong> {lease.unit?.unitName || 'N/A'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-500" />
              <p><strong>Tenant:</strong> {lease.tenant?.name || lease.tenant?.email || 'N/A'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <p><strong>Start Date:</strong> {formatDate(lease.startDate)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <p><strong>End Date:</strong> {formatDate(lease.endDate)}</p>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-gray-500" />
              <p><strong>Rent Amount:</strong> ${lease.rentAmount?.toFixed(2) || '0.00'} / {lease.rentFrequency || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4">
            <p><strong>Status:</strong></p>
            <LeaseStatusBadge status={lease.status} />
          </div>

          {lease.terms && (
            <div className="mt-6 border-t pt-4 border-gray-200">
              <h4 className="text-lg font-semibold mb-3 text-gray-800">Lease Terms</h4>
              <p className="text-sm whitespace-pre-wrap">{lease.terms}</p>
            </div>
          )}

          {lease.documentUrl && (
            <div className="mt-6 border-t pt-4 border-gray-200">
              <h4 className="text-lg font-semibold mb-3 text-gray-800">Lease Document</h4>
              <a
                href={lease.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[${PRIMARY_COLOR}] hover:bg-[#1a7b64] transition-colors`}
              >
                <FileText className="w-4 h-4 mr-2" /> View Document
              </a>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={onClose} className={`bg-[${PRIMARY_COLOR}] hover:bg-[#1a7b64] text-white py-2 px-4 rounded-lg`}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-8 text-gray-600 text-center">No lease data available.</div>
      )}
    </Modal>
  );
};

export default LeaseDetailsModal;
