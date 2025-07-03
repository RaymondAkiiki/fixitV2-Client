import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { getAllProperties, createProperty, deleteProperty } from '../../services/propertyService';
import { PlusCircle, Edit, Trash2, Eye, Search } from 'lucide-react';
import { useGlobalAlert } from '../../context/GlobalAlertContext';

const PRIMARY_COLOR = '#219377';
const PRIMARY_DARK = '#197b63';
const SECONDARY_COLOR = '#ffbd59';

function PropertyManagementPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddPropertyModal, setShowAddPropertyModal] = useState(false);
  const [propertyForm, setPropertyForm] = useState({
    name: "",
    address: { street: "", city: "", state: "", country: "" },
    details: ""
  });
  const [addPropertyError, setAddPropertyError] = useState("");
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();
  const { showSuccess, showError } = useGlobalAlert();

  useEffect(() => {
    fetchProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = searchQuery ? { search: searchQuery } : {};
      const data = await getAllProperties(params);
      setProperties(data);
    } catch (err) {
      setError('Failed to fetch properties: ' + (err.response?.data?.message || err.message));
      showError('Failed to fetch properties: ' + (err.response?.data?.message || err.message));
      console.error("Fetch properties error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyFormChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setPropertyForm(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setPropertyForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddPropertySubmit = async (e) => {
    e.preventDefault();
    setAddPropertyError("");
    try {
      await createProperty(propertyForm);
      showSuccess("Property added successfully!");
      setShowAddPropertyModal(false);
      setPropertyForm({ name: "", address: { street: "", city: "", state: "", country: "" }, details: "" });
      fetchProperties();
    } catch (err) {
      const msg = "Failed to add property: " + (err.response?.data?.message || err.message);
      setAddPropertyError(msg);
      showError(msg);
      console.error("Add property error:", err);
    }
  };

  const handleDeleteProperty = async (propertyId) => {
    if (window.confirm("Are you sure you want to delete this property? This will also remove all associated units, requests, and tenant associations. This action cannot be undone.")) {
      try {
        await deleteProperty(propertyId);
        showSuccess("Property deleted successfully!");
        fetchProperties();
      } catch (err) {
        const msg = "Failed to delete property: " + (err.response?.data?.message || err.message);
        showError(msg);
        console.error("Delete property error:", err);
      }
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProperties();
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1 className="text-3xl font-extrabold mb-7 border-b pb-3" style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>Property Management</h1>

      {error && (
        <div
          className="px-4 py-3 rounded relative mb-4 flex items-center"
          style={{
            backgroundColor: "#fed7d7",
            border: "1.5px solid #f56565",
            color: "#9b2c2c"
          }}
          role="alert"
        >
          <strong className="font-bold mr-2">Error!</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Controls and Filters */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 rounded-lg shadow-sm border"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "10" }}
      >
        <Button
          onClick={() => setShowAddPropertyModal(true)}
          className="flex items-center space-x-2 py-2 px-5 rounded-lg shadow-md"
          style={{
            backgroundColor: PRIMARY_COLOR,
            color: "#fff",
            fontWeight: 600
          }}
        >
          <PlusCircle className="w-5 h-5" /> <span>Add New Property</span>
        </Button>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search properties by name/address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none"
            style={{
              borderColor: PRIMARY_COLOR,
              color: PRIMARY_COLOR,
              background: "#f6fcfa"
            }}
          />
          <Button
            type="submit"
            className="py-2 px-4 rounded-lg"
            style={{
              backgroundColor: SECONDARY_COLOR,
              color: "#222",
              fontWeight: 600
            }}
          >
            <Search className="w-5 h-5" />
          </Button>
        </form>
      </div>

      {/* Properties Table */}
      <div
        className="p-6 rounded-xl shadow-lg border"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "10" }}
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <p className="italic text-center py-8" style={{ color: PRIMARY_COLOR + "99" }}>No properties found. Add your first property!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: PRIMARY_COLOR + "20" }}>
              <thead style={{ background: "#f6fcfa" }}>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR + "cc" }}>Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR + "cc" }}>Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR + "cc" }}>Units</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: PRIMARY_COLOR + "cc" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((prop) => (
                  <tr key={prop._id} className="hover:bg-[#f0fdfa] transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold" style={{ color: PRIMARY_COLOR }}>{prop.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: "#1e293b" }}>
                      {prop.address?.street ? `${prop.address.street}, ` : ''}
                      {prop.address?.city}, {prop.address?.state}, {prop.address?.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: PRIMARY_COLOR + "bb" }}>{prop.units?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/landlord/properties/${prop._id}`}
                          title="View Details"
                          className="p-2 rounded-full transition"
                          style={{
                            background: "#e6f9f4", color: PRIMARY_COLOR
                          }}
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/landlord/properties/edit/${prop._id}`}
                          title="Edit Property"
                          className="p-2 rounded-full transition"
                          style={{
                            background: SECONDARY_COLOR + "30", color: PRIMARY_COLOR
                          }}
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProperty(prop._id)}
                          title="Delete Property"
                          className="p-2 rounded-full transition"
                          style={{
                            background: "#fde2e5",
                            color: "#e64848"
                          }}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination totalItems={properties.length} itemsPerPage={10} currentPage={1} onPageChange={() => {}} />
      </div>

      {/* Add New Property Modal */}
      <Modal
        isOpen={showAddPropertyModal}
        onClose={() => setShowAddPropertyModal(false)}
        title={<span style={{ color: PRIMARY_COLOR, fontWeight: 700 }}>Add New Property</span>}
      >
        <form onSubmit={handleAddPropertySubmit} className="p-4 space-y-4">
          {addPropertyError && <p className="text-red-500 text-sm mb-3">{addPropertyError}</p>}
          <div>
            <label htmlFor="modalPropertyName" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Property Name</label>
            <input
              type="text"
              id="modalPropertyName"
              name="name"
              value={propertyForm.name}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label htmlFor="modalPropertyStreet" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Street Address</label>
            <input
              type="text"
              id="modalPropertyStreet"
              name="address.street"
              value={propertyForm.address.street}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
            />
          </div>
          <div>
            <label htmlFor="modalPropertyCity" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>City</label>
            <input
              type="text"
              id="modalPropertyCity"
              name="address.city"
              value={propertyForm.address.city}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label htmlFor="modalPropertyState" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>State / Province</label>
            <input
              type="text"
              id="modalPropertyState"
              name="address.state"
              value={propertyForm.address.state}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
            />
          </div>
          <div>
            <label htmlFor="modalPropertyCountry" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Country</label>
            <input
              type="text"
              id="modalPropertyCountry"
              name="address.country"
              value={propertyForm.address.country}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              style={{ borderColor: PRIMARY_COLOR }}
              required
            />
          </div>
          <div>
            <label htmlFor="modalPropertyDetails" className="block text-sm font-semibold" style={{ color: PRIMARY_COLOR }}>Details (Max 1000 chars)</label>
            <textarea
              id="modalPropertyDetails"
              name="details"
              value={propertyForm.details}
              onChange={handlePropertyFormChange}
              className="mt-1 block w-full border rounded-md shadow-sm p-2 h-24"
              style={{ borderColor: PRIMARY_COLOR }}
              maxLength={1000}
            ></textarea>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button
              type="button"
              onClick={() => setShowAddPropertyModal(false)}
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: "#e4e4e7",
                color: PRIMARY_COLOR,
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="py-2 px-4 rounded-lg"
              style={{
                backgroundColor: PRIMARY_COLOR,
                color: "#fff",
                fontWeight: 600
              }}
            >
              Add Property
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default PropertyManagementPage;