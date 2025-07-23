import React, { useState } from "react";
import FileUploader from "../../components/FileUploader";
import * as onboardingService from "../../services/onboardingService";

/**
 * FileUploadPage - Standalone page for uploading documents/SOPs.
 * You can use this for admin/landlord/PM or even tenant document upload.
 */
const FileUploadPage = () => {
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (formData) => {
    setUploading(true);
    setSuccess("");
    setError("");
    try {
      await onboardingService.createOnboarding(formData);
      setSuccess("File uploaded successfully!");
    } catch (err) {
      setError("Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "3rem auto" }}>
      <h2>Upload Document/SOP</h2>
      <FileUploader
        onUpload={handleUpload}
        accept=".pdf,.doc,.docx,image/*"
        label="Choose a file to upload"
      />
      {uploading && <div style={{ color: "#1e40af", marginTop: 12 }}>Uploading...</div>}
      {success && <div style={{ color: "#059669", marginTop: 12 }}>{success}</div>}
      {error && <div style={{ color: "#ef4444", marginTop: 12 }}>{error}</div>}
    </div>
  );
};

export default FileUploadPage;