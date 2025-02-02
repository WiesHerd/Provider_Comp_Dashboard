import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, ReferenceLine } from 'recharts';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

interface ChartProps {
  data: Array<{
    category: string;
    provider1Value: number;
    provider2Value: number;
    format: 'currency' | 'number' | 'percent';
    benchmark?: number;
  }>;
  provider1Name: string;
  provider2Name: string;
}

const formatters = {
  currency: formatCurrency,
  number: formatNumber,
  percent: formatPercent,
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const format = payload[0].payload.format;
    const formatter = formatters[format];
    const benchmark = payload[0].payload.benchmark;
    
    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-medium mb-3">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted-foreground">{entry.name}</span>
              </div>
              <span className="text-sm font-medium">{formatter(entry.value)}</span>
            </div>
          ))}
          {benchmark !== undefined && (
            <div className="pt-2 mt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Benchmark</span>
                <span className="text-sm font-medium">{formatter(benchmark)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const ComparisonChart: FC<ChartProps> = ({ data, provider1Name, provider2Name }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Performance Overview</span>
          <div className="flex items-center gap-4 text-sm font-normal">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
              {provider1Name}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-600"></div>
              {provider2Name}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
              barGap={0}
              barCategoryGap="20%"
            >
              <XAxis 
                dataKey="category" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={(value) => {
                  const format = data[0]?.format || 'number';
                  return formatters[format](value);
                }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top"
                height={36}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
              {data.map((item) => (
                item.benchmark !== undefined && (
                  <ReferenceLine
                    key={`benchmark-${item.category}`}
                    y={item.benchmark}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    label={{
                      position: 'right',
                      value: formatters[item.format](item.benchmark),
                      fontSize: 12,
                      fill: '#94a3b8'
                    }}
                  />
                )
              ))}
              <Bar
                dataKey="provider1Value"
                name={provider1Name}
                fill="#818cf8"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
              <Bar
                dataKey="provider2Value"
                name={provider2Name}
                fill="#34d399"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}; 
