// src/components/common/StatusBadge.jsx
import React from "react";

const getColor = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Resolved":
      return "bg-green-100 text-green-800";
    case "Failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getColor(status)}`}>
    {status}
  </span>
);

export default StatusBadge;
