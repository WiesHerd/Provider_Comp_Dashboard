'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Users, TrendingUp, Target, DollarSign, Activity, ChevronDown, Filter, X } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from "../../../../components/ui/switch";
import { DualRangeSlider } from "../../../../components/ui/dual-range-slider";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import * as XLSX from 'xlsx';
import Pagination from '@/components/common/Pagination';
import { Badge } from "@/components/ui/badge";

interface FilterState {
  month: number;
  specialty: string;
  department: string;
  status: string;
  searchQuery: string;
  compModel: string;
  wrvuPercentileMin: string;
  wrvuPercentileMax: string;
  compPercentileMin: string;
  compPercentileMax: string;
  planProgressMin: string;
  planProgressMax: string;
  missingBenchmarks: boolean;
  missingWRVUs: boolean;
  nonClinicalOnly: boolean;
  inactiveOnly: boolean;
  fteRange: [number, number];
  baseSalaryRange: [number, number];
}

// Remove years array and just keep months
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyPerformanceReport() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>({
    month: new Date().getMonth() + 1,
    specialty: 'all',
    department: 'all',
    status: 'Active',
    searchQuery: '',
    compModel: 'Select All',
    wrvuPercentileMin: '',
    wrvuPercentileMax: '',
    compPercentileMin: '',
    compPercentileMax: '',
    planProgressMin: '',
    planProgressMax: '',
    missingBenchmarks: false,
    missingWRVUs: false,
    nonClinicalOnly: false,
    inactiveOnly: false,
    fteRange: [0, 1.0],
    baseSalaryRange: [0, 2000000]
  });

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [compModels, setCompModels] = useState<string[]>(['Select All']);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const router = useRouter();

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.specialty !== 'all') count++;
    if (filters.department !== 'all') count++;
    if (filters.fteRange[0] !== 0 || filters.fteRange[1] !== 1.0) count++;
    if (filters.baseSalaryRange[0] !== 0 || filters.baseSalaryRange[1] !== 2000000) count++;
    if (filters.month !== new Date().getMonth() + 1) count++;
    if (filters.missingBenchmarks) count++;
    if (filters.missingWRVUs) count++;
    if (filters.nonClinicalOnly) count++;
    if (filters.inactiveOnly) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Fetch specialties, departments, and comp models for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/providers/filter-options');
        const data = await response.json();
        setSpecialties(data.specialties);
        setDepartments(data.departments);
        // Add 'Select All' to the beginning of the comp models array
        setCompModels(['Select All', ...data.compModels]);
      } catch (error) {
        console.error('Error fetching filter options:', error);
        toast({
          title: "Error",
          description: "Failed to fetch filter options. Please try again.",
          variant: "destructive"
        });
      }
    };
    fetchFilterOptions();
  }, []);

  // Filter and fetch data function
  const filterData = (data: any[]) => {
    console.log('Starting filtering with:', { filters, dataLength: data.length });
    
    const filtered = data.filter((provider) => {
      // Search filter - case insensitive search on provider name
      const searchMatch = !filters.searchQuery || 
        provider.name?.toLowerCase().includes(filters.searchQuery.toLowerCase());
      
      // Specialty filter
      const specialtyMatch = filters.specialty === 'all' || 
        provider.specialty === filters.specialty;
      
      // Department filter
      const departmentMatch = filters.department === 'all' || 
        provider.department === filters.department;
      
      // Comp Model filter - ensure we check both possible property names
      const compModelMatch = filters.compModel === 'Select All' || 
        provider.compensationModel === filters.compModel;
      
      // FTE Range filter
      const fteMatch = (!provider.fte || (
        provider.fte >= filters.fteRange[0] && 
        provider.fte <= filters.fteRange[1]
      ));
      
      // Base Salary Range filter
      const salaryMatch = (!provider.baseSalary || (
        provider.baseSalary >= filters.baseSalaryRange[0] && 
        provider.baseSalary <= filters.baseSalaryRange[1]
      ));

      // Comp Percentile Range filter
      const compPercentileMatch = (
        (!filters.compPercentileMin || provider.compPercentile >= parseInt(filters.compPercentileMin)) &&
        (!filters.compPercentileMax || provider.compPercentile <= parseInt(filters.compPercentileMax))
      );

      // WRVU Percentile Range filter
      const wrvuPercentileMatch = (
        (!filters.wrvuPercentileMin || provider.wrvuPercentile >= parseInt(filters.wrvuPercentileMin)) &&
        (!filters.wrvuPercentileMax || provider.wrvuPercentile <= parseInt(filters.wrvuPercentileMax))
      );

      const matches = searchMatch && specialtyMatch && departmentMatch && 
        compModelMatch && fteMatch && salaryMatch && 
        compPercentileMatch && wrvuPercentileMatch;
      
      if (!matches) {
        console.log('Provider filtered out:', {
          name: provider.name,
          searchMatch,
          specialtyMatch,
          departmentMatch,
          compModelMatch,
          fteMatch,
          salaryMatch,
          compPercentileMatch,
          wrvuPercentileMatch
        });
      }

      return matches;
    });

    console.log('Filtering complete:', { 
      originalLength: data.length, 
      filteredLength: filtered.length 
    });

    return filtered;
  };

  // Fetch data when filters or page changes
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reports/monthly-performance?month=${filters.month}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const rawData = await response.json();
      
      console.log('Raw API response:', rawData);
      
      if (!rawData || !rawData.data) {
        console.error('Invalid API response structure:', rawData);
        throw new Error('Invalid API response structure');
      }

      // Apply filters to the raw data
      const filteredData = filterData(rawData.data);
      console.log('After filtering:', filteredData);
      
      const mappedData = filteredData.map(provider => ({
        ...provider,
        name: provider.name || provider.providerName,
        specialty: provider.specialty,
        department: provider.department,
        compensationModel: provider.compensationModel || provider.compModel || 'Standard',
        monthlyWRVUs: provider.monthlyWRVUs || 0,
        targetWRVUs: provider.targetWRVUs || 0,
        ytdWRVUs: provider.ytdWRVUs || 0,
        ytdTargetWRVUs: provider.ytdTargetWRVUs || 0,
        planProgress: provider.planProgress || 0,
        wrvuPercentile: provider.wrvuPercentile || 0,
        baseSalary: provider.baseSalary || 0,
        totalCompensation: provider.totalCompensation || provider.totalComp || 0,
        compPercentile: provider.compPercentile || 0
      }));

      console.log('Final mapped data:', mappedData);
      
      // Calculate summary values based on filtered data
      const calculatedSummary = {
        totalProviders: mappedData.length,
        averageWRVUPercentile: mappedData.reduce((sum, provider) => sum + (provider.wrvuPercentile || 0), 0) / (mappedData.length || 1),
        averagePlanProgress: mappedData.reduce((sum, provider) => sum + (provider.planProgress || 0), 0) / (mappedData.length || 1),
        totalWRVUs: mappedData.reduce((sum, provider) => sum + (provider.monthlyWRVUs || 0), 0),
        totalCompensation: mappedData.reduce((sum, provider) => sum + (provider.totalCompensation || 0), 0)
      };
      
      // Update the data state with filtered results
      setData(mappedData);
      setSummary(calculatedSummary);
      
      // Update pagination based on filtered data
      setTotalItems(mappedData.length);
      setTotalPages(Math.ceil(mappedData.length / itemsPerPage));
      
      // Reset to first page if current page is out of bounds
      if (currentPage > Math.ceil(mappedData.length / itemsPerPage)) {
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data. Please try again.",
        variant: "destructive"
      });
      // Set empty states on error
      setData([]);
      setSummary(null);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, currentPage]);

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleRangeChange = (key: 'fteRange' | 'baseSalaryRange', value: [number, number]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metrics/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to recalculate metrics');
      }
      
      toast({
        title: "Success",
        description: "Metrics recalculated successfully",
      });
      
      // Refresh the data
      await fetchData();
    } catch (error) {
      console.error('Error recalculating metrics:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to recalculate metrics. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      month: new Date().getMonth() + 1,
      specialty: 'all',
      department: 'all',
      status: 'Active',
      searchQuery: '',
      compModel: 'Select All',
      wrvuPercentileMin: '',
      wrvuPercentileMax: '',
      compPercentileMin: '',
      compPercentileMax: '',
      planProgressMin: '',
      planProgressMax: '',
      missingBenchmarks: false,
      missingWRVUs: false,
      nonClinicalOnly: false,
      inactiveOnly: false,
      fteRange: [0, 1.0],
      baseSalaryRange: [0, 2000000]
    });
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportToExcel = () => {
    try {
      // Create filter summary data
      const filterSummary = [
        ['Provider Performance Report - Filter Summary'],
        [''],
        ['Report Statistics:'],
        ['Total Providers:', data.length.toString()],
        ['Average WRVU Percentile:', formatPercent(summary?.averageWRVUPercentile || 0)],
        ['Average Plan Progress:', formatPercent(summary?.averagePlanProgress || 0)],
        ['Total WRVUs:', formatNumber(summary?.totalWRVUs || 0)],
        ['Total Compensation:', formatCurrency(summary?.totalCompensation || 0)],
        [''],
        ['Applied Filters:'],
        ['Month:', months[filters.month - 1]],
        ['Specialty:', filters.specialty === 'all' ? 'All Specialties' : filters.specialty],
        ['Department:', filters.department === 'all' ? 'All Departments' : filters.department],
        ['Compensation Model:', filters.compModel],
        ['FTE Range:', `${filters.fteRange[0].toFixed(1)} - ${filters.fteRange[1].toFixed(1)}`],
        ['Base Salary Range:', `${formatCurrency(filters.baseSalaryRange[0])} - ${formatCurrency(filters.baseSalaryRange[1])}`],
        ['WRVU Percentile Range:', filters.wrvuPercentileMin || filters.wrvuPercentileMax ? 
          `${filters.wrvuPercentileMin || '0'}% - ${filters.wrvuPercentileMax || '100'}%` : 'All'],
        ['Comp Percentile Range:', filters.compPercentileMin || filters.compPercentileMax ? 
          `${filters.compPercentileMin || '0'}% - ${filters.compPercentileMax || '100'}%` : 'All'],
        ['Search Query:', filters.searchQuery || 'None'],
        [''],
        ['Report Generated:', new Date().toLocaleString()],
      ];

      // Format the provider data for Excel
      const excelData = data.map(provider => ({
        'Provider Name': provider.name,
        'Specialty': provider.specialty,
        'Department': provider.department,
        'Compensation Model': provider.compensationModel,
        'Monthly WRVUs': formatNumber(provider.monthlyWRVUs || 0),
        'Monthly Target': formatNumber(provider.targetWRVUs || 0),
        'YTD WRVUs': formatNumber(provider.ytdWRVUs || 0),
        'YTD Target': formatNumber(provider.ytdTargetWRVUs || 0),
        'Plan Progress': formatPercent(provider.planProgress || 0),
        'WRVU Percentile': formatPercent(provider.wrvuPercentile || 0),
        'Base Salary': formatCurrency(provider.baseSalary || 0),
        'Total Compensation': formatCurrency(provider.totalCompensation || 0),
        'Comp Percentile': formatPercent(provider.compPercentile || 0)
      }));

      // Create a new workbook
      const wb = XLSX.utils.book_new();

      // Add filter summary sheet
      const ws_summary = XLSX.utils.aoa_to_sheet(filterSummary);
      XLSX.utils.book_append_sheet(wb, ws_summary, 'Report Summary');

      // Style the summary sheet
      ws_summary['!cols'] = [{ wch: 25 }, { wch: 50 }];
      
      // Add title style to summary sheet
      ws_summary['A1'] = { v: 'Provider Performance Report - Filter Summary', s: { font: { bold: true, sz: 14 } } };
      
      // Add provider data sheet
      const ws_data = XLSX.utils.json_to_sheet(excelData);
      ws_data['!cols'] = [
        { wch: 25 }, // Provider Name
        { wch: 20 }, // Specialty
        { wch: 20 }, // Department
        { wch: 20 }, // Compensation Model
        { wch: 15 }, // Monthly WRVUs
        { wch: 15 }, // Monthly Target
        { wch: 15 }, // YTD WRVUs
        { wch: 15 }, // YTD Target
        { wch: 15 }, // Plan Progress
        { wch: 15 }, // WRVU Percentile
        { wch: 18 }, // Base Salary
        { wch: 18 }, // Total Compensation
        { wch: 15 }, // Comp Percentile
      ];

      // Add data validation for percentages
      const percentageCols = ['I', 'J', 'M']; // Plan Progress, WRVU Percentile, Comp Percentile
      const percentageValidation = {
        type: 'decimal',
        operator: 'between',
        formula1: '0',
        formula2: '1',
        allowBlank: true,
        showErrorMessage: true,
        errorTitle: 'Invalid Input',
        error: 'Please enter a value between 0 and 100',
        prompt: 'Enter a percentage between 0 and 100'
      };

      percentageCols.forEach(col => {
        ws_data['!dataValidation'] = {
          [`${col}2:${col}1048576`]: percentageValidation
        };
      });

      // Add table styling
      const range = XLSX.utils.decode_range(ws_data['!ref'] || 'A1:M1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = { c: C, r: R };
          const cell_ref = XLSX.utils.encode_cell(cell_address);
          if (!ws_data[cell_ref]) continue;
          
          // Add cell styling
          ws_data[cell_ref].s = {
            font: { name: 'Arial' },
            alignment: { vertical: 'center' },
            border: {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }
          };

          // Header row styling
          if (R === 0) {
            ws_data[cell_ref].s.font.bold = true;
            ws_data[cell_ref].s.fill = { fgColor: { rgb: 'E2E8F0' } };
          }
          // Alternating row colors
          else if (R % 2) {
            ws_data[cell_ref].s.fill = { fgColor: { rgb: 'F8FAFC' } };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws_data, 'Provider Performance');

      // Generate the Excel file with current month in the filename
      const currentDate = new Date();
      const monthName = months[currentDate.getMonth()];
      const fileName = `Provider_Performance_${monthName}_${currentDate.getFullYear()}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Success",
        description: "Data exported to Excel successfully",
      });
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Monthly Provider Performance Summary</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExportToExcel}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V6C22 4.89543 21.1046 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 12L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Export to Excel
          </button>
          <button
            onClick={handleRecalculate}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Recalculate Metrics
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="bg-white shadow hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Providers</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalProviders}</div>
              <p className="text-xs text-muted-foreground mt-1">Active providers this month</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">WRVU Percentile</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(summary.averageWRVUPercentile)}</div>
              <p className="text-xs text-muted-foreground mt-1">Compared to market data</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Plan Progress</CardTitle>
              <Target className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(summary.averagePlanProgress)}</div>
              <p className="text-xs text-muted-foreground mt-1">Towards annual target</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total WRVUs</CardTitle>
              <Activity className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalWRVUs)}</div>
              <p className="text-xs text-muted-foreground mt-1">Generated this month</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Comp</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalCompensation)}</div>
              <p className="text-xs text-muted-foreground mt-1">Including incentives</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collapsible Filters */}
      <Card>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isFiltersVisible ? 'rotate-180' : ''}`} />
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleResetFilters();
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Filters
              </button>
            )}
          </div>
        </CardHeader>
        {isFiltersVisible && (
          <CardContent>
            <div className="space-y-8">
              {/* Date, Specialty, Department, and Comp Model Filters */}
              <div className="grid grid-cols-4 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Month</label>
                  <Select
                    value={filters.month.toString()}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, month: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={month} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Specialty</label>
                  <Select
                    value={filters.specialty}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, specialty: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select specialty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specialties</SelectItem>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Department</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {filters.department === 'all' ? 'All Departments' : filters.department}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Search departments..." />
                        <CommandEmpty>No department found.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          <CommandItem
                            value="all"
                            onSelect={() => setFilters(prev => ({ ...prev, department: 'all' }))}
                            className="cursor-pointer"
                          >
                            All Departments
                          </CommandItem>
                          {departments.map((department) => (
                            <CommandItem
                              key={department}
                              value={department}
                              onSelect={() => setFilters(prev => ({ ...prev, department }))}
                              className="cursor-pointer"
                            >
                              {department}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Comp Model</label>
                  <Select
                    value={filters.compModel}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, compModel: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select comp model" />
                    </SelectTrigger>
                    <SelectContent>
                      {compModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Range Sliders */}
              <div className="grid grid-cols-4 gap-6">
                {/* FTE Range */}
                <div className="p-4 border rounded-lg bg-white space-y-2">
                  <label className="block text-sm font-medium text-gray-700">FTE Range</label>
                  <div className="pt-2">
                    <DualRangeSlider
                      min={0}
                      max={1.0}
                      step={0.1}
                      value={[
                        filters.fteRange[0] === 0 && filters.fteRange[1] === 1.0 ? 0 : filters.fteRange[0],
                        filters.fteRange[0] === 0 && filters.fteRange[1] === 1.0 ? 1.0 : filters.fteRange[1]
                      ]}
                      onValueChange={(value: [number, number]) => handleRangeChange('fteRange', value)}
                      className="h-1"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 pt-2">
                    <span>{filters.fteRange[0].toFixed(1)}</span>
                    <span>{filters.fteRange[1].toFixed(1)}</span>
                  </div>
                </div>

                {/* Base Salary Range */}
                <div className="p-4 border rounded-lg bg-white space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Base Salary Range</label>
                  <div className="pt-2">
                    <DualRangeSlider
                      min={0}
                      max={2000000}
                      step={10000}
                      value={[
                        filters.baseSalaryRange[0] === 0 && filters.baseSalaryRange[1] === 2000000 ? 0 : filters.baseSalaryRange[0],
                        filters.baseSalaryRange[0] === 0 && filters.baseSalaryRange[1] === 2000000 ? 2000000 : filters.baseSalaryRange[1]
                      ]}
                      onValueChange={(value: [number, number]) => handleRangeChange('baseSalaryRange', value)}
                      className="h-1"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 pt-2">
                    <span>${filters.baseSalaryRange[0].toLocaleString()}</span>
                    <span>${filters.baseSalaryRange[1].toLocaleString()}</span>
                  </div>
                </div>

                {/* Comp Percentile Range */}
                <div className="p-4 border rounded-lg bg-white space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Comp Percentile Range</label>
                  <div className="pt-2">
                    <DualRangeSlider
                      min={0}
                      max={100}
                      step={1}
                      value={[
                        filters.compPercentileMin === '' ? 0 : parseInt(filters.compPercentileMin),
                        filters.compPercentileMax === '' ? 100 : parseInt(filters.compPercentileMax)
                      ]}
                      onValueChange={(value: [number, number]) => {
                        setFilters(prev => ({
                          ...prev,
                          compPercentileMin: value[0].toString(),
                          compPercentileMax: value[1].toString()
                        }));
                      }}
                      className="h-1"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 pt-2">
                    <span>{filters.compPercentileMin || '0'}%</span>
                    <span>{filters.compPercentileMax || '100'}%</span>
                  </div>
                </div>

                {/* WRVU Percentile Range */}
                <div className="p-4 border rounded-lg bg-white space-y-2">
                  <label className="block text-sm font-medium text-gray-700">WRVU Percentile Range</label>
                  <div className="pt-2">
                    <DualRangeSlider
                      min={0}
                      max={100}
                      step={1}
                      value={[
                        filters.wrvuPercentileMin === '' ? 0 : parseInt(filters.wrvuPercentileMin),
                        filters.wrvuPercentileMax === '' ? 100 : parseInt(filters.wrvuPercentileMax)
                      ]}
                      onValueChange={(value: [number, number]) => {
                        setFilters(prev => ({
                          ...prev,
                          wrvuPercentileMin: value[0].toString(),
                          wrvuPercentileMax: value[1].toString()
                        }));
                      }}
                      className="h-1"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 pt-2">
                    <span>{filters.wrvuPercentileMin || '0'}%</span>
                    <span>{filters.wrvuPercentileMax || '100'}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Data Table */}
      <Card className="border rounded-xl overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Provider Performance Details</CardTitle>
            <div className="flex items-center gap-4">
              <div className="w-72">
                <Input
                  placeholder="Search by provider name..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="border rounded-xl">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Comp Model</TableHead>
                      <TableHead className="text-right">Monthly WRVUs</TableHead>
                      <TableHead className="text-right">Monthly Target</TableHead>
                      <TableHead className="text-right">YTD WRVUs</TableHead>
                      <TableHead className="text-right">YTD Target</TableHead>
                      <TableHead className="text-right">Plan Progress</TableHead>
                      <TableHead className="text-right">WRVU Percentile</TableHead>
                      <TableHead className="text-right">Base Salary</TableHead>
                      <TableHead className="text-right">Total Comp</TableHead>
                      <TableHead className="text-right">Comp Percentile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((provider) => (
                      <TableRow key={provider.employeeId}>
                        <TableCell>
                          <Link
                            href={`/provider/${provider.employeeId}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {provider.name}
                          </Link>
                        </TableCell>
                        <TableCell>{provider.specialty}</TableCell>
                        <TableCell>{provider.department}</TableCell>
                        <TableCell>{provider.compensationModel}</TableCell>
                        <TableCell className="text-right">{provider.monthlyWRVUs ? formatNumber(provider.monthlyWRVUs) : '-'}</TableCell>
                        <TableCell className="text-right">{provider.targetWRVUs ? formatNumber(provider.targetWRVUs) : '-'}</TableCell>
                        <TableCell className="text-right">{provider.ytdWRVUs ? formatNumber(provider.ytdWRVUs) : '-'}</TableCell>
                        <TableCell className="text-right">{provider.ytdTargetWRVUs ? formatNumber(provider.ytdTargetWRVUs) : '-'}</TableCell>
                        <TableCell className="text-right">{formatPercent(provider.planProgress)}</TableCell>
                        <TableCell className="text-right">{formatPercent(provider.wrvuPercentile)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(provider.baseSalary)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(provider.totalCompensation)}</TableCell>
                        <TableCell className={cn(
                          "text-right",
                          provider.compPercentile >= 80 && "bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-500"
                        )}>
                          {formatPercent(provider.compPercentile)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 