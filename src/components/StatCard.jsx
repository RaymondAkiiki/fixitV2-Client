import React from 'react';

const StatCard = ({ title, value, icon: Icon, color }) => {
  // The 'icon' prop is renamed to 'Icon' with a capital letter
  // so that JSX can recognize it as a component.

  return (
    <div
      className="bg-white p-5 rounded-xl shadow-sm flex items-center"
      style={{ borderLeft: `5px solid ${color || '#ddd'}` }}
    >
      <div
        className="p-3 rounded-full flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }} // e.g., #21937720 for semi-transparent
      >
        {/* Render the Icon component if it exists */}
        {Icon && <Icon className="w-7 h-7" style={{ color: color }} />}
      </div>
      <div className="ml-4">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;