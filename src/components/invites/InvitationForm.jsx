// client/src/components/invites/InvitationForm.jsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useGlobalAlert } from '../../contexts/GlobalAlertContext';
import * as inviteService from '../../services/inviteService';
import * as propertyService from '../../services/propertyService';
import { PROPERTY_USER_ROLES } from '../../utils/constants';

const InvitationForm = ({ onSuccess }) => {
  const { register, handleSubmit, watch, reset, formState: { errors }, setValue } = useForm();
  const { showSuccess, showError } = useGlobalAlert();
  
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  
  const selectedRoles = watch('roles', []);
  const selectedProperty = watch('propertyId');
  const isTenantSelected = selectedRoles.includes('tenant');
  
  // Load properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      setLoadingProperties(true);
      try {
        const response = await propertyService.getAllProperties();
        setProperties(response.data || []);
      } catch (error) {
        showError('Failed to load properties');
      } finally {
        setLoadingProperties(false);
      }
    };
    
    fetchProperties();
  }, [showError]);
  
  // Load units when property is selected
  useEffect(() => {
    if (!selectedProperty) {
      setUnits([]);
      return;
    }
    
    const fetchUnits = async () => {
      setLoadingUnits(true);
      try {
        const response = await propertyService.getPropertyUnits(selectedProperty);
        setUnits(response.data || []);
      } catch (error) {
        showError('Failed to load units');
      } finally {
        setLoadingUnits(false);
      }
    };
    
    fetchUnits();
  }, [selectedProperty, showError]);
  
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Only include unitId if tenant role is selected
      const inviteData = {
        email: data.email,
        roles: data.roles,
        propertyId: data.propertyId,
        ...(isTenantSelected && { unitId: data.unitId }),
        ...(data.phone && { phone: data.phone })
      };
      
      const response = await inviteService.createInvite(inviteData);
      showSuccess(`Invitation sent to ${data.email} successfully!`);
      reset();
      if (onSuccess) onSuccess(response.data);
    } catch (error) {
      showError(error.toString());
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.email ? 'border-red-500' : ''}`}
          placeholder="user@example.com"
          {...register('email', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
        />
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
      </div>
      
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number (Optional)
        </label>
        <input
          id="phone"
          type="tel"
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${errors.phone ? 'border-red-500' : ''}`}
          placeholder="+1234567890"
          {...register('phone', { 
            pattern: {
              value: /^\+?[0-9\s-]{7,15}$/,
              message: 'Invalid phone number format'
            }
          })}
        />
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Roles *
        </label>
        <div className="mt-2 space-y-2">
          {Object.entries(PROPERTY_USER_ROLES).map(([key, value]) => (
            <div key={key} className="flex items-center">
              <input
                id={`role-${key}`}
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                value={value.toLowerCase()}
                {...register('roles', { required: 'At least one role is required' })}
              />
              <label htmlFor={`role-${key}`} className="ml-2 text-sm text-gray-700">
                {value}
              </label>
            </div>
          ))}
        </div>
        {errors.roles && <p className="mt-1 text-xs text-red-500">{errors.roles.message}</p>}
      </div>
      
      <div>
        <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
          Property *
        </label>
        <select
          id="propertyId"
          className={`mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm ${errors.propertyId ? 'border-red-500' : ''}`}
          {...register('propertyId', { required: 'Property is required' })}
          disabled={loadingProperties}
        >
          <option value="">Select a property</option>
          {properties.map(property => (
            <option key={property._id} value={property._id}>
              {property.name}
            </option>
          ))}
        </select>
        {errors.propertyId && <p className="mt-1 text-xs text-red-500">{errors.propertyId.message}</p>}
      </div>
      
      {isTenantSelected && (
        <div>
          <label htmlFor="unitId" className="block text-sm font-medium text-gray-700">
            Unit *
          </label>
          <select
            id="unitId"
            className={`mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm ${errors.unitId ? 'border-red-500' : ''}`}
            {...register('unitId', { required: isTenantSelected ? 'Unit is required for tenant role' : false })}
            disabled={!selectedProperty || loadingUnits}
          >
            <option value="">Select a unit</option>
            {units.map(unit => (
              <option key={unit._id} value={unit._id}>
                {unit.unitName}
              </option>
            ))}
          </select>
          {errors.unitId && <p className="mt-1 text-xs text-red-500">{errors.unitId.message}</p>}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          type="button"
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          onClick={() => reset()}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Invitation'}
        </button>
      </div>
    </form>
  );
};

export default InvitationForm;