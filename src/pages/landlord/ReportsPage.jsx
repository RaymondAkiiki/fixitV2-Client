import React, { useState, useEffect, useMemo } from "react";
import Button from "../../components/common/Button";
import DashboardFilters from "../../components/common/DashboardFilters";
import { BarChart, FileText, Download, Filter } from "lucide-react";
import StatusBadge from "../../components/common/StatusBadge";
import { getAllRequests } from "../../services/requestService";
import { getAllScheduledMaintenance } from "../../services/scheduledMaintenanceService";
import { getAllProperties } from "../../services/propertyService";
import { getAllVendors } from "../../services/vendorService";
import { getAllUsers } from "../../services/userService";

// Branding
const PRIMARY_COLOR = "#219377";
const SECONDARY_COLOR = "#ffbd59";

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  alert(msg);
};

function matchOrAll(field, value) {
  if (!value || value === "all" || value === "") return true;
  if (field == null) return false;
  return String(field) === String(value);
}

function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    propertyId: "",
    status: "all",
    category: "all",
    role: "all",
  });
  const [properties, setProperties] = useState([]);
  const [requests, setRequests] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);

  // Load all data on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getAllProperties(),
      getAllRequests(),
      getAllScheduledMaintenance(),
      getAllUsers(),
      getAllVendors(),
    ])
      .then(([props, reqs, maint, usrs, vens]) => {
        setProperties(props);
        setRequests(reqs.requests || reqs);
        setMaintenance(maint.tasks || maint);
        setUsers(usrs);
        setVendors(vens);
      })
      .catch(err => {
        setError("Failed to load data: " + (err.response?.data?.message || err.message));
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return requests.filter(r =>
      matchOrAll(r.property && r.property._id, filters.propertyId) &&
      matchOrAll(r.status, filters.status) &&
      matchOrAll(r.category, filters.category) &&
      (!filters.startDate || (r.createdAt && new Date(r.createdAt) >= new Date(filters.startDate))) &&
      (!filters.endDate || (r.createdAt && new Date(r.createdAt) <= new Date(filters.endDate)))
    );
  }, [requests, filters]);

  // Filtered Maintenance
  const filteredMaintenance = useMemo(() => {
    return maintenance.filter(m =>
      matchOrAll(m.property && m.property._id, filters.propertyId) &&
      matchOrAll(m.status, filters.status) &&
      matchOrAll(m.category, filters.category) &&
      (!filters.startDate || (m.scheduledDate && new Date(m.scheduledDate) >= new Date(filters.startDate))) &&
      (!filters.endDate || (m.scheduledDate && new Date(m.scheduledDate) <= new Date(filters.endDate)))
    );
  }, [maintenance, filters]);

  // Export current view as CSV
  const handleExportReport = () => {
    let csvContent = "Type,Title,Status,Category,Property,Unit,Created By,Assigned To,Created/Scheduled Date\n";
    const formatRow = (item, type) => [
      type,
      `"${item.title || ""}"`,
      item.status || "",
      item.category || "",
      item.property?.name || "",
      item.unit?.unitName || "",
      item.createdBy?.name || item.createdBy?.email || "",
      item.assignedTo?.name || item.assignedTo?.email || "",
      new Date(type === "Request" ? item.createdAt : item.scheduledDate).toLocaleDateString()
    ].join(",");
    filteredRequests.forEach(req => {
      csvContent += formatRow(req, "Request") + "\n";
    });
    filteredMaintenance.forEach(task => {
      csvContent += formatRow(task, "Scheduled Maintenance") + "\n";
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", "report_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showMessage("Report exported successfully!", 'success');
  };

  return (
    <div className="p-4 md:p-8 min-h-full" style={{ background: "#f9fafb" }}>
      <h1 className="text-3xl font-extrabold mb-7 border-b pb-3 flex items-center"
        style={{ color: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}>
        <BarChart className="w-8 h-8 mr-3" style={{ color: SECONDARY_COLOR }} />
        Reports & Analytics
      </h1>

      {error && (
        <div className="px-4 py-3 rounded relative mb-4 flex items-center"
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

      {/* Improved Filters & Export Section */}
      <div
        className="p-8 rounded-xl shadow-lg border mb-8"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "14" }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-5">
          <div className="flex items-center gap-3">
            <Filter className="w-7 h-7 text-[var(--brand-secondary,#ffbd59)]" />
            <h2 className="text-2xl font-semibold" style={{ color: PRIMARY_COLOR }}>
              Filter & Export Data
            </h2>
          </div>
          <Button
            onClick={handleExportReport}
            className="flex items-center px-5 py-2 rounded-lg shadow-md"
            style={{
              backgroundColor: PRIMARY_COLOR,
              color: "#fff",
              fontWeight: 600,
              minWidth: 220,
              justifyContent: "center"
            }}
            disabled={loading}
          >
            <Download className="w-5 h-5 mr-2" /> Export Current View (CSV)
          </Button>
        </div>
        <div className="mt-2">
          <DashboardFilters
            filters={filters}
            setFilters={setFilters}
            properties={properties}
            showDateRangeFilter={true}
            showPropertyFilter={true}
            showStatusFilter={true}
            statusOptions={[
              "all", "new", "assigned", "in_progress", "completed", "verified", "reopened", "archived", "scheduled", "cancelled"
            ]}
            showCategoryFilter={true}
            showRoleFilter={false}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          />
        </div>
      </div>

      {/* Details Table */}
      <div
        className="p-8 rounded-xl shadow-lg border"
        style={{ background: "#fff", borderColor: PRIMARY_COLOR + "14" }}
      >
        <h2 className="text-2xl font-semibold mb-5 flex items-center"
          style={{ color: PRIMARY_COLOR }}>
          <FileText className="w-6 h-6 mr-2" style={{ color: SECONDARY_COLOR }} />
          Requests & Scheduled Maintenance Details
        </h2>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl" style={{ color: PRIMARY_COLOR + "99" }}>Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y" style={{ borderColor: PRIMARY_COLOR + "10" }}>
              <thead style={{ background: "#f6fcfa" }}>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Type</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Title</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Status</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Category</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Property</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Unit</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Created By</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Assigned To</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: PRIMARY_COLOR }}>Created/Scheduled Date</th>
                </tr>
              </thead>
              <tbody>
                {/* Requests */}
                {filteredRequests.map((item, idx) => (
                  <tr key={"req-" + (item._id || idx)} className="hover:bg-[#f0fdfa] transition">
                    <td className="px-4 py-2 text-sm font-medium" style={{ color: SECONDARY_COLOR }}>Request</td>
                    <td className="px-4 py-2 text-sm">{item.title}</td>
                    <td className="px-4 py-2 text-sm capitalize">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-2 text-sm capitalize">{item.category}</td>
                    <td className="px-4 py-2 text-sm">{item.property?.name || ""}</td>
                    <td className="px-4 py-2 text-sm">{item.unit?.unitName || ""}</td>
                    <td className="px-4 py-2 text-sm">{item.createdBy?.name || item.createdBy?.email || ""}</td>
                    <td className="px-4 py-2 text-sm">{item.assignedTo?.name || item.assignedTo?.email || ""}</td>
                    <td className="px-4 py-2 text-sm">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</td>
                  </tr>
                ))}
                {/* Maintenance */}
                {filteredMaintenance.map((item, idx) => (
                  <tr key={"sm-" + (item._id || idx)} className="hover:bg-[#fff9ed] transition">
                    <td className="px-4 py-2 text-sm font-medium" style={{ color: SECONDARY_COLOR }}>Scheduled Maintenance</td>
                    <td className="px-4 py-2 text-sm">{item.title}</td>
                    <td className="px-4 py-2 text-sm capitalize">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-2 text-sm capitalize">{item.category}</td>
                    <td className="px-4 py-2 text-sm">{item.property?.name || ""}</td>
                    <td className="px-4 py-2 text-sm">{item.unit?.unitName || ""}</td>
                    <td className="px-4 py-2 text-sm">{item.createdBy?.name || item.createdBy?.email || ""}</td>
                    <td className="px-4 py-2 text-sm">{item.assignedTo?.name || item.assignedTo?.email || ""}</td>
                    <td className="px-4 py-2 text-sm">{item.scheduledDate ? new Date(item.scheduledDate).toLocaleDateString() : ""}</td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && filteredMaintenance.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center italic" style={{ color: PRIMARY_COLOR + "99" }}>
                      No requests or scheduled maintenance found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;