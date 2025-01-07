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
import { Loader2, Users, TrendingUp, Target, DollarSign, Activity, ChevronDown } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

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
}

export default function MonthlyPerformanceReport() {
  const [filters, setFilters] = useState<FilterState>({
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
    planProgressMax: ''
  });

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

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
      setTotalPages(result.pagination.totalPages);
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Monthly Provider Performance Summary</h1>

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
          onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isFiltersExpanded ? 'rotate-180' : ''}`} />
          </div>
        </CardHeader>
        {isFiltersExpanded && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
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

              {/* Provider Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Specialty</label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Department</label>
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

              {/* Performance Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">WRVU Percentile Range</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.wrvuPercentileMin}
                    onChange={(e) => handleFilterChange('wrvuPercentileMin', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.wrvuPercentileMax}
                    onChange={(e) => handleFilterChange('wrvuPercentileMax', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Compensation Percentile Range</label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.compPercentileMin}
                    onChange={(e) => handleFilterChange('compPercentileMin', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.compPercentileMax}
                    onChange={(e) => handleFilterChange('compPercentileMax', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Data Table */}
      <Card>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Monthly WRVUs</TableHead>
                      <TableHead className="text-right">YTD WRVUs</TableHead>
                      <TableHead className="text-right">Plan Progress</TableHead>
                      <TableHead className="text-right">WRVU Percentile</TableHead>
                      <TableHead className="text-right">Base Salary</TableHead>
                      <TableHead className="text-right">Total Comp</TableHead>
                      <TableHead className="text-right">Comp Percentile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <a 
                            href={`/provider/${row.employeeId}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {row.name}
                          </a>
                        </TableCell>
                        <TableCell>{row.specialty}</TableCell>
                        <TableCell>{row.department}</TableCell>
                        <TableCell className="text-right">{row.monthlyWRVUs ? formatNumber(row.monthlyWRVUs) : '-'}</TableCell>
                        <TableCell className="text-right">{row.ytdWRVUs ? formatNumber(row.ytdWRVUs) : '-'}</TableCell>
                        <TableCell className="text-right">{formatPercent(row.planProgress)}</TableCell>
                        <TableCell className="text-right">{formatPercent(row.wrvuPercentile)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.baseSalary)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.totalCompensation)}</TableCell>
                        <TableCell className="text-right">{formatPercent(row.compPercentile)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 