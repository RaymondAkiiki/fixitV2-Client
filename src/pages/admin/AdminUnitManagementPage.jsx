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
import { Home, PlusCircle, SlidersHorizontal, Edit, Trash2, Eye, RefreshCw, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';

const formatUnit = (unit) => {
  if (!unit) return null;
  return {
    ...unit,
    displayName: unit.unitName || unit.name || 'Unnamed Unit',
    propertyName: unit.property?.name || 'Unknown Property',
    statusDisplay: unit.isAvailable ? 'Available' : 'Occupied',
    statusClass: unit.isAvailable ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800',
    tenantName: unit.tenant ? `${unit.tenant.firstName || ''} ${unit.tenant.lastName || ''}`.trim() || unit.tenant.email : 'Vacant',
    createdAtFormatted: unit.createdAt ? new Date(unit.createdAt).toLocaleDateString() : 'N/A'
  };
};

const AdminUnitManagementPage = () => {
  // --- STATE AND LOGIC (UNCHANGED) ---
  const { showSuccess, showError } = useGlobalAlert();
  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUnits, setTotalUnits] = useState(0);
  const [filters, setFilters] = useState({ propertyId: '', status: '', search: '', page: 1, limit: 10 });
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const unitsAbortControllerRef = useRef(null);
  const propertiesAbortControllerRef = useRef(null);
  const dropdownRef = useRef(null);

  const fetchUnits = useCallback(async () => {
    if (unitsAbortControllerRef.current) unitsAbortControllerRef.current.abort();
    unitsAbortControllerRef.current = new AbortController();
    setLoading(true);
    try {
      const apiFilters = { ...filters, isAvailable: filters.status === 'available' ? true : filters.status === 'occupied' ? false : undefined };
      const response = await adminService.getAllUnits(apiFilters, unitsAbortControllerRef.current.signal);
      setUnits(Array.isArray(response.data) ? response.data.map(formatUnit) : []);
      setTotalPages(response.pagination.pages);
      setTotalUnits(response.pagination.total);
    } catch (err) {
      if (err.name !== 'CanceledError') showError('Failed to load units: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, showError]);

  const fetchProperties = useCallback(async () => {
    if (propertiesAbortControllerRef.current) propertiesAbortControllerRef.current.abort();
    propertiesAbortControllerRef.current = new AbortController();
    setPropertiesLoading(true);
    try {
      const response = await adminService.getAllProperties({ limit: 1000 }, propertiesAbortControllerRef.current.signal);
      setProperties(Array.isArray(response.data) ? response.data.map(p => ({ _id: p._id, name: p.name })) : []);
    } catch (err) {
      if (err.name !== 'CanceledError') console.error("Error fetching properties for filter:", err);
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
    return () => propertiesAbortControllerRef.current?.abort();
  }, [fetchProperties]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
        fetchUnits();
    }, 500); // Debounce requests
    return () => {
        clearTimeout(handler);
        unitsAbortControllerRef.current?.abort();
    };
  }, [filters, fetchUnits]);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- HANDLERS (LOGIC UNCHANGED) ---
  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  const handlePageChange = (newPage) => setFilters(prev => ({ ...prev, page: newPage }));
  const handleResetFilters = () => setFilters({ propertyId: '', status: '', search: '', page: 1, limit: 10 });

  const handleDeactivateUnit = async () => {
    if (!selectedUnit) return;
    setActionLoading(true);
    try {
      await adminService.deactivateUnit(selectedUnit._id);
      showSuccess(`Unit "${selectedUnit.displayName}" deactivated successfully!`);
      fetchUnits();
      setShowDeactivateModal(false);
    } catch (err) {
      showError('Failed to deactivate unit: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openDeactivateModal = (unit) => {
    setSelectedUnit(unit);
    setActiveDropdown(null);
    setShowDeactivateModal(true);
  };
  
  // --- RENDER LOGIC ---
  if (loading && units.length === 0) {
    return <div className="flex h-screen items-center justify-center bg-[#f8fafc]"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-8 bg-[#f8fafc] min-h-full">
      <div className="flex flex-wrap justify-between items-center mb-8 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-[#219377] flex items-center"><Home className="w-8 h-8 mr-3" /> Unit Management</h1>
          <p className="text-gray-500 mt-1">Manage all individual units across all properties.</p>
        </div>
        <Link to={ROUTES.ADMIN_UNIT_CREATE}>
          <Button className="bg-[#219377] hover:bg-[#1a7c67] text-white"><PlusCircle className="w-5 h-5 mr-2" /> Add New Unit</Button>
        </Link>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-lg border border-[#e6f7f2] mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center"><SlidersHorizontal className="w-5 h-5 mr-2" /> Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select name="propertyId" value={filters.propertyId} onChange={handleFilterChange} disabled={propertiesLoading} className="w-full p-2 border rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-[#e6f7f2] focus:border-[#219377]">
            <option value="">All Properties</option>
            {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 border rounded-lg shadow-sm bg-white focus:ring-2 focus:ring-[#e6f7f2] focus:border-[#219377]">
            <option value="">All Statuses</option><option value="available">Available</option><option value="occupied">Occupied</option>
          </select>
          <Input name="search" placeholder="Search units..." value={filters.search} onChange={handleFilterChange} />
          <Button onClick={handleResetFilters} variant="secondary"><RefreshCw className="w-4 h-4 mr-2" /> Reset</Button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-lg border border-[#e6f7f2] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr className="text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
              <th className="px-6 py-3">Unit</th><th className="px-6 py-3">Property</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Tenant</th><th className="px-6 py-3">Created</th><th className="px-6 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {units.map(unit => (
                <tr key={unit._id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-800">{unit.displayName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600"><Link to={`${ROUTES.ADMIN_PROPERTIES}/${unit.property?._id}`} className="hover:text-[#219377]">{unit.propertyName}</Link></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${unit.statusClass}`}>{unit.statusDisplay}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600">{unit.tenant?._id ? <Link to={`${ROUTES.ADMIN_USERS}/${unit.tenant._id}`} className="hover:text-[#219377]">{unit.tenantName}</Link> : 'Vacant'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{unit.createdAtFormatted}</td>
                  <td className="px-6 py-4 text-right relative">
                    <Button variant="icon" onClick={() => setActiveDropdown(activeDropdown === unit._id ? null : unit._id)}><MoreVertical className="w-5 h-5" /></Button>
                    {activeDropdown === unit._id && <div ref={dropdownRef} className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link to={`${ROUTES.ADMIN_UNITS}/${unit._id}`} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><Eye className="w-4 h-4 mr-2" />View Details</Link>
                        <Link to={`${ROUTES.ADMIN_UNITS}/edit/${unit._id}`} className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><Edit className="w-4 h-4 mr-2" />Edit Unit</Link>
                        {unit.isActive && <a href="#" onClick={e => { e.preventDefault(); openDeactivateModal(unit); }} className="text-red-600 block px-4 py-2 text-sm hover:bg-gray-100 flex items-center"><Trash2 className="w-4 h-4 mr-2" />Deactivate</a>}
                      </div>
                    </div>}
                  </td>
                </tr>
              ))}
              {units.length === 0 && !loading && <tr><td colSpan="6" className="py-10 text-center text-gray-500">No units found.</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-700">Page <span className="font-bold">{filters.page}</span> of <span className="font-bold">{totalPages}</span> ({totalUnits} units)</span>
          <div className="flex gap-2">
            <Button onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page <= 1} variant="secondary"><ChevronLeft className="w-4 h-4 mr-1" />Previous</Button>
            <Button onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page >= totalPages} variant="secondary">Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
          </div>
        </div>}
      </section>

      <ConfirmationModal
        isOpen={showDeactivateModal}
        title="Deactivate Unit"
        message={`Are you sure you want to deactivate "${selectedUnit?.displayName}"?`}
        confirmButtonClass="bg-red-600"
        confirmText={actionLoading ? "Deactivating..." : "Deactivate"}
        onConfirm={handleDeactivateUnit}
        onClose={() => setShowDeactivateModal(false)}
      />
    </div>
  );
};

export default AdminUnitManagementPage;