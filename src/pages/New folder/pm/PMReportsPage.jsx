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

// Helper for displaying messages to user
const showMessage = (msg, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${msg}`);
  alert(msg); // Fallback to alert
};

// Robust type-safe filter helper
function matchOrAll(field, value) {
  if (!value || value === "all" || value === "") return true;
  if (field == null) return false;
  return String(field) === String(value);
}

function PMReportsPage() {
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
        setRequests(reqs.requests || reqs); // fallback if not in {requests: []}
        setMaintenance(maint.tasks || maint); // fallback if not in {tasks: []}
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

  // Debug output
  // Remove in production, but useful for filter troubleshooting!
  // console.log("Filters:", filters, "Sample Req:", requests[0], "Sample Maint:", maintenance[0]);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 border-b pb-2 flex items-center">
        <BarChart className="w-8 h-8 mr-3 text-green-700" />
        Reports & Analytics
      </h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>}

      {/* Filters */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
          <Filter className="w-6 h-6 mr-2 text-blue-600" />
          Filter and Export
        </h2>

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
        />

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleExportReport}
            className="bg-green-600 hover:bg-green-700 text-white py-2 px-5 rounded-lg shadow-md flex items-center"
            disabled={loading}
          >
            <Download className="w-5 h-5 mr-2" /> Export Current View (CSV)
          </Button>
        </div>
      </div>

      {/* Details Table */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-5 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-green-700" />
          Requests & Scheduled Maintenance Details
        </h2>

        {/* Debug Info: uncomment to help diagnose filter issues */}
        {/* <pre style={{fontSize:'12px',color:'#888'}}>Filters: {JSON.stringify(filters, null, 2)}</pre>
        <pre style={{fontSize:'12px',color:'#888'}}>First Req: {JSON.stringify(filteredRequests[0], null, 2)}</pre>
        <pre style={{fontSize:'12px',color:'#888'}}>First Maint: {JSON.stringify(filteredMaintenance[0], null, 2)}</pre> */}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created By</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created/Scheduled Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Requests */}
                {filteredRequests.map((item, idx) => (
                  <tr key={"req-" + (item._id || idx)}>
                    <td className="px-4 py-2 text-sm">Request</td>
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
                  <tr key={"sm-" + (item._id || idx)}>
                    <td className="px-4 py-2 text-sm">Scheduled Maintenance</td>
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
                    <td colSpan={9} className="py-8 text-center italic text-gray-600">
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

export default PMReportsPage;