import React, { useState } from "react";

/**
 * FileUploader for uploading SOP or doc files.
 * @param {function} onUpload - Called with FormData on submit
 * @param {string} accept - File types, e.g. 'application/pdf'
 * @param {string} label - Label for the file input
 */
const FileUploader = ({ onUpload, accept = "", label = "Upload File" }) => {
  const [file, setFile] = useState();
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = e => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (desc) formData.append("description", desc);
      await onUpload(formData);
      setFile(null);
      setDesc("");
    } catch (err) {
      setError("Failed to upload file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "1.2rem",
        marginBottom: "1rem"
      }}
    >
      <label>
        {label}
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={loading}
          style={{ display: "block", margin: "0.7rem 0" }}
        />
      </label>
      <input
        type="text"
        placeholder="Description (optional)"
        value={desc}
        onChange={e => setDesc(e.target.value)}
        style={{
          width: "100%",
          padding: "0.5rem",
          marginBottom: "0.7rem",
          borderRadius: "4px",
          border: "1px solid #cbd5e1"
        }}
        disabled={loading}
      />
      <button
        type="submit"
        style={{
          background: "#1e40af",
          color: "#fff",
          padding: "0.6rem 1.2rem",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer"
        }}
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
      {error && <div style={{ color: "#f43f5e", marginTop: "0.7rem" }}>{error}</div>}
    </form>
  );
};

export default FileUploader;