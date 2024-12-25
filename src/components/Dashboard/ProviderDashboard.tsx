'use client';

import React, { useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { cn } from '@/lib/utils';

interface ProviderDashboardProps {
  provider: {
    firstName: string;
    lastName: string;
    suffix?: string;
    specialty: string;
    employeeId: string;
    conversionFactor: number;
  };
  fte: number;
  annualSalary: number;
  ytdWRVUs: number;
  totalIncentives: number;
  holdback: number;
  rowData: any[];
  columnDefs: any[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  provider,
  fte,
  annualSalary,
  ytdWRVUs,
  totalIncentives,
  holdback,
  rowData,
  columnDefs
}) => {
  const [activeView, setActiveView] = useState('wrvus');
  const [showWrvuModal, setShowWrvuModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const gridRef = useRef<AgGridReact>(null);

  const defaultColDef = {
    resizable: true,
    sortable: false,
    suppressMenu: true,
    flex: 1,
    minWidth: 100
  };

  const getRowClass = (params: any) => {
    if (params.node.rowIndex === 0) return 'font-semibold bg-slate-50/80';
    if (params.node.rowIndex === 3) return 'font-semibold bg-slate-50/80 border-t border-slate-200';
    return '';
  };

  const onGridReady = (params: any) => {
    params.api.sizeColumnsToFit();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Provider Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">{provider.firstName} {provider.lastName}, {provider.suffix || 'MD'}</h1>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="font-medium">{provider.specialty}</span>
              <span className="text-slate-300">•</span>
              <span>ID: <span className="font-medium">{provider.employeeId}</span></span>
              <span className="text-slate-300">•</span>
              <span>FTE: <span className="font-medium">{fte.toFixed(2)}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Base Salary</h3>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(annualSalary)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-indigo-50 rounded-lg">
                <svg className="w-5 h-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-600">YTD wRVUs</h3>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{ytdWRVUs.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-green-50 rounded-lg">
                <svg className="w-5 h-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1.555.832l-3-2a1 1 0 00-1.109 0l-3 2A1 1 0 016 16V4zm6 12.332l3 2V4a2 2 0 00-2-2H7a2 2 0 00-2 2v12.332l3-2a1 1 0 011.109 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Conversion Factor</h3>
            </div>
            <p className="text-2xl font-semibold text-slate-900">${provider.conversionFactor}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-50 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L10 9.586 7.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Incentives Earned</h3>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalIncentives)}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-pink-50 rounded-lg">
                <svg className="w-5 h-5 text-pink-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-slate-600">Holdback</h3>
            </div>
            <p className="text-2xl font-semibold text-slate-900">{formatCurrency(Math.abs(holdback))}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-[1400px] mx-auto px-6">
        <nav className="flex space-x-8 border-b border-slate-200" aria-label="Tabs">
          <button
            className={cn(
              "border-b-2 py-4 px-1 text-sm font-medium transition-colors",
              activeView === "wrvus" 
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            )}
            onClick={() => setActiveView("wrvus")}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              wRVUs & Compensation
            </div>
          </button>
          <button
            className={cn(
              "border-b-2 py-4 px-1 text-sm font-medium transition-colors",
              activeView === "analytics"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            )}
            onClick={() => setActiveView("analytics")}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Analytics & Charts
            </div>
          </button>
          <button
            className={cn(
              "border-b-2 py-4 px-1 text-sm font-medium transition-colors",
              activeView === "settings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
            )}
            onClick={() => setActiveView("settings")}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Settings & Controls
            </div>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {activeView === "wrvus" && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-semibold text-slate-900">Metrics & Adjustments</h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowWrvuModal(true)}
                    className="inline-flex items-center px-4 py-2.5 border border-blue-100 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add wRVU Adjustment
                  </button>
                  <button
                    onClick={() => setShowTargetModal(true)}
                    className="inline-flex items-center px-4 py-2.5 border border-emerald-100 text-sm font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Target Adjustment
                  </button>
                </div>
              </div>

              <div className="ag-theme-alpine h-[600px] w-full border border-slate-200 rounded-lg overflow-hidden">
                <AgGridReact
                  ref={gridRef}
                  rowData={rowData}
                  columnDefs={columnDefs}
                  defaultColDef={{
                    ...defaultColDef,
                    cellClass: 'text-slate-900 text-sm',
                    headerClass: 'text-slate-600 text-sm font-medium bg-slate-50/80'
                  }}
                  animateRows={true}
                  rowHeight={52}
                  headerHeight={48}
                  suppressMovableColumns={true}
                  suppressColumnVirtualisation={true}
                  suppressRowVirtualisation={true}
                  getRowClass={getRowClass}
                  onGridReady={onGridReady}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
