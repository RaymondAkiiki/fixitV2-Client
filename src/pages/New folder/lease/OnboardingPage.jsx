
import React, { useState, useEffect } from "react";
import OnboardingList from "../../components/OnboardingList";
import FileUploader from "../../components/FileUploader";
import * as onboardingService from "../../services/onboardingService";

const OnboardingPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await onboardingService.getOnboarding();
      setEntries(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleUpload = async (formData) => {
    await onboardingService.createOnboarding(formData);
    fetchEntries();
  };

  return (
    <div>
      <h2>Onboarding & SOPs</h2>
      <FileUploader onUpload={handleUpload} accept=".pdf,.doc,.docx" label="Upload SOP/Training Document" />
      {loading ? (
        <div>Loading onboarding entries...</div>
      ) : (
        <OnboardingList entries={entries} />
      )}
    </div>
  );
};

export default OnboardingPage;