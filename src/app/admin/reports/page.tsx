'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  BuildingOfficeIcon,
  EyeIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCcw } from 'lucide-react';
import MonthlyPerformanceTable from '@/components/Reports/MonthlyPerformanceTable';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { months, specialties } from "@/lib/data";

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("This Month");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performanceRange, setPerformanceRange] = useState("All");

  const performanceRanges = [
    "All",
    "Below Target (<90%)",
    "Near Target (90-110%)",
    "Above Target (>110%)"
  ];

  const getPerformanceCategory = (percentOfTarget: number) => {
    if (percentOfTarget < 90) return "Below Target";
    if (percentOfTarget <= 110) return "Near Target";
    return "Above Target";
  };

  const filteredProviders = providers.filter(provider => {
    if (performanceRange === "All") return true;
    return provider.performanceCategory === performanceRange.split(" (")[0];
  });

  const reportOptions = [
    {
      id: 'monthly-performance',
      name: 'Monthly Provider Performance Summary',
      description: 'Comprehensive view of provider performance metrics for the current month',
      icon: ChartBarIcon,
    },
    {
      id: 'productivity-trends',
      name: 'Productivity Trends Report',
      description: 'Historical trends and patterns in provider productivity',
      icon: DocumentChartBarIcon,
    },
    {
      id: 'compensation-analysis',
      name: 'Compensation Analysis Report',
      description: 'Detailed analysis of provider compensation and benchmarks',
      icon: TableCellsIcon,
    },
    {
      id: 'department-summary',
      name: 'Department Summary Report',
      description: 'Performance metrics aggregated by department',
      icon: BuildingOfficeIcon,
    }
  ];

  // Only fetch data if a report is selected
  useEffect(() => {
    if (selectedReport === 'monthly-performance') {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [providersRes, marketDataRes] = await Promise.all([
            fetch('/api/providers?period=month&specialty=' + encodeURIComponent(selectedDepartment)),
            fetch('/api/market-data')
          ]);
          
          if (!providersRes.ok) throw new Error(`Failed to fetch providers: ${providersRes.statusText}`);
          if (!marketDataRes.ok) throw new Error(`Failed to fetch market data: ${marketDataRes.statusText}`);

          const providersData = await providersRes.json();
          const marketData = await marketDataRes.json();

          if (!Array.isArray(providersData)) throw new Error('Invalid providers data format');
          if (!Array.isArray(marketData)) throw new Error('Invalid market data format');

          const enhancedProviders = providersData.map((provider: any) => {
            const marketBenchmarks = marketData.find((m: any) => m.specialty === provider.specialty);
            return {
              ...provider,
              marketBenchmarks,
              performanceCategory: getPerformanceCategory(provider.actualWRVUs / provider.targetWRVUs * 100)
            };
          });

          setProviders(enhancedProviders);
        } catch (error) {
          console.error('Error fetching data:', error);
          setError(error instanceof Error ? error.message : 'An error occurred while fetching data');
          setProviders([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [selectedReport, selectedMonth, selectedDepartment]);

  // Reports landing page
  if (!selectedReport) {
    return (
      <>
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-gray-600 mt-1">Select a report type to view detailed analytics</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 mt-8">
          {reportOptions.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className="relative group bg-white p-6 focus:ring-2 focus:ring-inset focus:ring-indigo-500 rounded-lg shadow hover:shadow-md transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <report.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {report.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {report.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <EyeIcon className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </>
    );
  }

  // Monthly Performance Report View
  if (selectedReport === 'monthly-performance') {
    return (
      <>
        <div className="mb-8">
          <button
            onClick={() => setSelectedReport(null)}
            className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Reports
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Monthly Provider Performance Summary</h1>
          <p className="text-gray-600">Comprehensive view of provider performance metrics for the current month</p>
        </div>

        <div className="flex gap-4 mb-6">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue>{selectedMonth}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white">
              {months.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue>{selectedDepartment}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="All Departments">All Departments</SelectItem>
              {specialties.map(specialty => (
                <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={performanceRange} onValueChange={setPerformanceRange}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue>{performanceRange}</SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white">
              {performanceRanges.map(range => (
                <SelectItem key={range} value={range}>{range}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="ml-auto" onClick={() => exportToCSV(filteredProviders)}>
            Export CSV
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              {error}
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No providers found
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clinical FTE</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actual wRVUs</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Target wRVUs</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Target</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">MoM Trend</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">YTD Progress</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">wRVU %ile</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Base Salary</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Comp</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comp %ile</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProviders.map((provider: any) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`/provider/${provider.id}`} className="text-blue-600 hover:text-blue-800">
                        {provider.providerName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{provider.specialty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{provider.clinicalFte.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{provider.actualWRVUs.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{provider.targetWRVUs.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right ${getPerformanceColor(provider.actualWRVUs / provider.targetWRVUs * 100)}`}>
                      {((provider.actualWRVUs / provider.targetWRVUs) * 100).toFixed(1)}%
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right ${getTrendColor(provider.momTrend)}`}>
                      {provider.momTrend > 0 ? '↑' : '↓'} {Math.abs(provider.momTrend).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{provider.ytdProgress.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{provider.wrvuPercentile.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">${formatCurrency(provider.baseSalary)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">${formatCurrency(provider.totalCompensation)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">{provider.compPercentile.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  }

  // Placeholder for other report types
  return (
    <>
      <div className="mb-8">
        <button
          onClick={() => setSelectedReport(null)}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Reports
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">
          {reportOptions.find(r => r.id === selectedReport)?.name}
        </h1>
        <p className="text-gray-600">
          This report is under development. Please check back later.
        </p>
      </div>
    </>
  );
}

const getPerformanceColor = (percentOfTarget: number) => {
  if (percentOfTarget < 90) return "text-red-600";
  if (percentOfTarget <= 110) return "text-green-600";
  return "text-blue-600";
};

const getTrendColor = (trend: number) => {
  if (trend < 0) return "text-red-600";
  return "text-green-600";
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const exportToCSV = (providers: any[]) => {
  const headers = [
    'Provider',
    'Specialty',
    'Clinical FTE',
    'Actual wRVUs',
    'Target wRVUs',
    '% of Target',
    'MoM Trend',
    'YTD Progress',
    'wRVU %ile',
    'Base Salary',
    'Total Comp',
    'Comp %ile'
  ].join(',');

  const rows = providers.map(provider => [
    provider.providerName,
    provider.specialty,
    provider.clinicalFte.toFixed(2),
    provider.actualWRVUs.toFixed(2),
    provider.targetWRVUs.toFixed(2),
    ((provider.actualWRVUs / provider.targetWRVUs) * 100).toFixed(1),
    `${provider.momTrend > 0 ? '+' : ''}${provider.momTrend.toFixed(1)}`,
    provider.ytdProgress.toFixed(1),
    provider.wrvuPercentile.toFixed(1),
    provider.baseSalary.toFixed(2),
    provider.totalCompensation.toFixed(2),
    provider.compPercentile.toFixed(1)
  ].map(value => `"${value}"`).join(','));

  const csvContent = `${headers}\n${rows.join('\n')}`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'provider_performance.csv';
  link.click();
}; 