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
import { Loader2, Users, TrendingUp, Target, DollarSign, Activity, ChevronDown, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from "../../../../components/ui/switch";
import { DualRangeSlider } from "../../../../components/ui/dual-range-slider";
import Link from 'next/link';

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface FilterState {
  year: number;
  month: number;
  specialty: string;
  department: string;
  status: string;
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

export default function MonthlyPerformanceReport() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>({
    year: 2024,
    month: new Date().getMonth() + 1,
    specialty: 'all',
    department: 'all',
    status: 'Active',
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
    fteRange: [0, 1],
    baseSalaryRange: [0, 2000000]
  });

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const ITEMS_PER_PAGE = 20;

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.specialty !== 'all') count++;
    if (filters.department !== 'all') count++;
    if (filters.fteRange[0] !== 0 || filters.fteRange[1] !== 1.0) count++;
    if (filters.baseSalaryRange[0] !== 0 || filters.baseSalaryRange[1] !== 2000000) count++;
    if (filters.month !== new Date().getMonth() + 1) count++;
    if (filters.year !== new Date().getFullYear()) count++;
    if (filters.missingBenchmarks) count++;
    if (filters.missingWRVUs) count++;
    if (filters.nonClinicalOnly) count++;
    if (filters.inactiveOnly) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Fetch specialties and departments for filters
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/providers/filter-options');
        const data = await response.json();
        setSpecialties(data.specialties);
        setDepartments(data.departments);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    };
    fetchFilterOptions();
  }, []);

  // Fetch report data
  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        year: filters.year.toString(),
        month: filters.month.toString(),
        page: page.toString(),
        ...(filters.specialty !== 'all' && { specialty: filters.specialty }),
        ...(filters.department !== 'all' && { department: filters.department }),
        ...(filters.status && { status: filters.status }),
        ...(filters.wrvuPercentileMin && { wrvuPercentileMin: filters.wrvuPercentileMin }),
        ...(filters.wrvuPercentileMax && { wrvuPercentileMax: filters.wrvuPercentileMax }),
        ...(filters.compPercentileMin && { compPercentileMin: filters.compPercentileMin }),
        ...(filters.compPercentileMax && { compPercentileMax: filters.compPercentileMax }),
        ...(filters.planProgressMin && { planProgressMin: filters.planProgressMin }),
        ...(filters.planProgressMax && { planProgressMax: filters.planProgressMax })
      });

      console.log('Fetching data with params:', queryParams.toString());
      const response = await fetch(`/api/reports/monthly-performance?${queryParams}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('Raw API Response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid JSON response from API');
      }

      if (!result || !result.data) {
        console.error('Invalid API response structure:', result);
        throw new Error('Invalid API response structure');
      }

      setData(result.data);
      setSummary(result.summary);
      setTotalPages(Math.ceil(result.data.length / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Error fetching report data:', error);
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when filters or page changes
  useEffect(() => {
    fetchData();
  }, [filters, page]);

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const handleRangeChange = (key: 'fteRange' | 'baseSalaryRange', value: [number, number]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
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
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      specialty: 'all',
      department: 'all',
      status: 'Active',
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
      fteRange: [0, 1.0] as [number, number],
      baseSalaryRange: [0, 2000000] as [number, number]
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
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
        <div className="grid grid-cols-5 gap-4">
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
              {/* Date, Specialty, and Department Filters */}
              <div className="grid grid-cols-4 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Year</label>
                  <Select
                    value={filters.year.toString()}
                    onValueChange={(value) => handleFilterChange('year', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Month</label>
                  <Select
                    value={filters.month.toString()}
                    onValueChange={(value) => handleFilterChange('month', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Specialty</label>
                  <Select
                    value={filters.specialty}
                    onValueChange={(value) => handleFilterChange('specialty', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Specialties" />
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
                  <Select
                    value={filters.department}
                    onValueChange={(value) => handleFilterChange('department', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department} value={department}>
                          {department}
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
                    max={1}
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
                    {data
                      .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
                      .map((provider) => (
                      <TableRow key={provider.id}>
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
              <div className="flex items-center justify-between border-t px-2 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{((page - 1) * ITEMS_PER_PAGE) + 1}</span>{' '}
                      to{' '}
                      <span className="font-medium">
                        {Math.min(page * ITEMS_PER_PAGE, data.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-medium">{data.length}</span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <Button
                        variant="outline"
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </Button>
                      {[...Array(Math.min(4, totalPages))].map((_, i) => (
                        <Button
                          key={i + 1}
                          variant={page === i + 1 ? "default" : "outline"}
                          className={classNames(
                            "relative inline-flex items-center px-4 py-2 text-sm font-semibold",
                            page === i + 1 ? "z-10 bg-indigo-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          )}
                          onClick={() => setPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </Button>
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