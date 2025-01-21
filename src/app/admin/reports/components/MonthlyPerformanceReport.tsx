'use client';

import { AgGridReact } from 'ag-grid-react';
import { ColDef, ValueFormatterParams, CellClassParams } from 'ag-grid-community';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DownloadIcon, FilterIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProviderMetrics } from '../types';

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
    field: 'ytdWRVUs', 
    headerName: 'YTD wRVUs',
    width: 130,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value?.toFixed(2) || '0.00'
  },
  { 
    field: 'actualWRVUs', 
    headerName: 'Annualized wRVUs',
    width: 150,
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams<ProviderMetrics, number>) => params.value?.toFixed(2) || '0.00'
  },
  { 
    field: 'targetWRVUs', 
    headerName: 'Target wRVUs',
    width: 130,
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
        <div>
          <CardTitle>Monthly Provider Performance Summary</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive view of provider performance metrics for the current month
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FilterIcon className="h-4 w-4 text-gray-500" />
            <Select
              value={selectedSpecialty}
              onValueChange={setSelectedSpecialty}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {getSpecialties().map(specialty => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="above">Above Target</SelectItem>
                <SelectItem value="below">Below Target</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={selectedPerformance}
              onValueChange={setSelectedPerformance}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="high">High Performers (≥75%)</SelectItem>
                <SelectItem value="medium">Mid Performers (25-75%)</SelectItem>
                <SelectItem value="low">Low Performers (<25%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            onClick={() => handleExportCSV(filteredData, monthlyPerformanceColumnDefs, 'monthly_performance.csv')}
          >
            <DownloadIcon className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="ag-theme-alpine w-full" style={{ height: 'calc(100vh - 300px)' }}>
          <AgGridReact
            rowData={filteredData}
            columnDefs={monthlyPerformanceColumnDefs}
            defaultColDef={{
              sortable: true,
              filter: true,
              resizable: true,
              floatingFilter: true
            }}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
          />
        </div>
      </CardContent>
    </Card>
  );
} 