'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { ArrowDownTrayIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CustomTooltip } from '@/components/ui/custom-tooltip';
import { SortIndicator } from '@/components/ui/sort-indicator';
import Link from 'next/link';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Constants
const specialties = [
  'Family Medicine',
  'Internal Medicine',
  'Pediatrics',
  'Cardiology',
  'Orthopedics',
  'Neurology',
];

const dateRanges = [
  'Last 3 Months',
  'Last 6 Months',
  'Year to Date',
  'Last 12 Months',
  'Custom Range',
];

// Helper functions
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercentage = (value: number) => {
  if (value === null || value === undefined || value === 0) return '-';
  return `${value.toFixed(1)}%`;
};

const getPerformanceColor = (value: number) => {
  if (value === 0) return 'text-gray-500';
  if (value < 90) return 'text-red-600';
  if (value <= 110) return 'text-yellow-600';
  return 'text-green-600';
};

const getTrendColor = (value: number) => {
  if (value === 0) return 'text-gray-500';
  if (value < 0) return 'text-red-600';
  return 'text-green-600';
};

const exportToCSV = (data: any[]) => {
  // Implementation for CSV export
  console.log('Exporting data to CSV:', data);
};

const formatFTE = (value: number) => {
  if (value === null || value === undefined || value === 0) return '-';
  return value.toFixed(2);
};

const formatWRVU = (value: number) => {
  if (value === null || value === undefined || value === 0) return '-';
  return value.toFixed(1);
};

const getMonthName = (month: number) => {
  if (month === 0) return 'YTD';
  return new Date(2024, month - 1).toLocaleString('default', { month: 'long' });
};

// Custom hook for report state management
const useReportState = () => {
  const [selectedReport, setSelectedReport] = useState('Monthly Provider Performance Summary');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceRange, setPerformanceRange] = useState('All');
  const [dateRange, setDateRange] = useState('Year to Date');
  const [fteStatus, setFteStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);

  return {
    selectedReport,
    setSelectedReport,
    selectedMonth,
    setSelectedMonth,
    selectedDepartment,
    setSelectedDepartment,
    providers,
    setProviders,
    isLoading,
    setIsLoading,
    error,
    setError,
    performanceRange,
    setPerformanceRange,
    dateRange,
    setDateRange,
    fteStatus,
    setFteStatus,
    searchQuery,
    setSearchQuery,
    sortConfig,
    setSortConfig,
  };
};

