'use client';

import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, TooltipProps } from 'recharts';
import { formatNumber } from '@/utils/formatters';

interface WRVUChartProps {
  actualWRVUs: number[];
  targetWRVUs: number[];
  months: string[];
}

const WRVUChart: React.FC<WRVUChartProps> = ({ actualWRVUs, targetWRVUs, months }) => {
  const data = months.map((month, index) => ({
    name: month,
    actualWRVUs: actualWRVUs[index],
    targetWRVUs: targetWRVUs[index]
  }));

  const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium">{formatNumber(entry.value as number)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-[500px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 60,
            bottom: 40
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false}
            stroke="#E5E7EB"
          />
          <XAxis 
            dataKey="name" 
            height={60}
            tick={{ 
              fill: '#4B5563',
              fontSize: 12,
              fontWeight: 500
            }}
            axisLine={{ stroke: '#9CA3AF' }}
            tickLine={{ stroke: '#9CA3AF' }}
          />
          <YAxis 
            width={80}
            tick={{ 
              fill: '#4B5563',
              fontSize: 12,
              fontWeight: 500
            }}
            axisLine={{ stroke: '#9CA3AF' }}
            tickLine={{ stroke: '#9CA3AF' }}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip content={CustomTooltip} />
          <Legend 
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={10}
            wrapperStyle={{
              paddingTop: '20px',
              fontWeight: 500
            }}
          />
          <Bar
            dataKey="actualWRVUs"
            name="Actual wRVUs"
            fill="#93C5FD"
            barSize={32}
            radius={[4, 4, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="targetWRVUs"
            name="Target wRVUs"
            stroke="#2563EB"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 6, fill: '#2563EB' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WRVUChart; 