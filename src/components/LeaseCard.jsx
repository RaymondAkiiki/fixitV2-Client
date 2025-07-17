import React from "react";

const LeaseCard = ({ lease, onClick }) => {
  if (!lease) return null;
  return (
    <div
      className="lease-card"
      onClick={onClick}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1.2rem",
        marginBottom: "1rem",
        background: "#f8fafc",
        cursor: onClick ? "pointer" : "default"
      }}
    >
      <h4 style={{ margin: 0 }}>
        Lease for {lease.property?.name || "Property"} ({lease.tenant?.name || "Tenant"})
      </h4>
      <div style={{ fontSize: "0.96rem", color: "#475569" }}>
        Start: {lease.startDate && new Date(lease.startDate).toLocaleDateString()}<br />
        End: {lease.endDate && new Date(lease.endDate).toLocaleDateString()}
      </div>
      <div style={{ color: "#2563eb", fontWeight: 500 }}>
        Status: {lease.status}
      </div>
      <div style={{ fontSize: "0.95rem", color: "#64748b" }}>
        Rent: ${lease.rentAmount?.toLocaleString() || "N/A"} / month
      </div>
    </div>
  );
};

export default LeaseCard;