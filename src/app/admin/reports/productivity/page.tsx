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
import { formatCurrency, formatNumber, formatPercent, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from "@/components/ui/switch";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
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
import { FunnelIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ScatterPlot = dynamic(() => import('@/components/Charts/ScatterPlot'), { ssr: false })

// Add statistical presets
const PERCENTILE_PRESETS = [
  { label: "All Providers", wrvu: [0, 100] as [number, number], comp: [0, 100] as [number, number] },
  { label: "Top Quartile (75th-100th)", wrvu: [75, 100] as [number, number], comp: [75, 100] as [number, number] },
  { label: "Middle Half (25th-75th)", wrvu: [25, 75] as [number, number], comp: [25, 75] as [number, number] },
  { label: "Bottom Quartile (0-25th)", wrvu: [0, 25] as [number, number], comp: [0, 25] as [number, number] },
  { label: "High Performers (>50th)", wrvu: [50, 100] as [number, number], comp: [0, 100] as [number, number] },
  { label: "Low Performers (<50th)", wrvu: [0, 50] as [number, number], comp: [0, 100] as [number, number] },
  { label: "Market Competitive (40th-60th)", wrvu: [40, 60] as [number, number], comp: [40, 60] as [number, number] },
];

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
  analysisRange: string;
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
    baseSalaryRange: [0, 2000000],
    analysisRange: 'All Providers'
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
        console.log('Raw API response:', rawData);
        
        if (!rawData || !rawData.data) {
          console.error('Invalid API response structure:', rawData);
          throw new Error('Invalid API response structure');
        }

        // Apply filters
        const filteredData = rawData.data.filter((provider: any) => {
          console.log('Processing provider:', provider);
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
        const processedData = filteredData.map((provider: any) => {
          console.log('Provider before processing:', provider);
          const processed = {
            id: provider.id || provider.employeeId,
            name: provider.name || provider.providerName,
            specialty: provider.specialty,
            department: provider.department,
            compModel: provider.compensationModel,
            fte: provider.fte || 1.0,
            wrvus: provider.monthlyWRVUs || provider.actualWRVUs,
            target: provider.targetWRVUs,
            wrvuPercentile: provider.wrvuPercentile,
            compPercentile: provider.compPercentile,
            compensation: provider.totalCompensation,
            color: getColorForCategory(provider.wrvuPercentile, provider.compPercentile),
            size: 6,
            analysis: {
              category: getPerformanceCategory(provider.wrvuPercentile, provider.compPercentile),
              gap: provider.compPercentile - provider.wrvuPercentile
            }
          };
          console.log('Processed provider data:', processed);
          return processed;
        });

        console.log('Final processed data:', processedData);
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
      wrvuPercentileMin: '0',
      wrvuPercentileMax: '100',
      compPercentileMin: '0',
      compPercentileMax: '100',
      planProgressMin: '',
      planProgressMax: '',
      missingBenchmarks: false,
      missingWRVUs: false,
      nonClinicalOnly: false,
      inactiveOnly: false,
      fteRange: [0, 1.0],
      baseSalaryRange: [0, 2000000],
      analysisRange: 'All Providers'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section with Stats */}
      <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Provider Performance Analysis</h1>
            <p className="text-xs text-muted-foreground mt-1">
              YTD productivity and compensation analysis through {months[filters.month - 1]} 2025
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{data.length} Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-xs text-muted-foreground">{data.filter(p => Math.abs(p.analysis.gap) <= 15).length} Aligned</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">{data.filter(p => p.analysis.gap > 15).length} Over Comp.</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">{data.filter(p => p.analysis.gap < -15).length} Under Comp.</span>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-6">
          <div className="flex-1 grid grid-cols-5 gap-6">
            <Select
              value={filters.month.toString()}
              onValueChange={(value) => setFilters({ ...filters, month: parseInt(value) })}
            >
              <SelectTrigger className="h-9 bg-white/50 border-muted">
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

            <Select
              value={filters.specialty}
              onValueChange={(value) => setFilters({ ...filters, specialty: value })}
            >
              <SelectTrigger className="h-9 bg-white/50 border-muted">
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

            <Select
              value={filters.department}
              onValueChange={(value) => setFilters({ ...filters, department: value })}
            >
              <SelectTrigger className="h-9 bg-white/50 border-muted">
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

            <Select
              value={filters.compModel}
              onValueChange={(value) => setFilters({ ...filters, compModel: value })}
            >
              <SelectTrigger className="h-9 bg-white/50 border-muted">
                <SelectValue placeholder="All Comp Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Select All">All Comp Models</SelectItem>
                {compModels.filter(model => model !== 'Select All').map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-3">
              <Select
                value={filters.analysisRange}
                onValueChange={(value) => {
                  if (value === 'Custom') return;
                  const preset = PERCENTILE_PRESETS.find(p => p.label === value);
                  if (preset) {
                    setFilters({
                      ...filters,
                      analysisRange: value,
                      wrvuPercentileMin: preset.wrvu[0].toString(),
                      wrvuPercentileMax: preset.wrvu[1].toString(),
                      compPercentileMin: preset.comp[0].toString(),
                      compPercentileMax: preset.comp[1].toString(),
                    });
                  }
                }}
              >
                <SelectTrigger className="h-9 bg-white/50 border-muted">
                  <SelectValue placeholder="Performance Range" />
                </SelectTrigger>
                <SelectContent>
                  {PERCENTILE_PRESETS.map((preset) => (
                    <SelectItem key={preset.label} value={preset.label}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Performance Distribution */}
        <Card className="overflow-hidden">
          <CardHeader className="py-3 px-6 border-b bg-muted/40">
            <div className="flex items-center justify-between">
              {/* Range Controls */}
              <div className="flex gap-8">
                <div className="w-[240px] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-medium text-muted-foreground">wRVU Range</label>
                    <span className="text-[11px] text-muted-foreground">
                      {filters.wrvuPercentileMin}-{filters.wrvuPercentileMax}%
                    </span>
                  </div>
                  <Slider
                    value={[
                      parseInt(filters.wrvuPercentileMin || '0'),
                      parseInt(filters.wrvuPercentileMax || '100')
                    ]}
                    min={0}
                    max={100}
                    step={1}
                    className="py-0.5"
                    onValueChange={(value) => {
                      setFilters({
                        ...filters,
                        wrvuPercentileMin: value[0].toString(),
                        wrvuPercentileMax: value[1].toString(),
                        analysisRange: 'Custom'
                      });
                    }}
                  />
                </div>

                <div className="w-[240px] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-medium text-muted-foreground">Compensation Range</label>
                    <span className="text-[11px] text-muted-foreground">
                      {filters.compPercentileMin}-{filters.compPercentileMax}%
                    </span>
                  </div>
                  <Slider
                    value={[
                      parseInt(filters.compPercentileMin || '0'),
                      parseInt(filters.compPercentileMax || '100')
                    ]}
                    min={0}
                    max={100}
                    step={1}
                    className="py-0.5"
                    onValueChange={(value) => {
                      setFilters({
                        ...filters,
                        compPercentileMin: value[0].toString(),
                        compPercentileMax: value[1].toString(),
                        analysisRange: 'Custom'
                      });
                    }}
                  />
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 cursor-help">
                      <span className="h-2 w-2 rounded-full bg-[#10b981]" />
                      <span>Aligned (±15%)</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="p-3">
                      <p className="text-sm font-medium mb-1">Aligned Performance</p>
                      <p className="text-xs text-muted-foreground">Provider's compensation percentile is within 15 percentage points of their productivity percentile, indicating fair market alignment.</p>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 cursor-help">
                      <span className="h-2 w-2 rounded-full bg-[#ef4444]" />
                      <span>Over Compensated (&gt;15%)</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="p-3">
                      <p className="text-sm font-medium mb-1">Over Compensated</p>
                      <p className="text-xs text-muted-foreground">Provider's compensation percentile exceeds their productivity percentile by more than 15 percentage points, suggesting potential compensation adjustment may be needed.</p>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1.5 cursor-help">
                      <span className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                      <span>Under Compensated (&lt;-15%)</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="p-3">
                      <p className="text-sm font-medium mb-1">Under Compensated</p>
                      <p className="text-xs text-muted-foreground">Provider's compensation percentile is more than 15 percentage points below their productivity percentile, indicating potential for compensation increase consideration.</p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Scatter Plot Container - Even more compact size */}
            <div className="relative w-full" style={{ paddingBottom: '55%', maxHeight: 'calc(100vh - 28rem)' }}>
              <div className="absolute inset-0">
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
                    xAxisKey="wrvuPercentile"
                    yAxisKey="compPercentile"
                    xAxisLabel="YTD Productivity Percentile"
                    yAxisLabel="Compensation Percentile"
                    tooltipLabel="Provider Details"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Provider Details */}
        <Card className="mt-4 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Provider Details</CardTitle>
                <CardDescription className="text-xs">Detailed performance metrics by provider</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-[300px]">
                  <Input
                    type="text"
                    placeholder="Search providers..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="h-9 pl-9"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs text-muted-foreground">{data.length} providers</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="border-b sticky top-0 bg-white">
                  <tr>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 p-4 pl-6 bg-gray-50/80">Provider</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 p-4 bg-gray-50/80">Specialty</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 p-4 bg-gray-50/80">Comp Model</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 p-4 bg-gray-50/80">FTE</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 p-4 bg-gray-50/80">WRVU %</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 p-4 bg-gray-50/80">Comp %</th>
                    <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 p-4 bg-gray-50/80">Gap</th>
                    <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 p-4 pr-6 bg-gray-50/80">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 pl-6 text-[13px] font-medium text-gray-900 whitespace-nowrap">{provider.name}</td>
                      <td className="p-4 text-[13px] text-gray-500 whitespace-nowrap">{provider.specialty}</td>
                      <td className="p-4 text-[13px] text-gray-500 whitespace-nowrap">{provider.compModel}</td>
                      <td className="p-4 text-[13px] text-gray-900 font-medium text-right tabular-nums whitespace-nowrap">{provider.fte.toFixed(2)}</td>
                      <td className="p-4 text-[13px] text-gray-900 font-medium text-right tabular-nums whitespace-nowrap">{formatNumber(provider.wrvuPercentile)}%</td>
                      <td className="p-4 text-[13px] text-gray-900 font-medium text-right tabular-nums whitespace-nowrap">{formatNumber(provider.compPercentile)}%</td>
                      <td className="p-4 text-[13px] text-gray-900 font-medium text-right tabular-nums whitespace-nowrap">{formatNumber(provider.analysis.gap)}%</td>
                      <td className="p-4 pr-6 whitespace-nowrap">
                        <span 
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ 
                            backgroundColor: `${provider.color}12`,
                            color: provider.color,
                            boxShadow: `0 0 0 1px ${provider.color}25`
                          }}
                        >
                          {provider.analysis.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 