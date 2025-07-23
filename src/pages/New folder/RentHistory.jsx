// src/components/RentHistory.jsx
import React, { useState } from 'react';
import { useRents, useRentMutations, useRentUtils } from '../hooks/useRents';
import Spinner from '../components/common/Spinner';

const TRentHistory = ({ propertyId }) => {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useRents({ 
    filters: { propertyId },
    page,
    limit: 10
  });
  const { recordPayment } = useRentMutations();
  const { downloadProof } = useRentUtils();

  if (isLoading) return <Spinner />;
  if (error) return <div>Error loading rent records: {error.message}</div>;

  const { rents, pagination } = data || { rents: [], pagination: { total: 0, pages: 1 } };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleRecordPayment = (rentId) => {
    // For example, you might show a modal form and then call:
    recordPayment({
      rentId,
      paymentData: {
        amountPaid: 1000,
        paymentDate: new Date(),
        paymentMethod: 'cash'
      }
    });
  };

  return (
    <div>
      <h1>Rent History</h1>
      <table>
        <thead>
          <tr>
            <th>Date Due</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Tenant</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rents.map(rent => (
            <tr key={rent._id}>
              <td>{rent.formattedDueDate}</td>
              <td>{rent.formattedAmount}</td>
              <td><span className={rent.statusClass}>{rent.statusDisplay}</span></td>
              <td>{rent.tenantName}</td>
              <td>
                {!rent.isPaid && (
                  <button onClick={() => handleRecordPayment(rent._id)}>Record Payment</button>
                )}
                {rent.hasPaymentProof && (
                  <button onClick={() => downloadProof(rent._id)}>Download Proof</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div>
        <button 
          disabled={page === 1} 
          onClick={() => handlePageChange(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {pagination.pages}</span>
        <button 
          disabled={page === pagination.pages} 
          onClick={() => handlePageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TRentHistory;