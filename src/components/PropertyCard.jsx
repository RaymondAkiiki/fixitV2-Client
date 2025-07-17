import React from "react";

const PropertyCard = ({ property, onClick }) => {
  if (!property) return null;
  return (
    <div
      className="property-card"
      onClick={onClick}
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        padding: "1.2rem",
        marginBottom: "1rem",
        cursor: onClick ? "pointer" : "default",
        background: "#fff",
        boxShadow: "0 1px 2px #0001"
      }}
    >
      <h3 style={{ margin: 0 }}>{property.name}</h3>
      <div style={{ color: "#6b7280", fontSize: "0.95rem" }}>{property.address}</div>
      <div style={{ color: "#4b5563", margin: "0.5rem 0" }}>
        Location: {property.location || "N/A"}
      </div>
      <div style={{ fontSize: "0.9rem", color: "#64748b" }}>
        Owner: {property.owner?.name || "—"}
      </div>
    </div>
  );
};

export default PropertyCard;