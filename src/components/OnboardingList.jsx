import React from "react";

/**
 * OnboardingList lists SOP/training entries.
 * @param {Object[]} entries - Array of onboarding/SOPs: { _id, title, description, fileUrl, createdAt }
 */
const OnboardingList = ({ entries }) => (
  <div style={{
    background: "#f1f5f9",
    borderRadius: "8px",
    padding: "1rem",
    border: "1px solid #e0e7ef"
  }}>
    <h3 style={{ marginBottom: "1rem", color: "#1e293b" }}>Onboarding & Training Documents</h3>
    {entries && entries.length ? (
      <ul style={{ listStyle: "none", padding: 0 }}>
        {entries.map(entry => (
          <li key={entry._id} style={{
            marginBottom: "1.2rem",
            padding: "0.8rem",
            background: "#fff",
            borderRadius: "6px",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ fontWeight: "bold", marginBottom: "0.3rem", color: "#1e40af" }}>
              {entry.title}
            </div>
            <div style={{ color: "#334155", marginBottom: "0.5rem" }}>
              {entry.description || <em>No description</em>}
            </div>
            {entry.fileUrl && (
              <a
                href={entry.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#0ea5e9" }}
              >
                View Document
              </a>
            )}
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.3rem" }}>
              Added: {new Date(entry.createdAt).toLocaleDateString()}
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <div style={{ color: "#64748b" }}>No onboarding documents found.</div>
    )}
  </div>
);

export default OnboardingList;