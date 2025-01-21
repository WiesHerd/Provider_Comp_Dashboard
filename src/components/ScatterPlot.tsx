'use client';

import { useMemo, useState } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  TooltipProps,
  ReferenceArea,
} from 'recharts';
import { formatNumber, formatPercent } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataPoint {
  id: string;
  name: string;
  specialty: string;
  xValue: number;
  yValue: number;
  color: string;
  size: number;
  productivity: {
    actualWRVUs: number;
    targetWRVUs: number;
    percentile: number;
  };
  compensation: {
    total: number;
    percentile: number;
  };
  analysis: {
    percentileGap: number;
    performanceCategory: string;
  };
}

interface ScatterPlotProps {
  data: DataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  xAxisLabel: string;
  yAxisLabel: string;
  tooltipLabel: string;
  onRangeChange?: (range: { 
    wrvuRange: [number, number], 
    compRange: [number, number] 
  }) => void;
}

interface RangeState {
  wrvu: [number, number];
  comp: [number, number];
}

const CustomTooltip = ({ active, payload }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
        <p className="font-medium text-lg mb-2">{data.name}</p>
        <p className="text-sm text-gray-600 mb-1">{data.specialty}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
          <div>
            <p className="text-sm text-gray-500">wRVUs</p>
            <p className="font-medium">{formatNumber(data.productivity.actualWRVUs)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Target</p>
            <p className="font-medium">{formatNumber(data.productivity.targetWRVUs)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Comp Percentile</p>
            <p className="font-medium">{formatNumber(data.compensation.percentile)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">wRVU Percentile</p>
            <p className="font-medium">{formatNumber(data.productivity.percentile)}%</p>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-sm font-medium" style={{ color: data.color }}>
            {data.analysis.performanceCategory}
          </p>
          <p className="text-sm text-gray-600">
            Gap: {formatNumber(data.analysis.percentileGap)}%
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// Add statistical presets
const PERCENTILE_PRESETS = [
  { label: "All Providers", wrvu: [0, 100], comp: [0, 100] },
  { label: "Top Quartile (75th-100th)", wrvu: [75, 100], comp: [75, 100] },
  { label: "Middle Half (25th-75th)", wrvu: [25, 75], comp: [25, 75] },
  { label: "Bottom Quartile (0-25th)", wrvu: [0, 25], comp: [0, 25] },
  { label: "High Performers (>50th)", wrvu: [50, 100], comp: [0, 100] },
  { label: "Low Performers (<50th)", wrvu: [0, 50], comp: [0, 100] },
  { label: "Market Competitive (40th-60th)", wrvu: [40, 60], comp: [40, 60] },
] as const;

export default function ScatterPlot({
  data,
  xAxisKey,
  yAxisKey,
  xAxisLabel,
  yAxisLabel,
  onRangeChange
}: ScatterPlotProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  const [ranges, setRanges] = useState<RangeState>({
    wrvu: [0, 100],
    comp: [0, 100]
  });
  
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      [xAxisKey]: item.xValue,
      [yAxisKey]: item.yValue,
    }));
  }, [data, xAxisKey, yAxisKey]);

  // Calculate domain padding (5% of min/max values)
  const xValues = data.map(item => item.xValue);
  const yValues = data.map(item => item.yValue);
  
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  
  const xPadding = (xMax - xMin) * 0.05;
  const yPadding = (yMax - yMin) * 0.05;

  // Add quadrant labels
  const quadrantLabels = [
    { x: 75, y: 75, text: "High Productivity\nHigh Compensation" },
    { x: 25, y: 75, text: "Low Productivity\nHigh Compensation" },
    { x: 75, y: 25, text: "High Productivity\nLow Compensation" },
    { x: 25, y: 25, text: "Low Productivity\nLow Compensation" }
  ];

  const handlePresetChange = (preset: typeof PERCENTILE_PRESETS[number]) => {
    const newRanges = {
      wrvu: preset.wrvu,
      comp: preset.comp
    };
    setRanges(newRanges);
    onRangeChange?.({
      wrvuRange: newRanges.wrvu,
      compRange: newRanges.comp
    });
  };

  const handleRangeChange = (type: 'wrvu' | 'comp', values: number[]) => {
    const newRanges = {
      ...ranges,
      [type]: values as [number, number]
    };
    setRanges(newRanges);
    onRangeChange?.({
      wrvuRange: newRanges.wrvu,
      compRange: newRanges.comp
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-lg border shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-medium text-gray-900">Percentile Range Analysis</h3>
          <Select
            onValueChange={(value) => {
              const preset = PERCENTILE_PRESETS.find(p => p.label === value);
              if (preset) handlePresetChange(preset);
            }}
          >
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select analysis range" />
            </SelectTrigger>
            <SelectContent>
              {PERCENTILE_PRESETS.map((preset) => (
                <SelectItem key={preset.label} value={preset.label}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                wRVU Percentile Range
              </label>
              <span className="text-sm text-gray-500">
                {ranges.wrvu[0]}% - {ranges.wrvu[1]}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[ranges.wrvu[0], ranges.wrvu[1]]}
              onValueChange={(values) => handleRangeChange('wrvu', values)}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Bottom Performers</span>
              <span>Median</span>
              <span>Top Performers</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Compensation Percentile Range
              </label>
              <span className="text-sm text-gray-500">
                {ranges.comp[0]}% - {ranges.comp[1]}%
              </span>
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[ranges.comp[0], ranges.comp[1]]}
              onValueChange={(values) => handleRangeChange('comp', values)}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Below Market</span>
              <span>Market Rate</span>
              <span>Above Market</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm text-gray-600">
            Selected: {data.filter(d => 
              d.xValue >= ranges.wrvu[0] && 
              d.xValue <= ranges.wrvu[1] && 
              d.yValue >= ranges.comp[0] && 
              d.yValue <= ranges.comp[1]
            ).length} providers
          </div>
          <Button
            variant="outline"
            onClick={() => handlePresetChange(PERCENTILE_PRESETS[0])}
            size="sm"
          >
            Reset Ranges
          </Button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={500}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            dataKey={xAxisKey}
            name={xAxisLabel}
            label={{ 
              value: xAxisLabel, 
              position: 'bottom', 
              offset: 30,
              style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14 }
            }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#94a3b8"
            tick={{ fill: '#64748b' }}
          />
          <YAxis
            type="number"
            dataKey={yAxisKey}
            name={yAxisLabel}
            label={{ 
              value: yAxisLabel, 
              angle: -90, 
              position: 'left', 
              offset: 40,
              style: { textAnchor: 'middle', fill: '#64748b', fontSize: 14 }
            }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#94a3b8"
            tick={{ fill: '#64748b' }}
          />
          
          {/* Reference Lines */}
          <ReferenceLine 
            x={50} 
            stroke="#94a3b8" 
            strokeDasharray="3 3" 
            label={{ 
              value: "Median", 
              position: "top",
              fill: "#64748b",
              fontSize: 12
            }} 
          />
          <ReferenceLine 
            y={50} 
            stroke="#94a3b8" 
            strokeDasharray="3 3" 
            label={{ 
              value: "Median", 
              position: "right",
              fill: "#64748b",
              fontSize: 12
            }} 
          />
          
          {/* Diagonal alignment line */}
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 100, y: 100 },
            ]}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label={{
              value: "Perfect Alignment",
              position: "insideTopLeft",
              fill: "#64748b",
              fontSize: 12
            }}
          />
          
          {/* Quadrant Labels */}
          {quadrantLabels.map((label, index) => (
            <text
              key={index}
              x={label.x + "%"}
              y={label.y + "%"}
              textAnchor="middle"
              fill="#64748b"
              fontSize={12}
              opacity={0.7}
            >
              {label.text.split('\n').map((line, i) => (
                <tspan key={i} x={label.x + "%"} dy={i === 0 ? 0 : 15}>
                  {line}
                </tspan>
              ))}
            </text>
          ))}

          {/* Range Selection Highlights */}
          <ReferenceArea
            x1={ranges.wrvu[0]}
            x2={ranges.wrvu[1]}
            y1={ranges.comp[0]}
            y2={ranges.comp[1]}
            fill="#3b82f6"
            fillOpacity={0.1}
            stroke="#3b82f6"
            strokeOpacity={0.3}
            strokeDasharray="3 3"
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ strokeDasharray: '3 3' }}
          />
          
          {/* Scatter points */}
          <Scatter
            data={processedData}
            shape={(props: any) => {
              const { cx, cy, payload } = props;
              const isHovered = payload.name === hoveredPoint;
              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 8 : 6}
                    fill={payload.color}
                    fillOpacity={isHovered ? 0.8 : 0.6}
                    stroke={payload.color}
                    strokeWidth={isHovered ? 2 : 1}
                    style={{ 
                      transition: 'all 0.2s ease-in-out',
                      cursor: 'pointer'
                    }}
                  />
                  {isHovered && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={12}
                      fill="none"
                      stroke={payload.color}
                      strokeWidth={1}
                      strokeOpacity={0.3}
                    />
                  )}
                </g>
              );
            }}
            onMouseEnter={(data) => setHoveredPoint(data.name)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
} 