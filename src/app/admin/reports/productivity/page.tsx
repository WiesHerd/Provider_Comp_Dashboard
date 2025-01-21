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
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, Users, TrendingUp, Target, DollarSign, Activity, ChevronDown, Filter, X } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from "@/components/ui/switch";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
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
import dynamic from 'next/dynamic'

const ScatterPlot = dynamic(() => import('../../../../components/ScatterPlot'), { ssr: false })

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

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper functions
const getColorForCategory = (wrvuPercentile: number, compPercentile: number): string => {
  const percentileGap = compPercentile - wrvuPercentile;
  if (Math.abs(percentileGap) <= 15) return '#10b981'; // Aligned (green)
  if (percentileGap > 15) return '#ef4444';  // Over compensated (red)
  return '#f59e0b';  // Under compensated (yellow)
};

const getPerformanceCategory = (wrvuPercentile: number, compPercentile: number): string => {
  const percentileGap = compPercentile - wrvuPercentile;
  if (Math.abs(percentileGap) <= 15) return 'Aligned';
  if (percentileGap > 15) return 'Over Compensated';
  return 'Under Compensated';
};

export default function ProductivityPage() {
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
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [compModels, setCompModels] = useState<string[]>(['Select All']);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

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

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await fetch('/api/providers/filter-options');
        const data = await response.json();
        setSpecialties(data.specialties);
        setDepartments(data.departments);
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

  // Fetch and filter data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/reports/monthly-performance?month=${filters.month}`);
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const rawData = await response.json();
        
        if (!rawData || !rawData.data) {
          console.error('Invalid API response structure:', rawData);
          throw new Error('Invalid API response structure');
        }

        // Apply filters
        const filteredData = rawData.data.filter((provider: any) => {
          const searchMatch = !filters.searchQuery || 
            provider.name?.toLowerCase().includes(filters.searchQuery.toLowerCase());
          
          const specialtyMatch = filters.specialty === 'all' || 
            provider.specialty === filters.specialty;
          
          const departmentMatch = filters.department === 'all' || 
            provider.department === filters.department;
          
          const compModelMatch = filters.compModel === 'Select All' || 
            provider.compensationModel === filters.compModel;
          
          const fteMatch = (!provider.fte || (
            provider.fte >= filters.fteRange[0] && 
            provider.fte <= filters.fteRange[1]
          ));
          
          const salaryMatch = (!provider.baseSalary || (
            provider.baseSalary >= filters.baseSalaryRange[0] && 
            provider.baseSalary <= filters.baseSalaryRange[1]
          ));

          const compPercentileMatch = (
            (!filters.compPercentileMin || provider.compPercentile >= parseInt(filters.compPercentileMin)) &&
            (!filters.compPercentileMax || provider.compPercentile <= parseInt(filters.compPercentileMax))
          );

          const wrvuPercentileMatch = (
            (!filters.wrvuPercentileMin || provider.wrvuPercentile >= parseInt(filters.wrvuPercentileMin)) &&
            (!filters.wrvuPercentileMax || provider.wrvuPercentile <= parseInt(filters.wrvuPercentileMax))
          );

          return searchMatch && specialtyMatch && departmentMatch && 
            compModelMatch && fteMatch && salaryMatch && 
            compPercentileMatch && wrvuPercentileMatch;
        });

        // Process data for scatter plot
        const processedData = filteredData.map((provider: any) => ({
          id: provider.id || provider.employeeId,
          name: provider.name || provider.providerName,
          specialty: provider.specialty,
          xValue: provider.wrvuPercentile,
          yValue: provider.compPercentile,
          color: getColorForCategory(provider.wrvuPercentile, provider.compPercentile),
          size: 6,
          productivity: {
            actualWRVUs: provider.monthlyWRVUs || provider.actualWRVUs,
            targetWRVUs: provider.targetWRVUs,
            percentile: provider.wrvuPercentile
          },
          compensation: {
            total: provider.totalCompensation,
            percentile: provider.compPercentile
          },
          analysis: {
            percentileGap: provider.compPercentile - provider.wrvuPercentile,
            performanceCategory: getPerformanceCategory(provider.wrvuPercentile, provider.compPercentile)
          }
        }));

        setData(processedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching provider data:', error);
        toast({
          title: "Error",
          description: "Failed to fetch provider data. Please try again.",
          variant: "destructive"
        });
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, toast]);

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

  return (
    <div className="space-y-6 p-8">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">YTD Productivity vs Compensation Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Year-to-date provider productivity and compensation analysis through January 2025
          </p>
        </div>
        <div className="flex gap-2">
          {activeFilterCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              <X className="h-4 w-4 mr-1" />
              Reset All ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <div className="border rounded-lg">
        <button
          onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isFiltersVisible ? "transform rotate-180" : "")} />
        </button>

        {isFiltersVisible && (
          <div className="p-4 border-t space-y-6">
            {/* Basic Filters */}
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">YTD Through Month</label>
                <Select
                  value={filters.month.toString()}
                  onValueChange={(value) => setFilters({ ...filters, month: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index + 1} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Specialty</label>
                <Select
                  value={filters.specialty}
                  onValueChange={(value) => setFilters({ ...filters, specialty: value })}
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
              <div>
                <label className="text-sm font-medium mb-1.5 block">Department</label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters({ ...filters, department: value })}
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
          </div>
        )}
      </div>

      {/* Analysis Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Legend */}
            <div className="flex items-center justify-end gap-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#10b981]" />
                <span className="text-sm text-muted-foreground">Aligned (±15%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
                <span className="text-sm text-muted-foreground">Over Compensated (&gt;15%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#f59e0b]" />
                <span className="text-sm text-muted-foreground">Under Compensated (&lt;-15%)</span>
              </div>
            </div>

            {/* Scatter Plot */}
            <div style={{ height: '600px' }}>
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Loading data...</p>
                  </div>
                </div>
              ) : data.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">No data available for the selected filters</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={handleResetFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <ScatterPlot 
                  data={data}
                  xAxisKey="xValue"
                  yAxisKey="yValue"
                  xAxisLabel="YTD Productivity Percentile"
                  yAxisLabel="Compensation Percentile"
                  tooltipLabel="Provider Details"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 