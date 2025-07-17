import React from "react";
import { useProperty } from "../../contexts/PropertyContext";
import PropertyCard from "../../components/PropertyCard";

const PropertyPage = () => {
  const { properties, loading, error, refresh } = useProperty();

  return (
    <div>
      <h2>Properties</h2>
      <button onClick={refresh} style={{ marginBottom: 12 }}>Refresh</button>
      {loading ? (
        <div>Loading properties...</div>
      ) : error ? (
        <div style={{ color: "red" }}>{error}</div>
      ) : properties.length ? (
        properties.map(property => <PropertyCard key={property._id} property={property} />)
      ) : (
        <div>No properties found.</div>
      )}
    </div>
  );
};

export default PropertyPage;