import { FC } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';

interface MetricsProps {
  provider1: any;
  provider2: any;
  view: 'compensation' | 'productivity';
  selectedMonth: string;
}

export const ComparisonMetrics: FC<MetricsProps> = ({ provider1, provider2, view, selectedMonth }) => {
  const getMetricConfig = () => {
    if (view === 'compensation') {
      return [
        {
          section: 'Annual Compensation',
          metrics: [
            {
              label: 'Base Salary',
              value1: provider1.metrics.baseSalary,
              value2: provider2.metrics.baseSalary,
              formatter: formatCurrency,
              description: 'Annual base compensation rate'
            },
            {
              label: 'Monthly Base Rate',
              value1: provider1.metrics.monthlyBaseSalary,
              value2: provider2.metrics.monthlyBaseSalary,
              formatter: formatCurrency,
              description: 'Monthly base compensation rate'
            }
          ]
        },
        {
          section: 'Year-to-Date Compensation',
          metrics: [
            {
              label: 'YTD Base Compensation',
              value1: provider1.metrics.ytdBase,
              value2: provider2.metrics.ytdBase,
              formatter: formatCurrency,
              description: 'Year-to-date base compensation paid'
            },
            {
              label: 'YTD Incentive Pay',
              value1: provider1.metrics.ytdIncentives,
              value2: provider2.metrics.ytdIncentives,
              formatter: formatCurrency,
              description: 'Year-to-date productivity incentives'
            },
            {
              label: 'YTD Additional Pay',
              value1: provider1.metrics.ytdAdditionalPay,
              value2: provider2.metrics.ytdAdditionalPay,
              formatter: formatCurrency,
              description: 'Year-to-date additional compensation (call, admin, etc.)'
            },
            {
              label: 'Total YTD Compensation',
              value1: provider1.metrics.totalYTDCompensation,
              value2: provider2.metrics.totalYTDCompensation,
              formatter: formatCurrency,
              description: 'Total year-to-date compensation (all sources)',
              highlight: true
            }
          ]
        },
        {
          section: 'Market Position',
          metrics: [
            {
              label: 'Compensation Percentile',
              value1: provider1.metrics.compPercentile,
              value2: provider2.metrics.compPercentile,
              formatter: formatPercent,
              description: 'Total compensation relative to market median'
            },
            {
              label: 'Comp vs Productivity Gap',
              value1: provider1.metrics.productivityCompGap,
              value2: provider2.metrics.productivityCompGap,
              formatter: formatPercent,
              description: 'Gap between compensation and productivity percentiles',
              highlight: true
            }
          ]
        }
      ];
    }
    return [
      {
        section: 'Work RVU Performance',
        metrics: [
          {
            label: 'YTD Work RVUs',
            value1: provider1.metrics.ytdWRVUs,
            value2: provider2.metrics.ytdWRVUs,
            formatter: formatNumber,
            description: 'Year-to-date work RVUs generated'
          },
          {
            label: 'YTD WRVU Target',
            value1: provider1.metrics.ytdTargetWRVUs,
            value2: provider2.metrics.ytdTargetWRVUs,
            formatter: formatNumber,
            description: 'Expected year-to-date work RVUs'
          },
          {
            label: 'Target Achievement',
            value1: provider1.metrics.planProgress,
            value2: provider2.metrics.planProgress,
            formatter: formatPercent,
            description: 'Percent of expected WRVUs achieved',
            highlight: true
          }
        ]
      },
      {
        section: 'Productivity Analysis',
        metrics: [
          {
            label: 'WRVU Percentile',
            value1: provider1.metrics.wrvuPercentile,
            value2: provider2.metrics.wrvuPercentile,
            formatter: formatPercent,
            description: 'Work RVU production relative to market median'
          },
          {
            label: 'Monthly WRVU Rate',
            value1: provider1.metrics.monthlyWRVURate,
            value2: provider2.metrics.monthlyWRVURate,
            formatter: formatNumber,
            description: 'Average monthly work RVUs'
          },
          {
            label: 'Compensation per WRVU',
            value1: provider1.metrics.compensationPerWRVU,
            value2: provider2.metrics.compensationPerWRVU,
            formatter: formatCurrency,
            description: 'Total compensation per work RVU',
            highlight: true
          }
        ]
      }
    ];
  };

  return (
    <div className="space-y-8">
      {getMetricConfig().map((section) => (
        <Card key={section.section} className="overflow-hidden">
          <CardHeader className="bg-muted/50 pb-4">
            <CardTitle className="text-lg font-medium">{section.section}</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              {section.metrics.map((metric) => (
                <div 
                  key={metric.label} 
                  className={`p-4 rounded-lg ${metric.highlight ? 'bg-muted/50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{metric.label}</h4>
                      <p className="text-sm text-muted-foreground">{metric.description}</p>
                    </div>
                    <Badge 
                      variant={(metric.value1 - metric.value2) > 0 ? 'success' : 'destructive'} 
                      className="text-xs font-normal"
                    >
                      {(metric.value1 - metric.value2) > 0 ? '+' : ''}{metric.formatter(Math.abs(metric.value1 - metric.value2))}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-indigo-600">
                        {metric.formatter(metric.value1)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
                        {provider1.name}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-emerald-600">
                        {metric.formatter(metric.value2)}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-600"></div>
                        {provider2.name}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}; 
