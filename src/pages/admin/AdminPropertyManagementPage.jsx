import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from "../../services/adminService.js";
import { useGlobalAlert } from '../../contexts/GlobalAlertContext.jsx';
import LoadingSpinner from '../../components/common/LoadingSpinner.jsx';
import ConfirmationModal from '../../components/common/modals/ConfirmationModal.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import { ROUTES } from '../../utils/constants.js';

// Import icons for the new UI
import { Building2, PlusCircle, SlidersHorizontal, Edit, Trash2, Eye, Home, RefreshCw, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

const AdminPropertyManagementPage = () => {
  // --- STATE AND LOGIC (UNCHANGED) ---
  const { showSuccess, showError } = useGlobalAlert();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const [filters, setFilters] = useState({ search: '', type: '', isActive: '', page: 1, limit: 10 });
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const abortControllerRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchProperties = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setLoading(true);
    try {
      const apiFilters = { ...filters, isActive: filters.isActive === 'active' ? true : filters.isActive === 'inactive' ? false : undefined };
      const response = await adminService.getAllProperties(apiFilters, abortControllerRef.current.signal);
      const formattedProperties = Array.isArray(response.data) ? response.data.map(adminService.formatProperty) : [];
      setProperties(formattedProperties);
      setTotalPages(response.pagination.pages);
      setTotalProperties(response.pagination.total);
    } catch (err) {
      if (err.name !== 'CanceledError') showError('Failed to load properties: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  useEffect(() => {
    fetchProperties();
    return () => abortControllerRef.current?.abort();
  }, [filters.page, filters.limit]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if(filters.search || filters.type || filters.isActive) {
        fetchProperties();
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search, filters.type, filters.isActive, fetchProperties]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS (LOGIC UNCHANGED) ---
  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handleResetFilters = () => setFilters({ search: '', type: '', isActive: '', page: 1, limit: 10 });

  const handleDeactivateProperty = async () => {
    if (!selectedProperty) return;
    setActionLoading(true);
    try {
      await adminService.deactivateProperty(selectedProperty._id);
      showSuccess(`Property "${selectedProperty.name}" deactivated successfully!`);
      fetchProperties();
      setShowDeactivateModal(false);
    } catch (err) {
      showError('Failed to deactivate property: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openDeactivateModal = (property) => {
    setSelectedProperty(property);
    setActiveDropdown(null);
    setShowDeactivateModal(true);
  };
  
  // --- RENDER LOGIC ---
  if (loading && properties.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-[#f8fafc]"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      <div className="flex flex-wrap justify-between items-center mb-8 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-[#219377] flex items-center">
            <Building2 className="w-8 h-8 mr-3" /> Property Management
          </h1>
          <p className="text-gray-500 mt-1">Oversee all properties, their units, and associated data.</p>
        </div>
        <Link to={ROUTES.ADMIN_PROPERTY_CREATE}>
          <Button className="bg-[#219377] hover:bg-[#1a7c67] text-white">
            <PlusCircle className="w-5 h-5 mr-2" /> Add New Property
          </Button>
        </Link>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center"><SlidersHorizontal className="w-5 h-5 mr-2" /> Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input name="search" placeholder="Search by name or address..." value={filters.search} onChange={handleFilterChange} />
          <select name="type" value={filters.type} onChange={handleFilterChange} className="w-full p-2 border rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-[#e6f7f2] focus:border-[#219377]">
            <option value="">All Types</option>
            <option value="residential">Residential</option><option value="commercial">Commercial</option><option value="industrial">Industrial</option><option value="land">Land</option>
          </select>
          <select name="isActive" value={filters.isActive} onChange={handleFilterChange} className="w-full p-2 border rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-[#e6f7f2] focus:border-[#219377]">
            <option value="">All Statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
          <Button onClick={handleResetFilters} variant="secondary"><RefreshCw className="w-4 h-4 mr-2" /> Reset</Button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-lg border border-[#e6f7f2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr className="text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              <th className="px-6 py-3">Property</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Units</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Owner</th><th className="px-6 py-3">Created</th><th className="px-6 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.map(property => (
                <tr key={property._id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4"><div className="text-sm font-semibold text-gray-900">{property.name}</div><div className="text-sm text-gray-500">{property.fullAddress}</div></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{property.typeDisplay}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 text-center">{property.unitCount}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${property.statusClass}`}>{property.statusDisplay}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{property.ownerName || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{property.createdAtFormatted}</td>
                  <td className="px-6 py-4 text-right relative">
                    <Button variant="icon" onClick={() => setActiveDropdown(activeDropdown === property._id ? null : property._id)}><MoreVertical className="w-5 h-5" /></Button>
                    {activeDropdown === property._id && <div ref={dropdownRef} className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link to={`${ROUTES.ADMIN_PROPERTIES}/${property._id}`} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><Eye className="w-4 h-4 mr-2" />View Details</Link>
                        <Link to={`${ROUTES.ADMIN_PROPERTIES}/edit/${property._id}`} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><Edit className="w-4 h-4 mr-2" />Edit Property</Link>
                        <Link to={`${ROUTES.ADMIN_PROPERTIES}/${property._id}/units`} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><Home className="w-4 h-4 mr-2" />Manage Units</Link>
                        {property.isActive && <a href="#" onClick={e => { e.preventDefault(); openDeactivateModal(property); }} className="text-red-600 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><Trash2 className="w-4 h-4 mr-2" />Deactivate</a>}
                      </div>
                    </div>}
                  </td>
                </tr>
              ))}
              {properties.length === 0 && !loading && <tr><td colSpan="7" className="py-10 text-center text-gray-500">No properties found.</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-700">Page <span className="font-bold">{filters.page}</span> of <span className="font-bold">{totalPages}</span> ({totalProperties} properties)</span>
          <div className="flex gap-2">
            <Button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page <= 1} variant="secondary"><ChevronLeft className="w-4 h-4 mr-1" />Previous</Button>
            <Button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page >= totalPages} variant="secondary">Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>}
      </section>

      <div className="flex flex-wrap justify-between items-center mb-8 border-b border-gray-200 pb-5">
        <Link to={ROUTES.ADMIN_UNITS}>
          <Button className="bg-[#219377] hover:bg-[#1a7c67] text-white">
            <PlusCircle className="w-5 h-5 mr-2" /> Go to Unit Management Page
          </Button>
        </Link>
      </div>

      <ConfirmationModal
        isOpen={showDeactivateModal}
        title="Deactivate Property"
        message={`Are you sure you want to deactivate "${selectedProperty?.name}"? This action is reversible.`}
        confirmButtonClass="bg-red-600"
        confirmText={actionLoading ? "Deactivating..." : "Deactivate"}
        onConfirm={handleDeactivateProperty}
        onClose={() => setShowDeactivateModal(false)}
      />
    </div>
  );
};

export default AdminPropertyManagementPage;