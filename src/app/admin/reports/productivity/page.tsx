'use client';

import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
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
  SelectGroup,
  SelectSeparator,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Users, Activity, TrendingUp, Target, ChevronDown, Filter, Loader2, Pause, Play } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import React from 'react';
import { ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';

const ScatterPlot = dynamic(() => import('@/components/Charts/ScatterPlot'), { ssr: false });

// Add proper types for animation points
interface Point {
  x: number;
  y: number;
}

// Update Provider interface to include all required fields
interface Provider {
  id: string;
  employeeId: string;
  name: string;
  wrvuPercentile: number;
  compPercentile: number;
  specialty: string;
  department: string;
  compModel: string;
  fte: number;
  color: string;
  size: number;
  wrvus: number;
  target: number;
  compensation: number;
  ytdWRVUs: number;
  ytdTarget: number;
  analysis: {
    category: string;
    gap: number;
  };
}

// Update animation trail type
interface AnimatedProvider extends Provider {
  id: string;
  wrvuPercentile: number;
  compPercentile: number;
  color: string;
  size: number;
}

// Remove unused interface properties
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
  analysisRange: string;
}

// Keep only the presets we're using
const PERCENTILE_PRESETS = [
  { label: "All Providers", wrvu: [0, 100] as [number, number], comp: [0, 100] as [number, number] },
  { label: "Top Quartile (75th-100th)", wrvu: [75, 100] as [number, number], comp: [75, 100] as [number, number] },
  { label: "Middle Half (25th-75th)", wrvu: [25, 75] as [number, number], comp: [25, 75] as [number, number] },
  { label: "Bottom Quartile (0-25th)", wrvu: [0, 25] as [number, number], comp: [0, 25] as [number, number] },
  { label: "High Performers (>50th)", wrvu: [50, 100] as [number, number], comp: [0, 100] as [number, number] },
  { label: "Low Performers (<50th)", wrvu: [0, 50] as [number, number], comp: [0, 100] as [number, number] },
  { label: "Market Competitive (40th-60th)", wrvu: [40, 60] as [number, number], comp: [40, 60] as [number, number] },
  { label: "Perfect Alignment (±5%)", wrvu: [0, 100] as [number, number], comp: [0, 100] as [number, number], alignmentFilter: 'perfect' },
  { label: "Aligned Only", wrvu: [0, 100] as [number, number], comp: [0, 100] as [number, number], alignmentFilter: 'aligned' },
  { label: "Over Compensated Only", wrvu: [0, 100] as [number, number], comp: [0, 100] as [number, number], alignmentFilter: 'over' },
  { label: "Under Compensated Only", wrvu: [0, 100] as [number, number], comp: [0, 100] as [number, number], alignmentFilter: 'under' }
];

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

