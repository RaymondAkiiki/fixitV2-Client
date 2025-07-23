// src/components/PropertyList.jsx
import React, { useState } from 'react';
import { useProperties, usePropertyMutations } from '../hooks/useProperties';
import Spinner from '../components/common/Spinner';

const TPropertyList = () => {
  const [filters, setFilters] = useState({});
  const { data, isLoading, error } = useProperties({ filters });
  const { deleteProperty } = usePropertyMutations();

  if (isLoading) return <Spinner />;
  if (error) return <div>Error loading properties: {error.message}</div>;

  const { properties } = data || { properties: [] };

  return (
    <div>
      <h1>Properties</h1>
      <ul>
        {properties.map(property => (
          <li key={property._id}>
            {property.name}
            <button onClick={() => deleteProperty(property._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TPropertyList;