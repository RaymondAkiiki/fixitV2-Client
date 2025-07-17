import React from "react";
import { useLease } from "../../contexts/LeaseContext";
import LeaseCard from "../../components/LeaseCard";

const LeasePage = () => {
  const { leases, loading, error, refresh } = useLease();

  return (
    <div>
      <h2>Leases</h2>
      <button onClick={refresh} style={{ marginBottom: 12 }}>Refresh</button>
      {loading ? (
        <div>Loading leases...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : leases.length ? (
        leases.map(lease => <LeaseCard key={lease._id} lease={lease} />)
      ) : (
        <div>No leases found.</div>
      )}
    </div>
  );
};

export default LeasePage;