const ProductivityPage: FC = () => {
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
    analysisRange: 'All Providers',
  });

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Provider[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [compModels, setCompModels] = useState<string[]>(['Select All']);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Animation state
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  const animationRef = useRef<number>();
  const pathPoints = useRef<Point[]>([]);

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
        console.log('Sample provider data:', rawData.data[0]);
        
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

          const compPercentileMatch = (
            (!filters.compPercentileMin || provider.compPercentile >= parseInt(filters.compPercentileMin)) &&
            (!filters.compPercentileMax || provider.compPercentile <= parseInt(filters.compPercentileMax))
          );

          const wrvuPercentileMatch = (
            (!filters.wrvuPercentileMin || provider.wrvuPercentile >= parseInt(filters.wrvuPercentileMin)) &&
            (!filters.wrvuPercentileMax || provider.wrvuPercentile <= parseInt(filters.wrvuPercentileMax))
          );

          // Add alignment filter
          const preset = PERCENTILE_PRESETS.find(p => p.label === filters.analysisRange);
          const gap = provider.compPercentile - provider.wrvuPercentile;
          const alignmentMatch = !preset?.alignmentFilter || (
            (preset.alignmentFilter === 'aligned' && Math.abs(gap) <= 15) ||
            (preset.alignmentFilter === 'over' && gap > 15) ||
            (preset.alignmentFilter === 'under' && gap < -15) ||
            (preset.alignmentFilter === 'perfect' && Math.abs(gap) <= 5)
          );

          return searchMatch && specialtyMatch && departmentMatch && 
            compModelMatch && compPercentileMatch && wrvuPercentileMatch && alignmentMatch;
        });

        // Process data for scatter plot
        const processedData = filteredData.map((provider: any) => {
          const wrvuPercentile = Math.min(100, Math.max(0, provider.wrvuPercentile || 
            (provider.productivity && provider.productivity.percentile) || 0));
          const compPercentile = Math.min(100, Math.max(0, provider.compPercentile || 0));
          
          return {
            id: provider.id || provider.employeeId,
            employeeId: provider.employeeId || provider.id,
            name: provider.name || provider.providerName,
            specialty: provider.specialty,
            department: provider.department,
            compModel: provider.compensationModel,
            fte: provider.fte || 1.0,
            wrvus: provider.monthlyWRVUs || provider.actualWRVUs || 0,
            target: provider.targetWRVUs || 0,
            ytdWRVUs: provider.ytdWRVUs || 0,
            ytdTarget: provider.ytdTarget || provider.ytdTargetWRVUs || 0,
            ytdTargetWRVUs: provider.ytdTargetWRVUs || 
              (provider.productivity && provider.productivity.ytdTargetWRVUs) || 0,
            wrvuPercentile,
            compPercentile,
            compensation: provider.totalCompensation || 0,
            color: getColorForCategory(wrvuPercentile, compPercentile),
            size: 6,
            previousPosition: provider.previousMonth ? {
              wrvuPercentile: Math.min(100, Math.max(0, provider.previousMonth.wrvuPercentile || 0)),
              compPercentile: Math.min(100, Math.max(0, provider.previousMonth.compPercentile || 0))
            } : undefined,
            analysis: {
              category: getPerformanceCategory(wrvuPercentile, compPercentile),
              gap: compPercentile - wrvuPercentile
            }
          };
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

  // Calculate active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.specialty !== 'all') count++;
    if (filters.department !== 'all') count++;
    if (filters.month !== new Date().getMonth() + 1) count++;
    if (filters.compModel !== 'Select All') count++;
    if (filters.analysisRange !== 'All Providers') count++;
    if (filters.searchQuery) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  // Update ScatterPlot props interface
  interface ScatterPlotProps {
    data: Provider[];
    xAxisKey: string;
    yAxisKey: string;
    xAxisLabel: string;
    yAxisLabel: string;
    tooltipLabel: string;
    hideRightLabel: boolean;
    hideMedianLabel: boolean;
    xAxisLabelOffset: number;
    medianXLabel: string;
    medianYLabel: string;
    medianLabelsPosition: string;
  }

  // Clean up filter validation
  const validateFilters = (filters: FilterState) => {
    const { wrvuPercentileMin, wrvuPercentileMax, compPercentileMin, compPercentileMax } = filters;
    
    if (wrvuPercentileMin && wrvuPercentileMax) {
      if (parseInt(wrvuPercentileMin) > parseInt(wrvuPercentileMax)) {
        return false;
      }
    }

    if (compPercentileMin && compPercentileMax) {
      if (parseInt(compPercentileMin) > parseInt(compPercentileMax)) {
        return false;
      }
    }

    return true;
  };

  // Generate animation path points
  const generatePathPoints = (provider: Provider): Point[] => {
    const points: Point[] = [];
    const baseX = Math.min(100, Math.max(0, provider.wrvuPercentile));
    const baseY = Math.min(100, Math.max(0, provider.compPercentile));
    
    // Start point
    points.push({ x: baseX, y: baseY });

    // Generate intermediate points with smaller, controlled variation
    for (let i = 1; i < 5; i++) {
      const progress = i / 4;
      const variation = 2.5;
      const x = Math.min(100, Math.max(0, baseX + Math.sin(progress * Math.PI) * variation));
      const y = Math.min(100, Math.max(0, baseY + Math.cos(progress * Math.PI) * variation));
      points.push({ x, y });
    }

    // End point (same as start for loop animation)
    points.push({ x: baseX, y: baseY });

    return points;
  };

  // Animation effect
  useEffect(() => {
    if (isPlaying && selectedProvider) {
      const provider = data.find(p => p.id === selectedProvider);
      if (!provider) return;

      if (pathPoints.current.length === 0) {
        pathPoints.current = generatePathPoints(provider);
      }

      const animate = () => {
        setTimeout(() => {
          setAnimationFrame(prev => (prev + 1) % (pathPoints.current.length * 12));
          if (isPlaying) {
            animationRef.current = requestAnimationFrame(animate);
          }
        }, 30);
      };

      animationRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    } else {
      setAnimationFrame(0);
      pathPoints.current = [];
    }
  }, [isPlaying, selectedProvider, data]);

  // Get animated provider data
  const getAnimatedProviderData = (): Provider[] => {
    if (!selectedProvider || !isPlaying || pathPoints.current.length === 0) return data;

    const provider = data.find(p => p.id === selectedProvider);
    if (!provider) return data;

    const pointIndex = Math.floor(animationFrame / 12);
    const progress = (animationFrame % 12) / 12;
    
    const currentPoint = pathPoints.current[pointIndex];
    if (!currentPoint) return data;
    
    const nextPointIndex = (pointIndex + 1) % pathPoints.current.length;
    const nextPoint = pathPoints.current[nextPointIndex];
    if (!nextPoint) return data;

    const currentPosition = {
      x: currentPoint.x + (nextPoint.x - currentPoint.x) * progress,
      y: currentPoint.y + (nextPoint.y - currentPoint.y) * progress
    };

    return data.map(p => {
      if (p.id !== selectedProvider) {
        return {
          ...p,
          color: 'rgba(200, 200, 200, 0.2)',
          size: 4
        };
      }

      const trail: AnimatedProvider[] = [];
      const trailStartIndex = Math.max(0, pointIndex - 5);
      
      for (let i = trailStartIndex; i <= pointIndex; i++) {
        const trailPoint = pathPoints.current[i];
        if (!trailPoint) continue;
        
        const opacity = (i - trailStartIndex) / 5;
        trail.push({
          ...provider,
          id: `${provider.id}-trail-${i}`,
          wrvuPercentile: trailPoint.x,
          compPercentile: trailPoint.y,
          color: `rgba(16, 185, 129, ${opacity})`,
          size: i === pointIndex ? 8 : 4
        });
      }

      trail.push({
        ...provider,
        id: `${provider.id}-current`,
        wrvuPercentile: currentPosition.x,
        compPercentile: currentPosition.y,
        color: '#10b981',
        size: 8
      });

      return trail;
    }).flat() as Provider[];
  };

  // Use animated data for scatter plot only
  const displayData = isPlaying && selectedProvider ? getAnimatedProviderData() : data;

  // Use original data for the table
  const tableData = data;

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
      analysisRange: 'All Providers',
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
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{data.length} Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-muted-foreground">{data.filter(p => Math.abs(p.analysis.gap) <= 15).length} Aligned</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">{data.filter(p => p.analysis.gap > 15).length} Over Comp.</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">{data.filter(p => p.analysis.gap < -15).length} Under Comp.</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {/* Filters */}
          <div>
            <div className="rounded-lg bg-background border shadow-sm">
              <button 
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className="w-full flex items-center justify-between py-2 px-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4" />
                  <h2 className="text-sm font-semibold">Filters</h2>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {isFiltersVisible ? "Hide" : "Show"}
                  </span>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isFiltersVisible ? "transform rotate-180" : ""
                    )}
                  />
                </div>
              </button>

              {/* Collapsible Filter Section */}
              {isFiltersVisible && (
                <div className="px-4 pb-4 border-t">
                  <div className="grid grid-cols-5 gap-6 pt-4">
                    {/* YTD Month Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">YTD Month</label>
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
                    </div>

                    {/* Specialty Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Specialty</label>
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
                    </div>

                    {/* Department Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Department</label>
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
                    </div>

                    {/* Comp Model Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Comp Model</label>
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
                    </div>

                    {/* Analysis Range Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Analysis Range</label>
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
                            preset.label === "Market Competitive (40th-60th)" ? (
                              <React.Fragment key={preset.label}>
                                <SelectItem value={preset.label}>
                                  {preset.label}
                                </SelectItem>
                                <SelectSeparator className="my-2" />
                                <div className="px-2 text-sm text-muted-foreground">Alignment Analysis</div>
                              </React.Fragment>
                            ) : (
                              <SelectItem key={preset.label} value={preset.label}>
                                {preset.label}
                              </SelectItem>
                            )
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {activeFilterCount > 0 && (
                    <div className="mt-4 flex justify-end">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-8 text-muted-foreground hover:text-foreground"
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Timeline and Scatter Plot Combined */}
      <div className="px-6 mt-6">
        <Card className="overflow-hidden">
          <CardHeader className="py-2 px-6 border-b bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Performance Timeline</CardTitle>
                <CardDescription className="text-xs">
                  {isPlaying 
                    ? `Analyzing ${months[Math.floor((animationFrame / (pathPoints.current.length * 12)) * 12)]} 2025`
                    : 'Analyze provider performance trends over time'
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Select
                  value={selectedProvider}
                  onValueChange={(value) => {
                    setSelectedProvider(value);
                    setIsPlaying(false);
                  }}
                >
                  <SelectTrigger className="w-[240px] h-9">
                    <SelectValue placeholder="Select a provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2">
                      <Input
                        placeholder="Search providers..."
                        className="h-8 mb-2"
                        onChange={(e) => {
                          const searchInput = e.target.value.toLowerCase();
                          const filteredProviders = data.filter(provider =>
                            provider.name.toLowerCase().includes(searchInput)
                          );
                          // Update the visible options
                          e.currentTarget.closest('.select-content')
                            ?.querySelectorAll('.select-item')
                            ?.forEach(item => {
                              const shouldShow = filteredProviders.some(
                                p => p.id === item.getAttribute('data-value')
                              );
                              (item as HTMLElement).style.display = shouldShow ? 'block' : 'none';
                            });
                        }}
                      />
                    </div>
                    <SelectGroup className="max-h-[200px] overflow-auto">
                      {data.map((provider) => (
                        <SelectItem
                          key={provider.id}
                          value={provider.id}
                          className="cursor-pointer"
                        >
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedProvider && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Range Controls and Legend */}
          <div className="py-3 px-6 border-b bg-muted/40">
            <div className="flex items-center justify-between">
              {/* Range Controls */}
              <div className="flex gap-8">
                <div className="w-[240px] space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-muted-foreground">wRVU Range</label>
                    <span className="text-xs text-muted-foreground">
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
                    <label className="text-xs font-medium text-muted-foreground">Compensation Range</label>
                    <span className="text-xs text-muted-foreground">
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
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
          </div>

          {/* Scatter Plot */}
          <CardContent className="p-6">
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
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterPlot 
                      data={displayData}
                      xAxisKey="wrvuPercentile"
                      yAxisKey="compPercentile"
                      xAxisLabel="YTD Productivity Percentile"
                      yAxisLabel="Compensation Percentile"
                      tooltipLabel="Provider"
                      hideRightLabel={true}
                      hideMedianLabel={true}
                      xAxisLabelOffset={40}
                      medianXLabel="Median Productivity"
                      medianYLabel="Median Compensation"
                      medianLabelsPosition="outside"
                    />
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Details */}
      <div className="px-6">
        <Card className="mt-4 overflow-hidden">
          <CardHeader className="py-2 px-6 border-b bg-muted/40">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Provider Details</CardTitle>
                <CardDescription className="text-xs">
                  Detailed performance metrics by provider
                </CardDescription>
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
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead className="border-b sticky top-0 bg-white">
                  <tr>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600 py-4 px-6 bg-gray-100/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b-2 border-gray-200">Provider</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600 py-4 px-6 bg-gray-100/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b-2 border-gray-200">Specialty</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600 py-4 px-6 bg-gray-100/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b-2 border-gray-200">Comp Model</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-600 py-4 px-6 bg-gray-100/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b-2 border-gray-200">FTE</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-600 py-4 px-6 bg-gray-100/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b-2 border-gray-200">WRVU %</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-600 py-4 px-6 bg-gray-100/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b-2 border-gray-200">Comp %</th>
                    <th className="text-right text-xs font-semibold uppercase tracking-wider text-gray-600 py-4 px-6 bg-gray-100/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b-2 border-gray-200">Gap</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-gray-600 py-4 px-6 bg-gray-100/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b-2 border-gray-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tableData.map((provider, index) => (
                    <tr 
                      key={provider.id} 
                      className={cn(
                        "group transition-colors cursor-pointer",
                        "bg-white",
                        selectedProvider === provider.id && "bg-emerald-50/50 hover:bg-emerald-50/70",
                        selectedProvider !== provider.id && "hover:bg-gray-100/80"
                      )}
                      onClick={() => {
                        setSelectedProvider(provider.id);
                        setIsPlaying(false);
                      }}
                    >
                      <td className="py-2.5 px-6 text-sm">
                        <a 
                          href={`/provider/${provider.employeeId}`}
                          className={cn(
                            "font-medium transition-colors hover:underline",
                            selectedProvider === provider.id ? "text-emerald-600" : "text-blue-600",
                            "group-hover:text-emerald-600"
                          )}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click when clicking the link
                          }}
                        >
                          {provider.name}
                        </a>
                      </td>
                      <td className="py-2.5 px-6 text-sm text-gray-600">{provider.specialty}</td>
                      <td className="py-2.5 px-6 text-sm text-gray-600">{provider.compModel}</td>
                      <td className="py-2.5 px-6 text-sm text-gray-900 font-medium text-right tabular-nums">{provider.fte.toFixed(2)}</td>
                      <td className="py-2.5 px-6 text-sm text-gray-900 font-medium text-right tabular-nums">
                        <span title={`WRVU Percentile: ${formatNumber(provider.wrvuPercentile)}%`}>
                          {formatNumber(provider.wrvuPercentile)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-6 text-sm text-gray-900 font-medium text-right tabular-nums">
                        <span title={`Compensation Percentile: ${formatNumber(provider.compPercentile)}%`}>
                          {formatNumber(provider.compPercentile)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-6 text-sm font-medium text-right tabular-nums">
                        <span 
                          className={cn(
                            "transition-colors px-2 py-0.5 rounded",
                            provider.analysis.gap > 0 
                              ? "text-emerald-700 bg-emerald-50" 
                              : "text-red-700 bg-red-50"
                          )}
                          title={`Gap: ${formatNumber(provider.analysis.gap)}%`}
                        >
                          {formatNumber(provider.analysis.gap)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-6">
                        <span 
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-all",
                            selectedProvider === provider.id && "ring-2 ring-offset-2",
                            provider.analysis.category === "Aligned" && "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
                            provider.analysis.category === "Over Compensated" && "bg-red-50 text-red-700 ring-red-500/20",
                            provider.analysis.category === "Under Compensated" && "bg-amber-50 text-amber-700 ring-amber-500/20"
                          )}
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
};

export default ProductivityPage;