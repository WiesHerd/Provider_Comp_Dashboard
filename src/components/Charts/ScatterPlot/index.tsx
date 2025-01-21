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

export const ScatterPlot = React.forwardRef<HTMLDivElement, ScatterPlotProps>(
  ({ data, xKey, yKey, tooltipFormatter }, ref) => {
    const [range, setRange] = useState<RangeState>({
      wrvu: [0, 100],
      comp: [0, 100]
    });
    const [selectedPreset, setSelectedPreset] = useState("All Providers");

    const handlePresetChange = (preset: string) => {
      const selectedPreset = PERCENTILE_PRESETS.find(p => p.label === preset);
      if (selectedPreset) {
        setRange({
          wrvu: selectedPreset.wrvu,
          comp: selectedPreset.comp
        });
      }
    };

    const handleRangeChange = (type: keyof RangeState, value: [number, number]) => {
      setRange(prev => ({
        ...prev,
        [type]: value
      }));
    };

    const filteredData = data.filter(d => {
      const wrvuInRange = d.productivity.percentile >= range.wrvu[0] && d.productivity.percentile <= range.wrvu[1];
      const compInRange = d.compensation.percentile >= range.comp[0] && d.compensation.percentile <= range.comp[1];
      return wrvuInRange && compInRange;
    });

    return (
      <div className="space-y-6" ref={ref}>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Compare annualized YTD productivity percentiles against compensation percentiles to identify alignment
            </p>
          </div>
          <Select
            value={selectedPreset}
            onValueChange={(value) => handlePresetChange(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select analysis range" />
            </SelectTrigger>
            <SelectContent>
              {PERCENTILE_PRESETS.map((preset) => (
                <SelectItem key={preset.label} value={preset.label}>
                  <div className="flex flex-col">
                    <span>{preset.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {preset.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">wRVU Percentile Range</label>
              <span className="text-sm text-muted-foreground">
                {range.wrvu[0]}% - {range.wrvu[1]}%
              </span>
            </div>
            <DualRangeSlider
              value={range.wrvu}
              onValueChange={(value) => handleRangeChange('wrvu', value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Bottom Performers</span>
              <span>Median</span>
              <span>Top Performers</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Compensation Percentile Range</label>
              <span className="text-sm text-muted-foreground">
                {range.comp[0]}% - {range.comp[1]}%
              </span>
            </div>
            <DualRangeSlider
              value={range.comp}
              onValueChange={(value) => handleRangeChange('comp', value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Below Market</span>
              <span>Market Rate</span>
              <span>Above Market</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm">
            <strong>Selected:</strong> {filteredData.length} providers
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePresetChange("All Providers")}
          >
            Reset Ranges
          </Button>
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
            {/* ... existing scatter plot code ... */}
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
); 