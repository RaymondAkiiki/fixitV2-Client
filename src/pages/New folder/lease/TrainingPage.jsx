import React, { useEffect, useState } from "react";
import * as onboardingService from "../../services/onboardingService";

const TrainingPage = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onboardingService.getOnboarding().then(res => {
      setDocs(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h2>Training Materials</h2>
      {loading ? (
        <div>Loading training materials...</div>
      ) : docs.length ? (
        <ul>
          {docs.map(doc => (
            <li key={doc._id} style={{ marginBottom: 20 }}>
              <strong>{doc.title}</strong>
              {doc.description && <div>{doc.description}</div>}
              {doc.fileUrl && (
                <div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    View Document
                  </a>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div>No training materials found.</div>
      )}
    </div>
  );
};

export default TrainingPage;