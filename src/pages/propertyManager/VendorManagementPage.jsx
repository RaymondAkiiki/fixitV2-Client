// frontend/src/pages/pm/VendorManagementPage.jsx

import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PropertyManagerLayout from "../../components/layout/PropertyManagerLayout";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";

// Service imports
import { getAllVendors, addVendor, updateVendor, deleteVendor } from "../../services/vendorService";

// Icons
import { PlusCircle, Search, Edit, Trash2, Eye } from 'lucide-react';

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Keeping alert for now
};

/**
 * VendorManagementPage provides a comprehensive view and management interface for Vendors.
 */
function VendorManagementPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for filters and pagination
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterSearch, setFilterSearch] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalVendors, setTotalVendors] = useState(0);

  // State for Add Vendor Modal
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({ name: "", phone: "", email: "", services: "", address: "", description: "" });
  const [addVendorError, setAddVendorError] = useState("");

  // State for Edit Vendor Modal
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [editVendorForm, setEditVendorForm] = useState({ name: "", phone: "", email: "", services: "", address: "", description: "" });
  const [editVendorError, setEditVendorError] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    fetchVendors();
    const newParams = {};
    if (filterSearch) newParams.search = filterSearch;
    newParams.page = currentPage;
    newParams.limit = itemsPerPage;
    setSearchParams(newParams);
  }, [filterSearch, currentPage, itemsPerPage]);

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        search: filterSearch || undefined,
        page: currentPage,
        limit: itemsPerPage,
      };
      // Note: getAllVendors doesn't currently support search params on backend,
      // but if it did, this is how you'd pass them. For now, it fetches all.
      const data = await getAllVendors(); // Assuming this returns array directly
      setVendors(data);
      setTotalVendors(data.length); // For client-side pagination if backend doesn't provide total
    } catch (err) {
      setError('Failed to fetch vendors: ' + (err.response?.data?.message || err.message));
      console.error("Fetch vendors error:", err);
      setVendors([]);
      setTotalVendors(0);
    } finally {
      setLoading(false);
    }
  };

  // --- Add Vendor Handlers ---
  const handleAddVendorFormChange = (e) => setVendorForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleAddVendorSubmit = async (e) => {
    e.preventDefault();
    setAddVendorError("");
    try {
      const payload = {
        ...vendorForm,
        services: vendorForm.services.split(',').map(s => s.trim()).filter(s => s), // Convert string to array
      };
      await addVendor(payload);
      showMessage("Vendor added successfully!", 'success');
      setShowAddVendorModal(false);
      setVendorForm({ name: "", phone: "", email: "", services: "", address: "", description: "" });
      fetchVendors();
    } catch (err) {
      setAddVendorError("Failed to add vendor: " + (err.response?.data?.message || err.message));
      console.error("Add vendor error:", err);
    }
  };

  // --- Edit Vendor Handlers ---
  const handleOpenEditVendorModal = (vendor) => {
    setEditingVendorId(vendor._id);
    setEditVendorForm({
      name: vendor.name || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      services: (vendor.services || []).join(', '), // Convert array to string for input
      address: vendor.address || "",
      description: vendor.description || ""
    });
    setShowEditVendorModal(true);
  };

  const handleEditVendorFormChange = (e) => setEditVendorForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEditVendorSubmit = async (e) => {
    e.preventDefault();
    setEditVendorError("");
    try {
      const payload = {
        ...editVendorForm,
        services: editVendorForm.services.split(',').map(s => s.trim()).filter(s => s),
      };
      await updateVendor(editingVendorId, payload);
      showMessage("Vendor updated successfully!", 'success');
      setShowEditVendorModal(false);
      setEditingVendorId(null);
      fetchVendors();
    } catch (err) {
      setEditVendorError("Failed to update vendor: " + (err.response?.data?.message || err.message));
      console.error("Edit vendor error:", err);
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (window.confirm("Are you sure you want to delete this vendor? This action cannot be undone.")) {
      try {
        await deleteVendor(vendorId);
        showMessage("Vendor deleted successfully!", 'success');
        fetchVendors();
      } catch (err) {
        showMessage("Failed to delete vendor: " + (err.response?.data?.message || err.message), 'error');
        console.error("Delete vendor error:", err);
      }
    }
  };

  return (
    <PropertyManagerLayout>
      <div className="p-4 md:p-8 bg-gray-50 min-h-full">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">Vendor Management</h1>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>}

        {/* Controls and Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
          <Button
            onClick={() => setShowAddVendorModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center space-x-2"
          >
            <PlusCircle className="w-5 h-5" /> <span>Add New Vendor</span>
          </Button>

          <form onSubmit={(e) => { e.preventDefault(); fetchVendors(); }} className="flex items-center gap-2">
            <label htmlFor="filterSearch" className="sr-only">Search Vendors</label>
            <input
              type="text"
              id="filterSearch"
              placeholder="Search by name, email, services"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <Button type="submit" className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg">
              <Search className="w-5 h-5" />
            </Button>
          </form>
        </div>

        {/* Vendors Table */}
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-xl text-gray-600">Loading vendors...</p>
            </div>
          ) : vendors.length === 0 ? (
            <p className="text-gray-600 italic text-center py-8">No vendors found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendor.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendor.phone || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{vendor.services?.join(', ') || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendor.address || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                           <Button onClick={() => handleOpenEditVendorModal(vendor)} className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md" title="Edit">
                               <Edit className="w-5 h-5" />
                           </Button>
                           <Button onClick={() => handleDeleteVendor(vendor._id)} className="text-red-600 hover:text-red-900 p-1 rounded-md" title="Delete">
                               <Trash2 className="w-5 h-5" />
                           </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            totalItems={totalVendors}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Add New Vendor Modal (reused from dashboard) */}
        <Modal
          isOpen={showAddVendorModal}
          onClose={() => setShowAddVendorModal(false)}
          title="Add New Vendor"
        >
          <form onSubmit={handleAddVendorSubmit} className="p-4 space-y-4">
            {addVendorError && <p className="text-red-500 text-sm mb-3">{addVendorError}</p>}
            <div>
              <label htmlFor="addVendorName" className="block text-sm font-medium text-gray-700">Vendor Name</label>
              <input type="text" id="addVendorName" name="name" value={vendorForm.name} onChange={handleAddVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="addVendorEmail" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="addVendorEmail" name="email" value={vendorForm.email} onChange={handleAddVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="addVendorPhone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" id="addVendorPhone" name="phone" value={vendorForm.phone} onChange={handleAddVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="addVendorServices" className="block text-sm font-medium text-gray-700">Services (comma separated)</label>
              <input type="text" id="addVendorServices" name="services" value={vendorForm.services} onChange={handleAddVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="e.g., plumbing, electrical, HVAC" />
            </div>
            <div>
              <label htmlFor="addVendorAddress" className="block text-sm font-medium text-gray-700">Address</label>
              <input type="text" id="addVendorAddress" name="address" value={vendorForm.address} onChange={handleAddVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="addVendorDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="addVendorDescription" name="description" value={vendorForm.description} onChange={handleAddVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"></textarea>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" onClick={() => setShowAddVendorModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg">Add Vendor</Button>
            </div>
          </form>
        </Modal>

        {/* Edit Vendor Modal */}
        <Modal
          isOpen={showEditVendorModal}
          onClose={() => setShowEditVendorModal(false)}
          title={`Edit Vendor: ${editVendorForm.name}`}
        >
          <form onSubmit={handleEditVendorSubmit} className="p-4 space-y-4">
            {editVendorError && <p className="text-red-500 text-sm mb-3">{editVendorError}</p>}
            <div>
              <label htmlFor="editVendorName" className="block text-sm font-medium text-gray-700">Vendor Name</label>
              <input type="text" id="editVendorName" name="name" value={editVendorForm.name} onChange={handleEditVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="editVendorEmail" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="editVendorEmail" name="email" value={editVendorForm.email} onChange={handleEditVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="editVendorPhone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" id="editVendorPhone" name="phone" value={editVendorForm.phone} onChange={handleEditVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
            </div>
            <div>
              <label htmlFor="editVendorServices" className="block text-sm font-medium text-gray-700">Services (comma separated)</label>
              <input type="text" id="editVendorServices" name="services" value={editVendorForm.services} onChange={handleEditVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" placeholder="e.g., plumbing, electrical, HVAC" />
            </div>
            <div>
              <label htmlFor="editVendorAddress" className="block text-sm font-medium text-gray-700">Address</label>
              <input type="text" id="editVendorAddress" name="address" value={editVendorForm.address} onChange={handleEditVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
            </div>
            <div>
              <label htmlFor="editVendorDescription" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="editVendorDescription" name="description" value={editVendorForm.description} onChange={handleEditVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"></textarea>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button type="button" onClick={() => setShowEditVendorModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg">Save Changes</Button>
            </div>
          </form>
        </Modal>
      </div>
    </PropertyManagerLayout>
  );
}

export default VendorManagementPage;
