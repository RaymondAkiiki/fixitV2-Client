import React from 'react';

const StatCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center">
      {Icon && (
        <div className="mb-2 text-3xl" style={{ color: color }}>
          <Icon size={32} strokeWidth={2.5} />
        </div>
      )}
      <p className="text-gray-600 font-medium text-sm">{title}</p>
      <p className="text-3xl font-bold" style={{ color: color }}>{value}</p>
    </div>
  );
};

export default StatCard;