import React, { useState, useEffect } from "react";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { getAllVendors, createVendor, updateVendor, deleteVendor } from "../../services/vendorService";
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react';

const serviceOptions = [
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'Appliance', label: 'Appliance' },
  { value: 'Structural', label: 'Structural' },
  { value: 'Landscaping', label: 'Landscaping' },
  { value: 'Other', label: 'Other' },
  { value: 'Cleaning', label: 'Cleaning' },
  { value: 'Security', label: 'Security' },
  { value: 'Pest Control', label: 'Pest Control' }
];

const showMessage = (msg, type = 'info') => {
  alert(msg);
};

function PMVendorManagementPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and pagination
  const [filterSearch, setFilterSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalVendors, setTotalVendors] = useState(0);

  // Add Vendor Modal
  const [showCreateVendorModal, setShowCreateVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: "", phone: "", email: "", service: "", address: "", description: ""
  });
  const [createVendorError, setCreateVendorError] = useState("");

  // Edit Vendor Modal
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [editVendorForm, setEditVendorForm] = useState({
    name: "", phone: "", email: "", service: "", address: "", description: ""
  });
  const [editVendorError, setEditVendorError] = useState("");

  useEffect(() => { fetchVendors(); }, []);
  useEffect(() => { fetchVendors(); }, [filterSearch, currentPage, itemsPerPage]);

  const fetchVendors = async () => {
    setLoading(true); setError(null);
    try {
      const data = await getAllVendors();
      const filtered = filterSearch
        ? data.filter(v =>
            v.name?.toLowerCase().includes(filterSearch.toLowerCase()) ||
            v.email?.toLowerCase().includes(filterSearch.toLowerCase()) ||
            (v.services || []).some(s => s.toLowerCase().includes(filterSearch.toLowerCase()))
          )
        : data;
      setTotalVendors(filtered.length);
      const paged = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
      setVendors(paged);
    } catch (err) {
      setError('Failed to fetch vendors: ' + (err.response?.data?.message || err.message));
      setVendors([]); setTotalVendors(0);
    } finally { setLoading(false); }
  };

  // --- Add Vendor Handlers ---
  const handleCreateVendorFormChange = (e) => {
    const { name, value } = e.target;
    setVendorForm(f => ({ ...f, [name]: value }));
  };

  const handleCreateVendorSubmit = async (e) => {
    e.preventDefault();
    setCreateVendorError("");
    try {
      // services must be an array (even if only one service selected)
      const payload = { ...vendorForm, services: [vendorForm.service] };
      delete payload.service;
      await createVendor(payload);
      showMessage("Vendor added successfully!", 'success');
      setShowCreateVendorModal(false);
      setVendorForm({ name: "", phone: "", email: "", service: "", address: "", description: "" });
      fetchVendors();
    } catch (err) {
      setCreateVendorError("Failed to add vendor: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Edit Vendor Handlers ---
  const handleOpenEditVendorModal = (vendor) => {
    setEditingVendorId(vendor._id);
    setEditVendorForm({
      name: vendor.name || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      service: (vendor.services && vendor.services[0]) || "", // first/only service
      address: vendor.address || "",
      description: vendor.description || ""
    });
    setShowEditVendorModal(true);
  };

  const handleEditVendorFormChange = (e) => {
    const { name, value } = e.target;
    setEditVendorForm(f => ({ ...f, [name]: value }));
  };

  const handleEditVendorSubmit = async (e) => {
    e.preventDefault();
    setEditVendorError("");
    try {
      const payload = { ...editVendorForm, services: [editVendorForm.service] };
      delete payload.service;
      await updateVendor(editingVendorId, payload);
      showMessage("Vendor updated successfully!", 'success');
      setShowEditVendorModal(false);
      setEditingVendorId(null);
      fetchVendors();
    } catch (err) {
      setEditVendorError("Failed to update vendor: " + (err.response?.data?.message || err.message));
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
      }
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2">Vendor Management</h1>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <Button
          onClick={() => setShowCreateVendorModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center space-x-2"
        >
          <PlusCircle className="w-5 h-5" /> <span>Add New Vendor</span>
        </Button>
        <form onSubmit={e => { e.preventDefault(); setCurrentPage(1); fetchVendors(); }} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by name, email, service"
            value={filterSearch}
            onChange={e => { setFilterSearch(e.target.value); setCurrentPage(1);} }
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <Button type="submit" className="bg-gray-400 hover:bg-gray-600 text-gray-800 py-2 px-4 rounded-lg">
            <Search className="w-5 h-5" />
          </Button>
        </form>
      </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendor.phone || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{(vendor.services && vendor.services[0]) || 'N/A'}</td>
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
      {/* Add Vendor Modal */}
      <Modal
        isOpen={showCreateVendorModal}
        onClose={() => setShowCreateVendorModal(false)}
        title="Add New Vendor"
      >
        <form onSubmit={handleCreateVendorSubmit} className="p-4 space-y-4">
          {createVendorError && <p className="text-red-500 text-sm mb-3">{createVendorError}</p>}
          <div>
            <label htmlFor="createVendorName" className="block text-sm font-medium text-gray-700">Vendor Name</label>
            <input type="text" id="createVendorName" name="name" value={vendorForm.name} onChange={handleCreateVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div>
            <label htmlFor="createVendorEmail" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="createVendorEmail" name="email" value={vendorForm.email} onChange={handleCreateVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div>
            <label htmlFor="createVendorPhone" className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="text" id="createVendorPhone" name="phone" value={vendorForm.phone} onChange={handleCreateVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required />
          </div>
          <div>
            <label htmlFor="createVendorService" className="block text-sm font-medium text-gray-700">Service</label>
            <select id="createVendorService" name="service" value={vendorForm.service} onChange={handleCreateVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
              <option value="">Select Service</option>
              {serviceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="createVendorAddress" className="block text-sm font-medium text-gray-700">Address</label>
            <input type="text" id="createVendorAddress" name="address" value={vendorForm.address} onChange={handleCreateVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
          </div>
          <div>
            <label htmlFor="createVendorDescription" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea id="createVendorDescription" name="description" value={vendorForm.description} onChange={handleCreateVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 h-24"></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button type="button" onClick={() => setShowCreateVendorModal(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg">Cancel</Button>
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
            <label htmlFor="editVendorService" className="block text-sm font-medium text-gray-700">Service</label>
            <select id="editVendorService" name="service" value={editVendorForm.service} onChange={handleEditVendorFormChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" required>
              <option value="">Select Service</option>
              {serviceOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
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
  );
}

export default PMVendorManagementPage;