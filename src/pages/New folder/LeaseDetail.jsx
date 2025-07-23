// src/components/LeaseDetail.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useLease, useLeaseMutations, useLeaseDocuments } from '../hooks/useLeases';
import Spinner from '../components/common/Spinner';

const TLeaseDetail = () => {
  const { id } = useParams();
  const { data: lease, isLoading, error } = useLease(id);
  const { updateLease } = useLeaseMutations();
  const { downloadDocument } = useLeaseDocuments();

  if (isLoading) return <Spinner />;
  if (error) return <div>Error loading lease: {error.message}</div>;
  if (!lease) return <div>Lease not found</div>;

  const handleRenew = () => {
    updateLease({
      leaseId: id,
      updateData: { status: 'active', leaseEndDate: new Date(Date.now() + 365*24*60*60*1000) }
    });
  };

  return (
    <div>
      <h1>Lease Details</h1>
      <p>Property: {lease.propertyName}</p>
      <p>Unit: {lease.unitName}</p>
      <p>Tenant: {lease.tenantName}</p>
      <p>Status: <span className={lease.statusClass}>{lease.statusDisplay}</span></p>
      <p>Start Date: {lease.formattedStartDate}</p>
      <p>End Date: {lease.formattedEndDate}</p>
      <p>Monthly Rent: {lease.formattedRent}</p>
      
      <button onClick={handleRenew}>Renew Lease</button>
      
      {lease.hasDocuments && (
        <div>
          <h2>Documents</h2>
          <ul>
            {lease.documents.map(doc => (
              <li key={doc._id}>
                {doc.name || 'Document'}
                <button onClick={() => downloadDocument(lease._id, doc._id)}>Download</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TLeaseDetail;