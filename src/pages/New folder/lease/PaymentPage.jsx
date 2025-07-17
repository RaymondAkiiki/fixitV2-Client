import React from "react";
import { useRent } from "../../contexts/RentContext";
import PaymentCard from "../../components/PaymentCard";

const PaymentPage = () => {
  const { rents, loading, error, refresh } = useRent();

  return (
    <div>
      <h2>Payment Ledger</h2>
      <button onClick={refresh} style={{ marginBottom: 12 }}>Refresh</button>
      {loading ? (
        <div>Loading payments...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : rents.length ? (
        rents.map(rent => <PaymentCard key={rent._id} rent={rent} />)
      ) : (
        <div>No Payment records found.</div>
      )}
    </div>
  );
};

export default PaymentPage;