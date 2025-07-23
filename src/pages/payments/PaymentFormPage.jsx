import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRent, useRentMutations } from '../../hooks/useRents';
import * as propertyService from '../../services/propertyService';
import * as userService from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import { USER_ROLES } from '../../utils/constants';
import Spinner from '../../components/common/Spinner';
import { FaArrowLeft, FaSave, FaTimes, FaCalendarAlt } from 'react-icons/fa';

export default function PaymentFormPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useGlobalAlert();
  
  const isEditMode = !!paymentId;
  
  // Form state
  const [formData, setFormData] = useState({
    propertyId: '',
    unitId: '',
    tenantId: '',
    dueDate: '',
    amountDue: '',
    currency: 'UGX',
    status: 'due',
    notes: '',
  });
  
  // Dropdown options
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Get rent data if in edit mode
  const { 
    data: rentRecord,
    isLoading: isLoadingRent,
    isError: rentError
  } = useRent(paymentId);
  
  // Mutation hooks
  const { 
    createRent, 
    isCreating,
    updateRent,
    isUpdating
  } = useRentMutations();
  
  // Update form when rent data is loaded in edit mode
  useEffect(() => {
    if (isEditMode && rentRecord) {
      setFormData({
        propertyId: rentRecord.property?._id || '',
        unitId: rentRecord.unit?._id || '',
        tenantId: rentRecord.tenant?._id || '',
        dueDate: rentRecord.dueDate ? new Date(rentRecord.dueDate).toISOString().split('T')[0] : '',
        amountDue: rentRecord.amountDue || '',
        currency: rentRecord.currency || 'UGX',
        status: rentRecord.status || 'due',
        notes: rentRecord.notes || '',
      });
    }
  }, [isEditMode, rentRecord]);
  
  // Fetch properties
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const response = await propertyService.getAllProperties();
        setProperties(response.properties || []);
      } catch (error) {
        console.error('Error fetching properties:', error);
        showError('Failed to load properties');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [showError]);
  
  // Fetch units when property changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.propertyId) {
        setUnits([]);
        setFormData(prev => ({ ...prev, unitId: '' }));
        return;
      }
      
      setLoading(true);
      try {
        const property = await propertyService.getPropertyById(formData.propertyId);
        if (property && property.units) {
          setUnits(property.units);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
        showError('Failed to load units');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUnits();
  }, [formData.propertyId, showError]);
  
  // Fetch tenants when property/unit changes
  useEffect(() => {
    const fetchTenants = async () => {
      if (!formData.propertyId) {
        setTenants([]);
        return;
      }
      
      setLoading(true);
      try {
        const params = { 
          role: USER_ROLES.TENANT,
          propertyId: formData.propertyId
        };
        
        if (formData.unitId) {
          params.unitId = formData.unitId;
        }
        
        const response = await userService.getAllUsers(params);
        setTenants(response.data || []);
      } catch (error) {
        console.error('Error fetching tenants:', error);
        showError('Failed to load tenants');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenants();
  }, [formData.propertyId, formData.unitId, showError]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.propertyId) {
      showError('Please select a property');
      return;
    }
    
    if (!formData.tenantId) {
      showError('Please select a tenant');
      return;
    }
    
    if (!formData.dueDate) {
      showError('Please specify a due date');
      return;
    }
    
    if (!formData.amountDue || parseFloat(formData.amountDue) <= 0) {
      showError('Please enter a valid amount due');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        amountDue: parseFloat(formData.amountDue),
      };
      
      if (isEditMode) {
        await updateRent({
          rentId: paymentId,
          updateData: payload
        });
        showSuccess('Payment record updated successfully');
      } else {
        await createRent(payload);
        showSuccess('Payment record created successfully');
      }
      
      navigate('/payments');
    } catch (error) {
      console.error('Error saving payment record:', error);
      showError(error.message || 'Failed to save payment record');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (isEditMode && isLoadingRent) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
        <span className="ml-2">Loading payment data...</span>
      </div>
    );
  }
  
  if (isEditMode && rentError) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 text-red-600 p-6 rounded-md text-center">
          <p className="mb-4">Failed to load payment data.</p>
          <Link to="/payments" className="text-blue-600 hover:underline">
            Return to Payment List
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/payments" className="mr-4 text-blue-600">
            <FaArrowLeft />
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Payment Record' : 'Record New Payment'}
          </h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            {/* Property selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="propertyId">
                Property*
              </label>
              <select
                id="propertyId"
                name="propertyId"
                className="w-full p-2 border rounded-md"
                value={formData.propertyId}
                onChange={handleChange}
                required
                disabled={isEditMode}
              >
                <option value="">Select a property</option>
                {properties.map((property) => (
                  <option key={property._id} value={property._id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Unit selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="unitId">
                Unit
              </label>
              <select
                id="unitId"
                name="unitId"
                className="w-full p-2 border rounded-md"
                value={formData.unitId}
                onChange={handleChange}
                disabled={!formData.propertyId || isEditMode}
              >
                <option value="">Select a unit (optional)</option>
                {units.map((unit) => (
                  <option key={unit._id} value={unit._id}>
                    {unit.unitName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Tenant selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="tenantId">
                Tenant*
              </label>
              <select
                id="tenantId"
                name="tenantId"
                className="w-full p-2 border rounded-md"
                value={formData.tenantId}
                onChange={handleChange}
                required
                disabled={!formData.propertyId || isEditMode}
              >
                <option value="">Select a tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.firstName} {tenant.lastName} ({tenant.email})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Due date */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dueDate">
                Due Date*
              </label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  className="w-full pl-10 p-2 border rounded-md"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            {/* Payment amount */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="amountDue">
                Amount Due*
              </label>
              <div className="flex">
                <select
                  id="currency"
                  name="currency"
                  className="p-2 border rounded-l-md w-24"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="UGX">UGX</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
                <input
                  id="amountDue"
                  name="amountDue"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="flex-1 p-2 border-y border-r rounded-r-md"
                  value={formData.amountDue}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            {/* Payment status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">
                Payment Status*
              </label>
              <select
                id="status"
                name="status"
                className="w-full p-2 border rounded-md"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="due">Due</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue</option>
                <option value="waived">Waived</option>
              </select>
            </div>
            
            {/* Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                className="w-full p-2 border rounded-md"
                placeholder="Add any notes about this payment..."
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>
            
            {/* Form actions */}
            <div className="flex justify-between mt-8">
              <Link
                to="/payments"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                <FaTimes className="inline mr-2" />
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={submitting || isCreating || isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting || isCreating || isUpdating ? (
                  <>
                    <Spinner size="sm" className="inline mr-2" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <FaSave className="inline mr-2" />
                    {isEditMode ? 'Update Payment' : 'Record Payment'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}