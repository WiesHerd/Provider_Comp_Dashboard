'use client';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams, CellClassParams } from 'ag-grid-community';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, FilterIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderMetrics } from '../types';
import { useState } from 'react';

interface MonthlyPerformanceReportProps {
  metrics: ProviderMetrics[];
  selectedSpecialty: string;
  setSelectedSpecialty: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedPerformance: string;
  setSelectedPerformance: (value: string) => void;
  handleExportCSV: (data: ProviderMetrics[], columnDefs: ColDef<ProviderMetrics>[], filename: string) => void;
}

export const monthlyPerformanceColumnDefs: ColDef<ProviderMetrics>[] = [
  { 
    field: 'providerName', 
    headerName: 'Provider',
    width: 180,
    pinned: 'left',
    filter: 'agTextColumnFilter'
  },
  { 
    field: 'specialty', 
    headerName: 'Specialty',
    width: 150,
    filter: 'agTextColumnFilter'
  },
  { 
    field: 'clinicalFte', 
    headerName: 'Clinical FTE',
    width: 120,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value?.toFixed(2) || '0.00'
  },
  { 
    field: 'rawMonthlyWRVUs', 
    headerName: 'Monthly wRVUs',
    width: 130,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value?.toFixed(2) || '0.00'
  },
  { 
    field: 'cumulativeWRVUs', 
    headerName: 'YTD wRVUs',
    width: 130,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value?.toFixed(2) || '0.00'
  },
  { 
    field: 'targetWRVUs', 
    headerName: 'Base Target',
    width: 130,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value?.toFixed(2) || '0.00'
  },
  { 
    field: 'cumulativeTarget', 
    headerName: 'YTD Target (Adj)',
    width: 140,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value?.toFixed(2) || '0.00'
  },
  { 
    field: 'planProgress',
    headerName: '% of Target',
    width: 120,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => `${params.value?.toFixed(1)}%` || '0.0%',
    cellStyle: (params: CellClassParams<ProviderMetrics, number>) => {
      const percentage = params.value || 0;
      return {
        backgroundColor: percentage >= 100 ? '#dcfce7' : 
                      percentage >= 90 ? '#fef9c3' : '#fee2e2',
        color: percentage >= 100 ? '#166534' : 
               percentage >= 90 ? '#854d0e' : '#991b1b'
      };
    }
  },
  { 
    field: 'wrvuPercentile', 
    headerName: 'wRVU %ile',
    width: 120,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => `${params.value?.toFixed(1)}%` || '0.0%'
  },
  { 
    field: 'baseSalary', 
    headerName: 'Base Salary',
    width: 140,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value ? 
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(params.value) : '$0.00'
  },
  { 
    field: 'incentivesEarned', 
    headerName: 'Incentives',
    width: 140,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value ? 
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(params.value) : '$0.00'
  },
  { 
    field: 'holdbackAmount', 
    headerName: 'Holdback',
    width: 140,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value ? 
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(params.value) : '$0.00'
  },
  { 
    field: 'totalCompensation', 
    headerName: 'Total Comp',
    width: 140,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value ? 
      new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(params.value) : '$0.00'
  },
  { 
    field: 'compPercentile', 
    headerName: 'TCC %ile',
    width: 120,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => `${params.value?.toFixed(1)}%` || '0.0%'
  },
  { 
    field: 'ytdProgress', 
    headerName: 'YTD Progress',
    width: 130,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => `${params.value?.toFixed(1)}%` || '0.0%'
  },
  { 
    field: 'ytdTargetProgress', 
    headerName: 'YTD Target',
    width: 130,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => `${params.value?.toFixed(1)}%` || '0.0%'
  },
  { 
    field: 'incentivePercentage', 
    headerName: 'Incentive %',
    width: 120,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => `${params.value?.toFixed(1)}%` || '0.0%'
  },
  { 
    field: 'clinicalUtilization', 
    headerName: 'Clinical Util',
    width: 120,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => `${params.value?.toFixed(1)}%` || '0.0%'
  }
];

export default function MonthlyPerformanceReport({
  metrics,
  selectedSpecialty,
  setSelectedSpecialty,
  selectedStatus,
  setSelectedStatus,
  selectedPerformance,
  setSelectedPerformance,
  handleExportCSV
}: MonthlyPerformanceReportProps) {
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true);
  const [isMainFiltersExpanded, setIsMainFiltersExpanded] = useState(true);

  const filterData = (data: ProviderMetrics[]) => {
    return data.filter(item => {
      const matchesSpecialty = selectedSpecialty === 'all' || item.specialty === selectedSpecialty;
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'above' && item.planProgress >= 100) ||
        (selectedStatus === 'below' && item.planProgress < 100);
      const matchesPerformance = selectedPerformance === 'all' ||
        (selectedPerformance === 'high' && item.wrvuPercentile >= 75) ||
        (selectedPerformance === 'medium' && item.wrvuPercentile >= 25 && item.wrvuPercentile < 75) ||
        (selectedPerformance === 'low' && item.wrvuPercentile < 25);

      return matchesSpecialty && matchesStatus && matchesPerformance;
    });
  };

  const getSpecialties = () => {
    const specialties = new Set(metrics.map(item => item.specialty));
    return Array.from(specialties).sort();
  };

  const filteredData = filterData(metrics);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-4">
          <div>
            <CardTitle>Monthly Provider Performance Summary</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive view of provider performance metrics for the current month
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
            className="p-1 hover:bg-gray-100"
          >
            <FilterIcon className="h-4 w-4 mr-2" />
            {isFiltersExpanded ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Button 
          variant="outline" 
          onClick={() => handleExportCSV(filteredData, monthlyPerformanceColumnDefs, 'provider_performance.csv')}
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>

      {/* Filters */}
      {isFiltersExpanded && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {getSpecialties().map(specialty => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="January" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="jan">January</SelectItem>
                <SelectItem value="feb">February</SelectItem>
                {/* Add other months */}
              </SelectContent>
            </Select>

            <Select value={selectedPerformance} onValueChange={setSelectedPerformance}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="high">High Performers</SelectItem>
                <SelectItem value="medium">Medium Performers</SelectItem>
                <SelectItem value="low">Low Performers</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPerformance} onValueChange={setSelectedPerformance}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <input
                type="text"
                placeholder="Search providers..."
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6 border-t border-gray-200">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Total Providers</div>
          <div className="mt-1 text-2xl font-semibold">{metrics.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Avg wRVU %ile</div>
          <div className="mt-1 text-2xl font-semibold">
            {(metrics.reduce((sum, m) => sum + (m.wrvuPercentile || 0), 0) / metrics.length).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Avg Comp %ile</div>
          <div className="mt-1 text-2xl font-semibold">
            {(metrics.reduce((sum, m) => sum + (m.compPercentile || 0), 0) / metrics.length).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Below Target</div>
          <div className="mt-1 text-2xl font-semibold text-red-600">
            {metrics.filter(m => m.planProgress < 90).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">At Target</div>
          <div className="mt-1 text-2xl font-semibold text-yellow-600">
            {metrics.filter(m => m.planProgress >= 90 && m.planProgress <= 110).length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm font-medium text-gray-500">Above Target</div>
          <div className="mt-1 text-2xl font-semibold text-green-600">
            {metrics.filter(m => m.planProgress > 110).length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ag-theme-alpine" style={{ height: 'auto', minHeight: '500px' }}>
        <AgGridReact
          rowData={filteredData}
          columnDefs={monthlyPerformanceColumnDefs}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true
          }}
        />
      </div>
    </Card>
  );
} 