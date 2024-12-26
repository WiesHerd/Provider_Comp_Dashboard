'use client';

import { useState } from 'react';
import { 
  ChartBarIcon, 
  DocumentChartBarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  CalendarIcon,
  BuildingOfficeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const reports = [
  {
    id: 'performance',
    name: 'Provider Performance Reports',
    description: 'Detailed analysis of provider wRVU performance against targets.',
    types: [
      { id: 'monthly', name: 'Monthly Performance Summary' },
      { id: 'quarterly', name: 'Quarterly Achievement Reports' },
      { id: 'ytd', name: 'Year-to-Date Progress' },
      { id: 'historical', name: 'Historical Trend Analysis' }
    ],
    icon: ChartBarIcon
  },
  {
    id: 'compensation',
    name: 'Compensation Analysis',
    description: 'Compensation calculations and incentive payment tracking.',
    types: [
      { id: 'incentive', name: 'Incentive Payment Calculations' },
      { id: 'distribution', name: 'Compensation Distribution Analysis' },
      { id: 'holdback', name: 'Holdback Balance Reports' },
      { id: 'payment', name: 'Payment History' }
    ],
    icon: DocumentChartBarIcon
  },
  {
    id: 'department',
    name: 'Department Analytics',
    description: 'Department-level performance and comparison metrics.',
    types: [
      { id: 'overview', name: 'Department Performance Overview' },
      { id: 'comparison', name: 'Cross-Department Comparison' },
      { id: 'distribution', name: 'Provider Distribution Analysis' },
      { id: 'trend', name: 'Department Trend Reports' }
    ],
    icon: BuildingOfficeIcon
  },
  {
    id: 'productivity',
    name: 'Productivity Metrics',
    description: 'Detailed productivity analysis and benchmarking.',
    types: [
      { id: 'rankings', name: 'Provider Productivity Rankings' },
      { id: 'fte', name: 'Productivity vs FTE Analysis' },
      { id: 'benchmark', name: 'Specialty Benchmarking' },
      { id: 'efficiency', name: 'Efficiency Metrics' }
    ],
    icon: TableCellsIcon
  },
  {
    id: 'variance',
    name: 'Variance Reports',
    description: 'Analysis of variations from targets and historical patterns.',
    types: [
      { id: 'target', name: 'Target vs Actual Analysis' },
      { id: 'monthly', name: 'Monthly Variance Tracking' },
      { id: 'seasonal', name: 'Seasonal Pattern Analysis' },
      { id: 'exception', name: 'Exception Reports' }
    ],
    icon: UserGroupIcon
  }
];

export default function ReportsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [downloadStatus, setDownloadStatus] = useState<Record<string, boolean>>({});

  const handleDownload = async (reportType: string, subType: string) => {
    const key = `${reportType}-${subType}`;
    setDownloadStatus(prev => ({ ...prev, [key]: true }));
    
    try {
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        department: selectedDepartment,
        subType: subType
      });

      const response = await fetch(`/api/reports/${reportType}?${params}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1].replace(/"/g, '') || 'report.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Report download error:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloadStatus(prev => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-base text-gray-600">
          Generate and download detailed reports and analytics.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="ytd">Year to Date</option>
            <option value="year">Last 12 Months</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Departments</option>
            <option value="cardiology">Cardiology</option>
            <option value="orthopedics">Orthopedics</option>
            <option value="pediatrics">Pediatrics</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <report.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{report.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{report.description}</p>
                
                <div className="mt-4 space-y-3">
                  {report.types.map((type) => {
                    const key = `${report.id}-${type.id}`;
                    const isDownloading = downloadStatus[key];

                    return (
                      <div key={type.id} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{type.name}</span>
                        <button
                          onClick={() => handleDownload(report.id, type.id)}
                          disabled={isDownloading}
                          className={`inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 ${
                            isDownloading
                              ? 'bg-gray-100 cursor-not-allowed'
                              : 'bg-white hover:bg-gray-50'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                        >
                          <ArrowDownTrayIcon className={`h-4 w-4 mr-1 ${isDownloading ? 'text-gray-400' : 'text-gray-500'}`} />
                          {isDownloading ? 'Downloading...' : 'Download'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 