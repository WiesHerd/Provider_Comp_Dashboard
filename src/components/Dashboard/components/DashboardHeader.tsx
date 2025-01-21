'use client';

import React from 'react';
import { CurrencyDollarIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatters';

interface DashboardHeaderProps {
  provider: {
    firstName: string;
    lastName: string;
    specialty: string;
    employeeId: string;
    fte: number;
    annualSalary: number;
    suffix?: string;
  };
  activeView: string;
  onViewChange: (view: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  provider, 
  activeView, 
  onViewChange 
}) => {
  return (
    <>
      <div className="dashboard-header bg-gray-200 p-6 mb-8">
        <div className="flex justify-between items-start">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              {provider.firstName} {provider.lastName}, {provider.suffix || 'MD'} 
              <span className="text-gray-600">- Specialty: {provider.specialty}</span>
            </h1>
            <div className="text-gray-600 mb-3">
              Provider Compensation Dashboard
            </div>
            <div className="text-gray-600 text-sm">
              Employee ID: {provider.employeeId} 
              <span className="mx-3">•</span> 
              FTE: {provider.fte || 1.0}
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex justify-center -mb-px" aria-label="Tabs">
          <button
            onClick={() => onViewChange('compensation')}
            className={`
              inline-flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm
              ${activeView === 'compensation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              transition-colors duration-200
            `}
          >
            <CurrencyDollarIcon className="h-5 w-5" />
            wRVUs & Comp
          </button>
          <button
            onClick={() => onViewChange('analytics')}
            className={`
              inline-flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm
              ${activeView === 'analytics'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <ChartBarIcon className="h-5 w-5" />
            Charts & Stats
          </button>
          <button
            onClick={() => onViewChange('control')}
            className={`
              ${activeView === 'control'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex items-center px-3 py-2 text-sm font-medium border-b-2
            `}
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Control Panel
          </button>
        </nav>
      </div>
    </>
  );
};

export default DashboardHeader; 