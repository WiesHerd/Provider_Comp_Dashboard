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

      const matches = searchMatch && specialtyMatch && departmentMatch && compModelMatch && fteMatch && salaryMatch;
      
      if (!matches) {
        console.log('Provider filtered out:', {
          name: provider.name,
          searchMatch,
          specialtyMatch,
          departmentMatch,
          compModelMatch,
          fteMatch,
          salaryMatch
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
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Monthly Provider Performance Summary</h1>
        <Button 
          onClick={handleRecalculate}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          Recalculate Metrics
        </Button>
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
              <div className="grid grid-cols-5 gap-6">
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
                  <label className="text-sm font-medium text-gray-700">Search</label>
                  <Input
                    type="text"
                    placeholder="Search providers..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="w-full"
                  />
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
              <div className="grid grid-cols-2 gap-6">
                {/* FTE Range */}
                <div className="p-4 border rounded-lg bg-white space-y-4">
                  <label className="block text-sm font-medium text-gray-700">FTE Range</label>
                  <DualRangeSlider
                    min={0}
                    max={2}
                    step={0.1}
                    value={filters.fteRange as [number, number]}
                    onChange={(value: [number, number]) => handleRangeChange('fteRange', value)}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{filters.fteRange[0].toFixed(1)}</span>
                    <span>{filters.fteRange[1].toFixed(1)}</span>
                  </div>
                </div>

                {/* Base Salary Range */}
                <div className="p-4 border rounded-lg bg-white space-y-4">
                  <label className="block text-sm font-medium text-gray-700">Base Salary Range</label>
                  <DualRangeSlider
                    min={0}
                    max={1000000}
                    step={10000}
                    value={filters.baseSalaryRange as [number, number]}
                    onChange={(value: [number, number]) => handleRangeChange('baseSalaryRange', value)}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>${filters.baseSalaryRange[0].toLocaleString()}</span>
                    <span>${filters.baseSalaryRange[1].toLocaleString()}</span>
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
          <CardTitle>Provider Performance Details</CardTitle>
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
                        <TableCell className="text-right">{formatPercent(provider.compPercentile)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(data.length / itemsPerPage), p + 1))}
                    disabled={currentPage === Math.ceil(data.length / itemsPerPage)}
                    className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">
                        {data.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, data.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{data.length}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  Previous
                      </button>
                      {Array.from({ length: Math.min(4, Math.ceil(data.length / itemsPerPage)) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={cn(
                            'relative inline-flex items-center px-4 py-2 text-sm font-semibold',
                            page === currentPage
                              ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                              : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                          )}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(data.length / itemsPerPage), p + 1))}
                        disabled={currentPage === Math.ceil(data.length / itemsPerPage)}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 