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
import { DualRangeSlider } from "@/components/ui/dual-range-slider";

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
      <div className="bg-white p-6 border border-gray-100 rounded-lg shadow-2xl">
        <div className="space-y-5">
          <div>
            <p className="font-semibold text-sm tracking-tight text-gray-900 mb-1">{data.name}</p>
            <p className="text-xs text-muted-foreground tracking-tight">{data.specialty}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-x-10 gap-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">wRVUs</p>
              <p className="text-sm font-medium tabular-nums tracking-tight">{formatNumber(data.productivity.actualWRVUs)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Target</p>
              <p className="text-sm font-medium tabular-nums tracking-tight">{formatNumber(data.productivity.targetWRVUs)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Comp Percentile</p>
              <p className="text-sm font-medium tabular-nums tracking-tight">{formatNumber(data.compensation.percentile)}%</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">wRVU Percentile</p>
              <p className="text-sm font-medium tabular-nums tracking-tight">{formatNumber(data.productivity.percentile)}%</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Status</p>
              <span 
                className="text-[11px] font-medium rounded-full px-3 py-1"
                style={{ 
                  backgroundColor: `${data.color}12`,
                  color: data.color,
                  boxShadow: `0 0 0 1px ${data.color}25`
                }}
              >
                {data.analysis.performanceCategory}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Percentile Gap</p>
              <p className="text-sm font-semibold tabular-nums tracking-tight" style={{ color: data.color }}>
                {formatNumber(data.analysis.percentileGap)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

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

export default function ScatterPlot({
  data,
  xAxisKey,
  yAxisKey,
  xAxisLabel,
  yAxisLabel,
  tooltipLabel,
  onRangeChange
}: ScatterPlotProps) {
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 45, right: 180, bottom: 85, left: 100 }}>
        {/* Ultra-refined background grid */}
        <CartesianGrid strokeDasharray="2 4" stroke="#e2e8f0" opacity={0.07} />
        
        {/* Enhanced Median Lines */}
        <ReferenceLine
          y={50}
          stroke="#94a3b8"
          strokeDasharray="8 8"
          opacity={0.2}
          label={{
            value: "Median Compensation",
            position: "right",
            fill: "#334155",
            fontSize: 11,
            offset: 35,
            fontWeight: 500,
            letterSpacing: "0.02em"
          }}
        />
        <ReferenceLine
          x={50}
          stroke="#94a3b8"
          strokeDasharray="8 8"
          opacity={0.2}
          label={{
            value: "Median Productivity",
            position: "top",
            fill: "#334155",
            fontSize: 11,
            offset: 15,
            fontWeight: 500,
            letterSpacing: "0.02em"
          }}
        />

        {/* Perfect Alignment Line */}
        <ReferenceLine
          segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]}
          stroke="#94a3b8"
          strokeDasharray="8 8"
          opacity={0.15}
          label={{
            value: "Perfect Alignment",
            position: "insideTopLeft",
            fill: "#334155",
            fontSize: 11,
            offset: 25,
            fontWeight: 500,
            letterSpacing: "0.02em"
          }}
        />

        <XAxis
          type="number"
          dataKey={xAxisKey}
          name={xAxisLabel}
          unit="%"
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
          tickLine={{ stroke: '#94a3b8', opacity: 0.3, strokeWidth: 1.5 }}
          axisLine={{ stroke: '#94a3b8', opacity: 0.3, strokeWidth: 1.5 }}
          label={{
            value: xAxisLabel,
            position: "bottom",
            offset: 60,
            fill: "#1e293b",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em"
          }}
        />
        <YAxis
          type="number"
          dataKey={yAxisKey}
          name={yAxisLabel}
          unit="%"
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          tick={{ fontSize: 11, fill: '#334155', fontWeight: 500 }}
          tickLine={{ stroke: '#94a3b8', opacity: 0.3, strokeWidth: 1.5 }}
          axisLine={{ stroke: '#94a3b8', opacity: 0.3, strokeWidth: 1.5 }}
          label={{
            value: yAxisLabel,
            angle: -90,
            position: "left",
            offset: 65,
            fill: "#1e293b",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.02em"
          }}
        />
        
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ strokeDasharray: '4 4', strokeOpacity: 0.1, strokeWidth: 1.5 }}
        />
        
        {/* Premium Scatter Points */}
        <Scatter
          data={data}
          shape={(props: any) => {
            const { cx, cy, payload } = props;
            const isHovered = payload.name === hoveredPoint;
            const baseRadius = 5.5; // Slightly larger base size
            return (
              <g>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? baseRadius * 1.6 : baseRadius}
                  fill={payload.color}
                  fillOpacity={isHovered ? 1 : 0.92}
                  stroke={payload.color}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  style={{ 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    filter: isHovered ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none'
                  }}
                />
                {isHovered && (
                  <>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={baseRadius * 2.4}
                      fill="none"
                      stroke={payload.color}
                      strokeWidth={2}
                      strokeOpacity={0.25}
                      style={{
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={baseRadius * 3.2}
                      fill="none"
                      stroke={payload.color}
                      strokeWidth={1}
                      strokeOpacity={0.12}
                      style={{
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    />
                  </>
                )}
              </g>
            );
          }}
          onMouseEnter={(data) => setHoveredPoint(data.name)}
          onMouseLeave={() => setHoveredPoint(null)}
        />

        {/* Refined Quadrant Labels */}
        <text x="25%" y="25%" textAnchor="middle" fill="#334155" fontSize={11} dy={-30} opacity={0.95} fontWeight={600} letterSpacing="0.02em">
          Low Productivity
          <tspan x="25%" dy={18} fontSize={11} fontWeight={500} opacity={0.8}>High Compensation</tspan>
        </text>
        <text x="75%" y="25%" textAnchor="middle" fill="#334155" fontSize={11} dy={-30} opacity={0.95} fontWeight={600} letterSpacing="0.02em">
          High Productivity
          <tspan x="75%" dy={18} fontSize={11} fontWeight={500} opacity={0.8}>Low Compensation</tspan>
        </text>
        <text x="25%" y="75%" textAnchor="middle" fill="#334155" fontSize={11} dy={-30} opacity={0.95} fontWeight={600} letterSpacing="0.02em">
          Low Productivity
          <tspan x="25%" dy={18} fontSize={11} fontWeight={500} opacity={0.8}>Low Compensation</tspan>
        </text>
        <text x="75%" y="75%" textAnchor="middle" fill="#334155" fontSize={11} dy={-30} opacity={0.95} fontWeight={600} letterSpacing="0.02em">
          High Productivity
          <tspan x="75%" dy={18} fontSize={11} fontWeight={500} opacity={0.8}>High Compensation</tspan>
        </text>
      </ScatterChart>
    </ResponsiveContainer>
  );
} 