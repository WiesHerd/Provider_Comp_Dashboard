import React from 'react';

const ProviderNav: React.FC = () => {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo/Brand */}
            <div className="text-xl font-semibold text-gray-800">
              Work RVU Dashboard
            </div>
          </div>
          
          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Overview
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Reports
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Settings
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ProviderNav; 