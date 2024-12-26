'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { formatNumber } from '@/utils/formatters';

interface WRVUChartProps {
  actualWRVUs: number[];
  targetWRVUs: number[];
  months: string[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-sm border border-gray-100 shadow-lg rounded-lg p-4">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-sm mr-2"></span>
            Actual: {formatNumber(payload[0].value)}
          </p>
          <p className="text-sm text-gray-600">
            <span className="inline-block w-3 h-3 bg-blue-900 rounded-sm mr-2"></span>
            Target: {formatNumber(payload[1].value)}
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const WRVUChart: React.FC<WRVUChartProps> = ({ actualWRVUs, targetWRVUs, months }) => {
  const data = months.map((month, index) => ({
    month,
    actualWRVUs: actualWRVUs[index],
    targetWRVUs: targetWRVUs[index]
  }));

  const maxValue = Math.max(
    Math.max(...actualWRVUs),
    Math.max(...targetWRVUs)
  );
  const yAxisMax = Math.ceil(maxValue / 100) * 100;

  return (
    <div className="w-full h-[400px] bg-white rounded-xl p-6">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 50, bottom: 30 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false}
            stroke="#E5E7EB"
            strokeOpacity={0.8}
          />
          <XAxis 
            dataKey="month" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            dx={-10}
            tickFormatter={(value) => value.toFixed(2)}
            domain={[0, yAxisMax]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top"
            height={36}
            iconSize={8}
            iconType="circle"
            wrapperStyle={{
              paddingBottom: '20px',
            }}
          />
          <Bar
            dataKey="actualWRVUs"
            name="Actual wRVUs"
            fill="#3B82F6"
            radius={[2, 2, 0, 0]}
            barSize={24}
          />
          <Line
            dataKey="targetWRVUs"
            name="Target wRVUs"
            stroke="#1E40AF"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WRVUChart; 