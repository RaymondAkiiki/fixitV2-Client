import React from 'react';

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <div className="flex flex-col items-center">
        {icon && <div className="mb-2 text-3xl text-[#219377]">{icon}</div>}
        <p className="text-gray-600 font-medium">{title}</p>
        <p className="text-2xl font-bold text-[#219377]">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;