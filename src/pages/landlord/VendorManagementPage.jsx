import React, { useState, useEffect } from "react";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import { getAllVendors, addVendor, updateVendor, deleteVendor } from "../../services/vendorService";
import { PlusCircle, Search, Edit, Trash2 } from "lucide-react";

const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

const serviceOptions = [
  { value: "Plumbing", label: "Plumbing" },
  { value: "Electrical", label: "Electrical" },
  { value: "HVAC", label: "HVAC" },
  { value: "Appliance", label: "Appliance" },
  { value: "Structural", label: "Structural" },
  { value: "Landscaping", label: "Landscaping" },
  { value: "Other", label: "Other" },
  { value: "Cleaning", label: "Cleaning" },
  { value: "Security", label: "Security" },
  { value: "Pest Control", label: "Pest Control" },
];

const showMessage = (msg, type = "info") => {
  alert(msg);
};

function VendorManagementPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters and pagination
  const [filterSearch, setFilterSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalVendors, setTotalVendors] = useState(0);

  // Add Vendor Modal
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    address: "",
    description: "",
  });
  const [addVendorError, setAddVendorError] = useState("");

  // Edit Vendor Modal
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [editVendorForm, setEditVendorForm] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    address: "",
    description: "",
  });
  const [editVendorError, setEditVendorError] = useState("");

  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line
  }, [filterSearch, currentPage, itemsPerPage]);

  const fetchVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllVendors();
      const filtered = filterSearch
        ? data.filter(
            (v) =>
              v.name?.toLowerCase().includes(filterSearch.toLowerCase()) ||
              v.email?.toLowerCase().includes(filterSearch.toLowerCase()) ||
              (v.services || []).some((s) =>
                s.toLowerCase().includes(filterSearch.toLowerCase())
              )
          )
        : data;
      setTotalVendors(filtered.length);
      const paged = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
      setVendors(paged);
    } catch (err) {
      setError("Failed to fetch vendors: " + (err.response?.data?.message || err.message));
      setVendors([]);
      setTotalVendors(0);
    } finally {
      setLoading(false);
    }
  };

  // --- Add Vendor Handlers ---
  const handleAddVendorFormChange = (e) => {
    const { name, value } = e.target;
    setVendorForm((f) => ({ ...f, [name]: value }));
  };

  const handleAddVendorSubmit = async (e) => {
    e.preventDefault();
    setAddVendorError("");
    try {
      const payload = { ...vendorForm, services: [vendorForm.service] };
      delete payload.service;
      await addVendor(payload);
      showMessage("Vendor added successfully!", "success");
      setShowAddVendorModal(false);
      setVendorForm({ name: "", phone: "", email: "", service: "", address: "", description: "" });
      fetchVendors();
    } catch (err) {
      setAddVendorError("Failed to add vendor: " + (err.response?.data?.message || err.message));
    }
  };

  // --- Edit Vendor Handlers ---
  const handleOpenEditVendorModal = (vendor) => {
    setEditingVendorId(vendor._id);
    setEditVendorForm({
      name: vendor.name || "",
      phone: vendor.phone || "",
      email: vendor.email || "",
      service: (vendor.services && vendor.services[0]) || "",
      address: vendor.address || "",
      description: vendor.description || "",
    });
    setShowEditVendorModal(true);
  };

  const handleEditVendorFormChange = (e) => {
    const { name, value } = e.target;
    setEditVendorForm((f) => ({ ...f, [name]: value }));
  };

  const handleEditVendorSubmit = async (e) => {
    e.preventDefault();
    setEditVendorError("");
    try {
      const payload = { ...editVendorForm, services: [editVendorForm.service] };
      delete payload.service;
      await updateVendor(editingVendorId, payload);
      showMessage("Vendor updated successfully!", "success");
      setShowEditVendorModal(false);
      setEditingVendorId(null);
      fetchVendors();
    } catch (err) {
      setEditVendorError("Failed to update vendor: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this vendor? This action cannot be undone."
      )
    ) {
      try {
        await deleteVendor(vendorId);
        showMessage("Vendor deleted successfully!", "success");
        fetchVendors();
      } catch (err) {
        showMessage(
          "Failed to delete vendor: " + (err.response?.data?.message || err.message),
          "error"
        );
      }
    }
  };

  // -------------------- UI ------------------------

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1
        className="text-3xl font-extrabold mb-7 border-b pb-3"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
      >
        Vendor Management
      </h1>
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
          role="alert"
        >
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Filters and Actions */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 rounded-lg shadow-sm border"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "14" }}
      >
        <Button
          onClick={() => setShowAddVendorModal(true)}
          className="flex items-center px-5 py-2 rounded-lg shadow-md font-semibold"
          style={{ backgroundColor: SECONDARY_COLOR, color: "#1a3b34" }}
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add New Vendor
        </Button>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCurrentPage(1);
            fetchVendors();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Search by name, email, service"
            value={filterSearch}
            onChange={(e) => {
              setFilterSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border rounded-md"
            style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
          />
          <Button
            type="submit"
            className="py-2 px-4 rounded-lg"
            style={{
              backgroundColor: "#e4e4e7",
              color: PRIMARY_COLOR,
              fontWeight: 600,
            }}
          >
            <Search className="w-5 h-5" />
          </Button>
        </form>
      </div>
      <div
        className="bg-white p-6 rounded-xl shadow-lg border"
        style={{ borderColor: PRIMARY_COLOR + "14" }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>
              Loading vendors...
            </p>
          </div>
        ) : vendors.length === 0 ? (
          <p className="text-gray-600 italic text-center py-8">No vendors found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: PRIMARY_COLOR + "10" }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <tr key={vendor._id} className="hover:bg-[#f0fdfa] transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{vendor.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{vendor.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{vendor.phone || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                      {(vendor.services && vendor.services[0]) || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{vendor.address || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleOpenEditVendorModal(vendor)}
                          className="p-2 rounded-md"
                          style={{
                            backgroundColor: "#eef2ff",
                            color: "#3730a3",
                          }}
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteVendor(vendor._id)}
                          className="p-2 rounded-md"
                          style={{
                            backgroundColor: "#fee2e2",
                            color: "#b91c1c",
                          }}
                          title="Delete"
                        >
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
        isOpen={showAddVendorModal}
        onClose={() => setShowAddVendorModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Add New Vendor</span>}
      >
        <form onSubmit={handleAddVendorSubmit} className="p-4 space-y-4">
          {addVendorError && (
            <p className="text-red-500 text-sm mb-3">{addVendorError}</p>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Vendor Name
            </label>
            <input
              type="text"
              name="name"
              value={vendorForm.name}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={vendorForm.email}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={vendorForm.phone}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Service
            </label>
            <select
              name="service"
              value={vendorForm.service}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            >
              <option value="">Select Service</option>
              {serviceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Address
            </label>
            <input
              type="text"
              name="address"
              value={vendorForm.address}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Description
            </label>
            <textarea
              name="description"
              value={vendorForm.description}
              onChange={handleAddVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 h-24"
              style={{ borderColor: PRIMARY_COLOR }}
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => setShowAddVendorModal(false)}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: SECONDARY_COLOR,
                color: "#1a3b34",
                fontWeight: 600,
              }}
            >
              Add Vendor
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal
        isOpen={showEditVendorModal}
        onClose={() => setShowEditVendorModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>{`Edit Vendor: ${editVendorForm.name}`}</span>}
      >
        <form onSubmit={handleEditVendorSubmit} className="p-4 space-y-4">
          {editVendorError && (
            <p className="text-red-500 text-sm mb-3">{editVendorError}</p>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Vendor Name
            </label>
            <input
              type="text"
              name="name"
              value={editVendorForm.name}
              onChange={handleEditVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={editVendorForm.email}
              onChange={handleEditVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Phone
            </label>
            <input
              type="text"
              name="phone"
              value={editVendorForm.phone}
              onChange={handleEditVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Service
            </label>
            <select
              name="service"
              value={editVendorForm.service}
              onChange={handleEditVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            >
              <option value="">Select Service</option>
              {serviceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Address
            </label>
            <input
              type="text"
              name="address"
              value={editVendorForm.address}
              onChange={handleEditVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: PRIMARY_COLOR }}>
              Description
            </label>
            <textarea
              name="description"
              value={editVendorForm.description}
              onChange={handleEditVendorFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 h-24"
              style={{ borderColor: PRIMARY_COLOR }}
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => setShowEditVendorModal(false)}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: "#6366f1",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default VendorManagementPage;