'use client';

import * as React from "react";
import { useState } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";

interface DataPoint {
  id: string;
  name: string;
  specialty: string;
  department?: string;
  wrvus: number;
  target: number;
  wrvuPercentile: number;
  compPercentile: number;
  compensation: number;
  color: string;
  size: number;
  analysis: {
    category: string;
    gap: number;
  };
}

interface ScatterPlotProps {
  data: DataPoint[];
  xAxisKey: string;
  yAxisKey: string;
  xAxisLabel: string;
  yAxisLabel: string;
}

interface RangeState {
  wrvu: [number, number];
  comp: [number, number];
}

const PERCENTILE_PRESETS = [
  {
    label: "All Providers",
    wrvu: [0, 100],
    comp: [0, 100],
    description: "View the full range of provider performance"
  },
  {
    label: "High Performers",
    wrvu: [75, 100],
    comp: [75, 100],
    description: "Focus on providers in the top quartile for both metrics"
  },
  {
    label: "Market Competitive",
    wrvu: [40, 60],
    comp: [40, 60],
    description: "View providers near median performance"
  },
  {
    label: "Low Performers",
    wrvu: [0, 25],
    comp: [0, 25],
    description: "Identify providers needing performance improvement"
  }
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white rounded-lg shadow-lg p-4" style={{ minWidth: '280px' }}>
        {/* Header */}
        <div className="mb-4">
          <div className="text-[15px] font-medium text-gray-900">{data.name}</div>
          <div className="text-[13px] text-gray-500">{data.specialty}</div>
        </div>

        {/* Main Content */}
        <div className="space-y-3">
          {/* wRVUs & Target Row */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-[13px] text-gray-600 mb-1">YTD wRVUs</div>
              <div className="text-[15px] font-medium text-gray-900">{data.wrvus.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[13px] text-gray-600 mb-1">YTD Target</div>
              <div className="text-[15px] font-medium text-gray-900">{data.target.toLocaleString()}</div>
            </div>
          </div>

          {/* Compensation */}
          <div>
            <div className="text-[13px] text-gray-600 mb-1">YTD Comp</div>
            <div className="text-[15px] font-medium text-gray-900">
              {data.compensation.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          </div>

          {/* Percentiles Row */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-[13px] text-gray-600 mb-1">wRVU %ile</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-medium text-gray-900">{data.wrvuPercentile.toFixed(1)}%</span>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  data.wrvuPercentile >= 75 ? 'bg-emerald-500' :
                  data.wrvuPercentile >= 50 ? 'bg-blue-500' :
                  'bg-amber-500'
                }`} />
              </div>
            </div>
            <div>
              <div className="text-[13px] text-gray-600 mb-1">Comp %ile</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-medium text-gray-900">{data.compPercentile.toFixed(1)}%</span>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  data.compPercentile >= 75 ? 'bg-emerald-500' :
                  data.compPercentile >= 50 ? 'bg-blue-500' :
                  'bg-amber-500'
                }`} />
              </div>
            </div>
          </div>

          {/* Gap Analysis */}
          <div className="pt-3 border-t border-gray-100">
            <div className="text-[13px] text-gray-600 mb-1">Percentile Gap</div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[15px] font-medium ${
                data.analysis.category === 'Aligned' ? 'text-emerald-600' :
                data.analysis.category === 'Over Compensated' ? 'text-red-600' :
                'text-amber-600'
              }`}>
                {data.analysis.gap > 0 ? '+' : ''}{data.analysis.gap.toFixed(1)}%
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${
                data.analysis.category === 'Aligned' ? 'bg-emerald-500' :
                data.analysis.category === 'Over Compensated' ? 'bg-red-500' :
                'bg-amber-500'
              }`} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ScatterPlot = React.forwardRef<HTMLDivElement, ScatterPlotProps>(
  ({ data, xAxisKey, yAxisKey, xAxisLabel, yAxisLabel }, ref) => {
    return (
      <div ref={ref} className="h-full flex flex-col">
        <p className="text-sm text-muted-foreground mb-4">
          Compare annualized YTD productivity percentiles against compensation percentiles to identify alignment
        </p>

        <div className="relative flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 40, right: 40, bottom: 40, left: 40 }}>
              {/* Background grid */}
              <CartesianGrid 
                strokeDasharray="2 2" 
                stroke="#f1f5f9" 
                horizontal={true}
                vertical={true}
                horizontalPoints={[0, 50, 100]}
                verticalPoints={[0, 50, 100]}
              />

              {/* Quadrant reference lines */}
              <ReferenceLine
                y={50}
                stroke="#e2e8f0"
                strokeWidth={1}
                label={{
                  value: "Median Compensation",
                  position: "right",
                  fill: "#64748b",
                  fontSize: 11,
                  fontWeight: 500
                }}
              />
              <ReferenceLine
                x={50}
                stroke="#e2e8f0"
                strokeWidth={1}
                label={{
                  value: "Median Productivity",
                  position: "top",
                  fill: "#64748b",
                  fontSize: 11,
                  fontWeight: 500
                }}
              />

              {/* Perfect alignment diagonal */}
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 100, y: 100 }
                ]}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                label={{
                  value: "Perfect Alignment",
                  position: "insideTopRight",
                  fill: "#64748b",
                  fontSize: 11,
                  fontWeight: 500
                }}
              />

              {/* Quadrant labels */}
              <text x="25%" y="25%" textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={500}>
                <tspan x="25%" dy="-10">Low Productivity</tspan>
                <tspan x="25%" dy="20">Low Compensation</tspan>
              </text>
              <text x="75%" y="25%" textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={500}>
                <tspan x="75%" dy="-10">High Productivity</tspan>
                <tspan x="75%" dy="20">Low Compensation</tspan>
              </text>
              <text x="25%" y="75%" textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={500}>
                <tspan x="25%" dy="-10">Low Productivity</tspan>
                <tspan x="25%" dy="20">High Compensation</tspan>
              </text>
              <text x="75%" y="75%" textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={500}>
                <tspan x="75%" dy="-10">High Productivity</tspan>
                <tspan x="75%" dy="20">High Compensation</tspan>
              </text>

              <XAxis
                type="number"
                dataKey={xAxisKey}
                name={xAxisLabel}
                unit="%"
                domain={[0, 100]}
                tickCount={5}
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                tickFormatter={(value) => `${value}%`}
                stroke="#e2e8f0"
                label={{
                  value: xAxisLabel,
                  position: "bottom",
                  offset: 24,
                  fill: "#64748b",
                  fontSize: 11,
                  fontWeight: 500
                }}
              />
              <YAxis
                type="number"
                dataKey={yAxisKey}
                name={yAxisLabel}
                unit="%"
                domain={[0, 100]}
                tickCount={5}
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                tickFormatter={(value) => `${value}%`}
                stroke="#e2e8f0"
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: "left",
                  offset: 28,
                  fill: "#64748b",
                  fontSize: 11,
                  fontWeight: 500
                }}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Scatter 
                data={data} 
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <g>
                      {/* Subtle outer glow */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={8}
                        fill={payload.color}
                        fillOpacity={0.08}
                        style={{
                          filter: 'blur(4px)',
                        }}
                      />
                      {/* Inner glow */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={6}
                        fill={payload.color}
                        fillOpacity={0.12}
                        style={{
                          filter: 'blur(2px)',
                        }}
                      />
                      {/* Main point */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill={payload.color}
                        fillOpacity={1}
                        stroke="white"
                        strokeWidth={1.5}
                        style={{ 
                          cursor: 'pointer',
                          transformOrigin: 'center',
                          transition: 'all 0.2s ease-out',
                          filter: 'drop-shadow(0 2px 4px rgb(0 0 0 / 0.1))'
                        }}
                      />
                    </g>
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
);

ScatterPlot.displayName = "ScatterPlot";

export default ScatterPlot; 