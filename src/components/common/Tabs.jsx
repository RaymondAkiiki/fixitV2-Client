import React from 'react';

const TabItem = ({ label, isActive, onClick }) => (
  <button
    className={`px-5 py-2 text-lg font-medium rounded-t-lg transition-colors duration-200 ${
      isActive ? 'bg-white text-green-700 border-b-2 border-green-700' : 'text-gray-600 hover:text-gray-800'
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

const Tabs = ({ tabs, activeTab, setActiveTab }) => (
  <div className="flex border-b border-gray-200 mb-4">
    {tabs.map((tab) => (
      <TabItem
        key={tab.name}
        label={tab.label || tab.name}
        isActive={activeTab === tab.name}
        onClick={() => setActiveTab(tab.name)}
      />
    ))}
  </div>
);

export { TabItem, Tabs };