// Add summary statistics component
const SummaryStats = ({ providers }: { providers: any[] }) => {
  const stats = useMemo(() => {
    const validProviders = providers.filter(p => p !== null && p !== undefined);
    const totalProviders = validProviders.length;
    
    const validWRVUProviders = validProviders.filter(p => p.wrvuPercentile !== null && p.wrvuPercentile !== undefined);
    const avgWRVUPercentile = validWRVUProviders.length > 0
      ? validWRVUProviders.reduce((sum, p) => sum + (p.wrvuPercentile || 0), 0) / validWRVUProviders.length
      : 0;
    
    const validCompProviders = validProviders.filter(p => p.compPercentile !== null && p.compPercentile !== undefined);
    const avgCompPercentile = validCompProviders.length > 0
      ? validCompProviders.reduce((sum, p) => sum + (p.compPercentile || 0), 0) / validCompProviders.length
      : 0;
    
    const validTargetProviders = validProviders.filter(p => 
      p.actualWRVUs !== null && p.actualWRVUs !== undefined && 
      p.targetWRVUs !== null && p.targetWRVUs !== undefined && 
      p.targetWRVUs > 0
    );
    
    const belowTarget = validTargetProviders.filter(p => (p.actualWRVUs / p.targetWRVUs) * 100 < 90).length;
    const atTarget = validTargetProviders.filter(p => {
      const pct = (p.actualWRVUs / p.targetWRVUs) * 100;
      return pct >= 90 && pct <= 110;
    }).length;
    const aboveTarget = validTargetProviders.filter(p => (p.actualWRVUs / p.targetWRVUs) * 100 > 110).length;

    return {
      totalProviders,
      avgWRVUPercentile,
      avgCompPercentile,
      belowTarget,
      atTarget,
      aboveTarget
    };
  }, [providers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Total Providers</div>
        <div className="mt-1 text-2xl font-semibold">{stats.totalProviders}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Avg wRVU %ile</div>
        <div className="mt-1 text-2xl font-semibold">{formatPercentage(stats.avgWRVUPercentile)}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Avg Comp %ile</div>
        <div className="mt-1 text-2xl font-semibold">{formatPercentage(stats.avgCompPercentile)}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Below Target</div>
        <div className="mt-1 text-2xl font-semibold text-red-600">{stats.belowTarget}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">At Target</div>
        <div className="mt-1 text-2xl font-semibold text-yellow-600">{stats.atTarget}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-sm font-medium text-gray-500">Above Target</div>
        <div className="mt-1 text-2xl font-semibold text-green-600">{stats.aboveTarget}</div>
      </div>
    </div>
  );
};

// Main report component
export default function ReportsPage() {
  const {
    selectedReport,
    setSelectedReport,
    selectedMonth,
    setSelectedMonth,
    selectedDepartment,
    setSelectedDepartment,
    providers,
    setProviders,
    isLoading,
    setIsLoading,
    error,
    setError,
    performanceRange,
    setPerformanceRange,
    dateRange,
    setDateRange,
    fteStatus,
    setFteStatus,
    searchQuery,
    setSearchQuery,
    sortConfig,
    setSortConfig,
  } = useReportState();

  // Fetch providers data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('Fetching data with month:', selectedMonth, 'isYTD:', selectedMonth === 0);
        
        // First, ensure metrics are up to date
        await fetch('/api/metrics/calculate-all', { method: 'POST' });

        // Then fetch the providers with their latest metrics
        const response = await fetch(`/api/providers?refresh=true&month=${selectedMonth === 0 ? 'YTD' : selectedMonth}`);
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }
        const data = await response.json();
        console.log('Received provider data:', data);
        setProviders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setProviders, setIsLoading, setError, selectedMonth]);

  // Filter providers based on selected filters
  const filteredProviders = useMemo(() => {
    return providers.filter(provider => {
      if (!provider) return false;

      // Filter by department/specialty
      if (selectedDepartment !== 'All Departments' && provider.specialty !== selectedDepartment) {
        return false;
      }

      // Filter by performance range
      if (provider.actualWRVUs !== null && provider.actualWRVUs !== undefined &&
          provider.targetWRVUs !== null && provider.targetWRVUs !== undefined &&
          provider.targetWRVUs > 0) {
        const percentOfTarget = (provider.actualWRVUs / provider.targetWRVUs) * 100;
        if (performanceRange === 'Below Target' && percentOfTarget >= 90) {
          return false;
        }
        if (performanceRange === 'Near Target' && (percentOfTarget < 90 || percentOfTarget > 110)) {
          return false;
        }
        if (performanceRange === 'Above Target' && percentOfTarget <= 110) {
          return false;
        }
      } else if (performanceRange !== 'All') {
        return false;
      }

      // Filter by FTE status
      if (provider.clinicalFte !== null && provider.clinicalFte !== undefined) {
        if (fteStatus === 'Full Time (≥0.8 FTE)' && provider.clinicalFte < 0.8) {
          return false;
        }
        if (fteStatus === 'Part Time (<0.8 FTE)' && provider.clinicalFte >= 0.8) {
          return false;
        }
      } else if (fteStatus !== 'All') {
        return false;
      }

      const searchLower = searchQuery.toLowerCase();
      return (
        provider.firstName.toLowerCase().includes(searchLower) ||
        provider.lastName.toLowerCase().includes(searchLower) ||
        provider.specialty.toLowerCase().includes(searchLower) ||
        provider.department.toLowerCase().includes(searchLower)
      );
    });
  }, [providers, selectedDepartment, performanceRange, fteStatus, searchQuery]);

  // Sort providers
  const sortedProviders = useMemo(() => {
    if (!sortConfig) {
      return filteredProviders;
    }

    return [...filteredProviders].sort((a, b) => {
      if (sortConfig.key === 'provider') {
        const aName = `${a.firstName} ${a.lastName}`;
        const bName = `${b.firstName} ${b.lastName}`;
        return sortConfig.direction === 'ascending'
          ? aName.localeCompare(bName)
          : bName.localeCompare(aName);
      }

      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending'
          ? aValue - bValue
          : bValue - aValue;
      }

      return sortConfig.direction === 'ascending'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  }, [filteredProviders, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
      if (!prevConfig || prevConfig.key !== key) {
        return { key, direction: 'ascending' };
      }
      if (prevConfig.direction === 'ascending') {
        return { key, direction: 'descending' };
      }
      return null;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">Monthly Provider Performance Summary</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button variant="outline" className="gap-2">
              <ArrowLeftIcon className="h-4 w-4" />
              Reports
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={() => exportToCSV(providers)}>
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger>
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Departments">All Departments</SelectItem>
            {specialties.map(specialty => (
              <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
          <SelectTrigger>
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">YTD</SelectItem>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {new Date(2024, month - 1).toLocaleString('default', { month: 'long' })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={performanceRange} onValueChange={setPerformanceRange}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Below Target">Below Target (&lt;90%)</SelectItem>
            <SelectItem value="Near Target">Near Target (90-110%)</SelectItem>
            <SelectItem value="Above Target">Above Target (&gt;110%)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={fteStatus} onValueChange={setFteStatus}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Full Time (≥0.8 FTE)">Full Time (≥0.8 FTE)</SelectItem>
            <SelectItem value="Part Time (<0.8 FTE)">Part Time (&lt;0.8 FTE)</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <SummaryStats providers={filteredProviders} />

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('provider')}>
                  <div className="flex items-center gap-2">
                    Provider
                    <SortIndicator column="provider" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('specialty')}>
                  <div className="flex items-center gap-2">
                    Specialty
                    <SortIndicator column="specialty" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('clinicalFte')}>
                  <div className="flex items-center gap-2">
                    Clinical FTE
                    <SortIndicator column="clinicalFte" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('actualWRVUs')}>
                  <div className="flex items-center gap-2">
                    {getMonthName(selectedMonth)} Actual wRVUs
                    <SortIndicator column="actualWRVUs" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('targetWRVUs')}>
                  <div className="flex items-center gap-2">
                    {getMonthName(selectedMonth)} Target wRVUs
                    <SortIndicator column="targetWRVUs" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('percentOfTarget')}>
                  <div className="flex items-center gap-2">
                    {getMonthName(selectedMonth)} % of Target
                    <SortIndicator column="percentOfTarget" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('ytdProgress')}>
                  <div className="flex items-center gap-2">
                    YTD Progress
                    <SortIndicator column="ytdProgress" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('wrvuPercentile')}>
                  <div className="flex items-center gap-2">
                    <CustomTooltip content="Percentile ranking based on wRVU production compared to national benchmarks">
                      wRVU %ile
                    </CustomTooltip>
                    <SortIndicator column="wrvuPercentile" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('baseSalary')}>
                  <div className="flex items-center gap-2">
                    Base Salary
                    <SortIndicator column="baseSalary" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('totalCompensation')}>
                  <div className="flex items-center gap-2">
                    Total Comp
                    <SortIndicator column="totalCompensation" sortConfig={sortConfig} />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('compPercentile')}>
                  <div className="flex items-center gap-2">
                    <CustomTooltip content="Percentile ranking based on total compensation compared to national benchmarks">
                      Comp %ile
                    </CustomTooltip>
                    <SortIndicator column="compPercentile" sortConfig={sortConfig} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProviders.map((provider, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link
                      href={`/provider/${provider.employeeId}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {provider.firstName} {provider.lastName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {provider.specialty}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatFTE(provider.clinicalFte)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatWRVU(provider.actualWRVUs)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatWRVU(provider.targetWRVUs)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {provider.targetWRVUs ? `${((provider.actualWRVUs / provider.targetWRVUs) * 100).toFixed(1)}%` : '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${getPerformanceColor(provider.ytdProgress)}`}>
                    {formatPercentage(provider.ytdProgress)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPercentage(provider.wrvuPercentile)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(provider.baseSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(provider.totalCompensation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPercentage(provider.compPercentile)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 