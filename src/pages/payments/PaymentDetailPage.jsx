import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRent, useRentMutations, useRentUtils } from '../../hooks/useRents';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { USER_ROLES } from '../../utils/constants';
import Spinner from '../../components/common/Spinner';
import { 
  FaArrowLeft, FaDownload, FaEdit, FaTrash, FaMoneyBillWave,
  FaFileInvoiceDollar, FaCalendarAlt, FaUser, FaBuilding, FaHome
} from 'react-icons/fa';

export default function PaymentDetailPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  
  // State
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentNote, setPaymentNote] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User roles
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const isPropertyManager = user?.role === USER_ROLES.PROPERTY_MANAGER;
  const isLandlord = user?.role === USER_ROLES.LANDLORD;
  const isTenant = user?.role === USER_ROLES.TENANT;
  
  // Determine if user can manage payments
  const canManagePayments = isAdmin || isPropertyManager || isLandlord;
  
  // Fetch rent record data
  const { 
    data: rentRecord, 
    isLoading,
    isError,
    refetch 
  } = useRent(paymentId);
  
  // Mutation hooks
  const { 
    recordPayment, 
    isRecordingPayment,
    deleteRent,
    isDeleting
  } = useRentMutations();
  
  const { downloadProof } = useRentUtils();
  
  // Handle payment proof download
  const handleDownloadProof = async () => {
    try {
      await downloadProof(paymentId);
    } catch (error) {
      showError('Failed to download payment proof');
    }
  };
  
  // Handle payment record deletion
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this payment record? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteRent(paymentId);
      showSuccess('Payment record deleted successfully');
      navigate('/payments');
    } catch (error) {
      showError('Failed to delete payment record');
    }
  };
  
  // Handle payment submission
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showError('Please enter a valid payment amount');
      return;
    }
    
    if (rentRecord.balance > 0 && parseFloat(paymentAmount) > rentRecord.balance) {
      showError(`Payment amount cannot exceed the remaining balance (${rentRecord.formattedBalance})`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const paymentData = {
        amount: parseFloat(paymentAmount),
        paymentMethod,
        notes: paymentNote
      };
      
      await recordPayment({
        rentId: paymentId,
        paymentData,
        paymentProofFile: proofFile
      });
      
      showSuccess('Payment recorded successfully');
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentMethod('bank_transfer');
      setPaymentNote('');
      setProofFile(null);
      refetch();
    } catch (error) {
      showError('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setProofFile(e.target.files[0]);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
        <span className="ml-2">Loading payment details...</span>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-md text-center">
          <p className="mb-4">Failed to load payment details.</p>
          <Link to="/payments" className="text-blue-600 hover:underline">
            Return to Payment List
          </Link>
        </div>
      </div>
    );
  }
  
  if (!rentRecord) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-lg text-gray-600 mb-4">Payment record not found.</p>
          <Link to="/payments" className="text-blue-600 hover:underline">
            Return to Payment List
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/payments" className="mr-4 text-blue-600">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">Payment Details</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Payment status banner */}
          <div className={`px-6 py-3 ${rentRecord.statusClass}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaFileInvoiceDollar className="mr-2" />
                <span className="font-medium">{rentRecord.statusDisplay}</span>
              </div>
              <div className="text-sm">
                {rentRecord.isOverdue && 'OVERDUE'}
              </div>
            </div>
          </div>
          
          {/* Payment details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-lg font-medium mb-4">Payment Information</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <FaCalendarAlt className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className="font-medium">{rentRecord.formattedDueDate}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaMoneyBillWave className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Amount Due</p>
                      <p className="font-medium">{rentRecord.formattedAmount}</p>
                    </div>
                  </div>
                  
                  {rentRecord.amountPaid > 0 && (
                    <div className="flex items-start">
                      <FaMoneyBillWave className="mt-1 mr-3 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Amount Paid</p>
                        <p className="font-medium">{rentRecord.formattedAmountPaid}</p>
                        {rentRecord.paymentDate && (
                          <p className="text-xs text-gray-500">Paid on: {rentRecord.formattedPaymentDate}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {rentRecord.balance > 0 && (
                    <div className="flex items-start">
                      <FaMoneyBillWave className="mt-1 mr-3 text-red-500" />
                      <div>
                        <p className="text-sm text-gray-500">Remaining Balance</p>
                        <p className="font-medium">{rentRecord.formattedBalance}</p>
                      </div>
                    </div>
                  )}
                  
                  {rentRecord.paymentMethod && (
                    <div className="flex items-start">
                      <FaMoneyBillWave className="mt-1 mr-3 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-medium capitalize">
                          {rentRecord.paymentMethod.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-medium mb-4">Tenant & Property Information</h2>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <FaUser className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Tenant</p>
                      <p className="font-medium">{rentRecord.tenantName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FaBuilding className="mt-1 mr-3 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Property</p>
                      <p className="font-medium">{rentRecord.propertyName}</p>
                    </div>
                  </div>
                  
                  {rentRecord.unitName !== 'Unknown Unit' && (
                    <div className="flex items-start">
                      <FaHome className="mt-1 mr-3 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-500">Unit</p>
                        <p className="font-medium">{rentRecord.unitName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Payment notes */}
            {rentRecord.notes && (
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-2">Payment Notes</h2>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-700">{rentRecord.notes}</p>
                </div>
              </div>
            )}
            
            {/* Payment proof */}
            {rentRecord.hasPaymentProof && (
              <div className="mb-6">
                <h2 className="text-lg font-medium mb-2">Payment Proof</h2>
                <button
                  onClick={handleDownloadProof}
                  className="flex items-center px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50"
                >
                  <FaDownload className="mr-2" />
                  Download Payment Proof
                </button>
              </div>
            )}
            
            {/* Record payment form (for non-fully-paid records) */}
            {(rentRecord.balance > 0 || !rentRecord.isPaid) && (
              <div className="mb-6">
                {!showPaymentForm ? (
                  <div className="text-center">
                    <button
                      onClick={() => setShowPaymentForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <FaMoneyBillWave className="inline mr-2" />
                      Record a Payment
                    </button>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4">
                    <h2 className="text-lg font-medium mb-4">Record Payment</h2>
                    <form onSubmit={handleSubmitPayment}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="paymentAmount">
                          Payment Amount*
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2">{rentRecord.currency || 'UGX'}</span>
                          <input
                            id="paymentAmount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={rentRecord.balance || rentRecord.amountDue}
                            className="w-full pl-12 pr-3 py-2 border rounded-md"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            required
                          />
                        </div>
                        {rentRecord.balance > 0 && (
                          <p className="text-sm text-gray-500 mt-1">
                            Maximum: {rentRecord.formattedBalance}
                          </p>
                        )}
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="paymentMethod">
                          Payment Method*
                        </label>
                        <select
                          id="paymentMethod"
                          className="w-full p-2 border rounded-md"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          required
                        >
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank Transfer</option>
                          <option value="check">Check</option>
                          <option value="credit_card">Credit Card</option>
                          <option value="mobile_money">Mobile Money</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="paymentNote">
                          Payment Note
                        </label>
                        <textarea
                          id="paymentNote"
                          className="w-full p-2 border rounded-md"
                          rows="3"
                          placeholder="Add any notes about this payment..."
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                        ></textarea>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Payment Proof (optional)
                        </label>
                        <input
                          type="file"
                          className="w-full p-2 border rounded-md"
                          accept="image/*,.pdf"
                          onChange={handleFileChange}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Accepted formats: Images, PDF files
                        </p>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowPaymentForm(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || isRecordingPayment}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting || isRecordingPayment ? (
                            <>
                              <Spinner size="sm" className="mr-2" />
                              Processing...
                            </>
                          ) : (
                            'Record Payment'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex justify-between mt-8">
              <Link
                to="/payments"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back to Payments
              </Link>
              
              {canManagePayments && (
                <div className="space-x-2">
                  <Link
                    to={`/payments/${paymentId}/edit`}
                    className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50"
                  >
                    <FaEdit className="inline mr-2" />
                    Edit
                  </Link>
                  
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Spinner size="sm" className="inline mr-2" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <FaTrash className="inline mr-2" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}