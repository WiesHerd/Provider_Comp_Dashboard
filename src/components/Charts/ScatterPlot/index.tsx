'use client';

import * as React from "react";
import { useState } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";

interface DataPoint {
  id: string;
  name: string;
  specialty: string;
  department: string;
  productivity: {
    actual: number;
    target: number;
    percentile: number;
  };
  compensation: {
    total: number;
    percentile: number;
  };
  analysis: {
    category: string;
    gap: number;
  };
}

interface ScatterPlotProps {
  data: DataPoint[];
  xKey: string;
  yKey: string;
  tooltipFormatter?: (data: DataPoint) => {
    title: string;
    items: Array<{ label: string; value: string }>;
  };
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

const ScatterPlot = React.forwardRef<HTMLDivElement, ScatterPlotProps>(
  ({ data, xKey, yKey, tooltipFormatter }, ref) => {
    return (
      <div className="space-y-6" ref={ref}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Compare annualized YTD productivity percentiles against compensation percentiles to identify alignment
            </p>
          </div>
        </div>

        <div className="relative h-[600px] border rounded-lg p-4">
          <div className="absolute top-4 right-4 flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10b981]" />
              <span className="text-sm">Aligned (±15%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
              <span className="text-sm">Over Compensated (&gt;15%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
              <span className="text-sm">Under Compensated (&lt;-15%)</span>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey={xKey}
                name="Productivity Percentile"
                unit="%"
                domain={[0, 100]}
              />
              <YAxis
                type="number"
                dataKey={yKey}
                name="Compensation Percentile"
                unit="%"
                domain={[0, 100]}
              />
              <Tooltip content={tooltipFormatter ? undefined : undefined} />
              <Scatter data={data} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
);

ScatterPlot.displayName = "ScatterPlot";

export default ScatterPlot; 