import { FC } from 'react';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/solid';
import { Tooltip } from '@/components/ui/tooltip';

interface TableProps {
  provider1: any;
  provider2: any;
}

export const ComparisonTable: FC<TableProps> = ({ provider1, provider2 }) => {
  console.log('Provider 1 data:', provider1);
  console.log('Provider 2 data:', provider2);

  console.log('Provider 1 WRVU data:', {
    monthlyWRVUs: provider1?.metrics?.monthlyWRVUs,
    monthlyTarget: provider1?.metrics?.monthlyTargetWRVUs || provider1?.targetWRVUs / 12,
    ytdWRVUs: provider1?.metrics?.ytdWRVUs,
    ytdTarget: provider1?.metrics?.ytdTargetWRVUs || (provider1?.targetWRVUs / 12) * new Date().getMonth(),
    annualTarget: provider1?.targetWRVUs
  });
  
  console.log('Provider 2 WRVU data:', {
    monthlyWRVUs: provider2?.metrics?.monthlyWRVUs,
    monthlyTarget: provider2?.metrics?.monthlyTargetWRVUs || provider2?.targetWRVUs / 12,
    ytdWRVUs: provider2?.metrics?.ytdWRVUs,
    ytdTarget: provider2?.metrics?.ytdTargetWRVUs || (provider2?.targetWRVUs / 12) * new Date().getMonth(),
    annualTarget: provider2?.targetWRVUs
  });

  const formatValue = (value: any, type: string, formatter?: (value: number) => string) => {
    if (value === undefined || value === null) {
      return '-';
    }
    
    const numValue = Number(value);
    
    switch (type) {
      case 'text':
        return String(value) || '-';
      case 'number':
        if (isNaN(numValue)) return '-';
        return formatNumber(numValue);
      case 'fte':
        if (isNaN(numValue)) return '-';
        return numValue.toFixed(2);
      case 'percent':
        if (isNaN(numValue)) return '-';
        return formatPercent(numValue);
      case 'currency':
        if (isNaN(numValue)) return '-';
        return formatCurrency(numValue);
      default:
        if (formatter && !isNaN(numValue)) {
          return formatter(numValue);
        }
        return String(value) || '-';
    }
  };

  const calculateDifference = (value1: any, value2: any, type: string) => {
    const num1 = Number(value1);
    const num2 = Number(value2);
    
    if (isNaN(num1) || isNaN(num2)) return null;
    
    switch (type) {
      case 'percent':
        return num1 - num2; // Direct difference for percentages
      case 'currency':
        return ((num1 - num2) / Math.abs(num2)) * 100; // Percentage difference for currency
      case 'number':
        return ((num1 - num2) / Math.abs(num2)) * 100; // Percentage difference for numbers
      case 'fte':
        return ((num1 - num2) / Math.abs(num2)) * 100; // Percentage difference for FTE
      default:
        return null;
    }
  };

  const formatDifferenceValue = (diff: number, type: string, value1: any, value2: any) => {
    if (diff === null || isNaN(diff)) return null;
    
    const absoluteDiff = Math.abs(value1 - value2);
    
    switch (type) {
      case 'currency':
        return formatCurrency(absoluteDiff);
      case 'number':
        return formatNumber(absoluteDiff);
      case 'percent':
        return formatPercent(absoluteDiff);
      case 'fte':
        return absoluteDiff.toFixed(2);
      default:
        return formatNumber(absoluteDiff);
    }
  };

  const getMetrics = () => [
      {
        label: 'Metric',
        metrics: [
          {
            label: 'Provider Information',
            type: 'header'
          },
          {
            label: 'Specialty',
            value1: String(provider1?.specialty),
            value2: String(provider2?.specialty),
            type: 'text'
          },
          {
            label: 'Department',
            value1: String(provider1?.department),
            value2: String(provider2?.department),
            type: 'text'
          },
          {
            label: 'Compensation Model',
            value1: provider1?.compensationModel || '-',
            value2: provider2?.compensationModel || '-',
            type: 'text'
          },
          {
            label: 'Years of Experience',
            value1: provider1?.yearsOfExperience || 0,
            value2: provider2?.yearsOfExperience || 0,
            type: 'number'
          },
          {
            label: 'FTE Distribution',
            type: 'header'
          },
          {
            label: 'Total FTE',
            value1: provider1?.fte || 0,
            value2: provider2?.fte || 0,
            type: 'fte'
          },
          {
            label: 'Clinical FTE',
            value1: provider1?.clinicalFte || 0,
            value2: provider2?.clinicalFte || 0,
            type: 'fte'
          },
          {
            label: 'Non-Clinical FTE',
            value1: provider1?.nonClinicalFte || 0,
            value2: provider2?.nonClinicalFte || 0,
            type: 'fte'
          },
          {
            label: 'Annual Base Compensation',
            type: 'header'
          },
          {
            label: 'Total Base Salary',
            value1: provider1?.baseSalary || 0,
            value2: provider2?.baseSalary || 0,
            type: 'currency',
            formatter: formatCurrency
          },
          {
            label: 'Clinical Salary',
            value1: provider1?.clinicalSalary,
            value2: provider2?.clinicalSalary,
            type: 'currency',
            formatter: formatCurrency
          },
          {
            label: 'Non-Clinical Salary',
            value1: provider1?.nonClinicalSalary,
            value2: provider2?.nonClinicalSalary,
            type: 'currency',
            formatter: formatCurrency
          },
          {
            label: 'Monthly Base Rate',
            value1: provider1?.baseSalary ? provider1.baseSalary / 12 : null,
            value2: provider2?.baseSalary ? provider2.baseSalary / 12 : null,
            type: 'currency',
            formatter: formatCurrency
          },
          {
            label: 'Year-to-Date Compensation',
            type: 'header'
          },
          {
            label: 'YTD Base Pay',
            value1: provider1?.metrics?.ytdBase,
            value2: provider2?.metrics?.ytdBase,
            type: 'currency',
            formatter: formatCurrency
          },
          {
            label: 'YTD Incentives',
            value1: provider1?.metrics?.ytdIncentives ?? 0,
            value2: provider2?.metrics?.ytdIncentives ?? 0,
            type: 'currency',
            formatter: formatCurrency
          },
          {
            label: 'YTD Additional Pay',
            value1: provider1?.metrics?.ytdAdditionalPay || 0,
            value2: provider2?.metrics?.ytdAdditionalPay || 0,
            type: 'currency',
            formatter: formatCurrency
          },
          {
            label: 'Total YTD Compensation',
            value1: provider1?.metrics?.totalYTDCompensation,
            value2: provider2?.metrics?.totalYTDCompensation,
            type: 'currency',
            formatter: formatCurrency
          },
          {
            label: 'Productivity Metrics',
            type: 'header'
          },
          {
            label: 'Monthly WRVUs',
            value1: provider1?.metrics?.actualWRVUs ?? 0,
            value2: provider2?.metrics?.actualWRVUs ?? 0,
            type: 'number',
            formatter: formatNumber
          },
          {
            label: 'Monthly Target',
            value1: provider1?.metrics?.targetWRVUs ?? 0,
            value2: provider2?.metrics?.targetWRVUs ?? 0,
            type: 'number',
            formatter: formatNumber
          },
          {
            label: 'YTD WRVUs',
            value1: provider1?.metrics?.ytdWRVUs ?? 0,
            value2: provider2?.metrics?.ytdWRVUs ?? 0,
            type: 'number',
            formatter: formatNumber
          },
          {
            label: 'YTD Target WRVUs',
            value1: provider1?.metrics?.ytdTargetWRVUs ?? 0,
            value2: provider2?.metrics?.ytdTargetWRVUs ?? 0,
            type: 'number',
            formatter: formatNumber
          },
          {
            label: 'Target Achievement',
            value1: provider1?.metrics?.planProgress ?? 0,
            value2: provider2?.metrics?.planProgress ?? 0,
            type: 'percent',
            formatter: formatPercent
          },
          {
            label: 'Market Position',
            type: 'header'
          },
          {
            label: 'Compensation Percentile',
            value1: provider1?.metrics?.compPercentile,
            value2: provider2?.metrics?.compPercentile,
            type: 'percent',
            formatter: formatPercent
          },
          {
            label: 'WRVU Percentile',
            value1: provider1?.metrics?.wrvuPercentile,
            value2: provider2?.metrics?.wrvuPercentile,
            type: 'percent',
            formatter: formatPercent
          },
          {
            label: 'Comp per WRVU',
            value1: provider1?.metrics?.compPerWRVU,
            value2: provider2?.metrics?.compPerWRVU,
            type: 'currency',
            formatter: formatCurrency
          },
          {
            label: 'Productivity-Comp Gap',
            value1: provider1?.metrics?.productivityCompGap,
            value2: provider2?.metrics?.productivityCompGap,
            type: 'percent',
            formatter: formatPercent
          }
        ]
      }
    ];

  const getDifferenceColor = (diff: number, metric: any) => {
    if (diff === 0) return 'bg-gray-100 text-gray-600';
    
    // Metrics where higher is better
    const higherIsBetter = [
      'Total FTE', 'Clinical FTE', 'Years of Experience',
      'Total Base Salary', 'Clinical Salary', 'Monthly Base Rate',
      'YTD Base Pay', 'YTD Incentives', 'Total YTD Compensation',
      'Monthly WRVUs', 'YTD WRVUs', 'Target Achievement',
      'WRVU Percentile', 'Comp per WRVU'
    ];

    // Metrics where lower is better
    const lowerIsBetter = [
      'Non-Clinical FTE', 'Non-Clinical Salary',
      'Productivity-Comp Gap'
    ];

    if (higherIsBetter.includes(metric.label)) {
      return diff > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    } else if (lowerIsBetter.includes(metric.label)) {
      return diff < 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
    }

    return 'bg-gray-100 text-gray-600';
  };

  const DifferenceIndicator = ({ value1, value2, metric }: { value1: any, value2: any, metric: any }) => {
    const diff = calculateDifference(value1, value2, metric.type);
    if (diff === null || diff === 0) return <MinusIcon className="h-4 w-4 text-gray-400 inline-block ml-1" />;
    
    const Icon = diff > 0 ? ArrowUpIcon : ArrowDownIcon;
    const colorClass = getDifferenceColor(diff, metric);
    const formattedDiff = formatDifferenceValue(diff, metric.type, value1, value2);
    
    return (
      <Tooltip content={`${formattedDiff} ${diff > 0 ? 'higher' : 'lower'}`}>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${colorClass}`}>
          <Icon className="h-3 w-3 mr-1" />
          {diff > 0 ? '+' : ''}{formatPercent(Math.abs(diff))}
        </span>
      </Tooltip>
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Metric</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">{provider1?.name || '-'}</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">{provider2?.name || '-'}</th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Difference</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {getMetrics()[0].metrics.map((metric, index) => {
            if (metric.type === 'header') {
              return (
                <tr key={index} className="bg-gray-50">
                  <td colSpan={4} className="py-3 px-4 text-sm font-semibold text-gray-900">
                    {metric.label}
                  </td>
                </tr>
              );
            }
            
            return (
              <tr 
                key={index}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="py-2 px-4 text-sm text-gray-600">
                  {metric.label}
                </td>
                <td className="py-2 px-4 text-sm text-right font-medium text-gray-900">
                  {formatValue(metric.value1, metric.type, metric.formatter)}
                </td>
                <td className="py-2 px-4 text-sm text-right font-medium text-gray-900">
                  {formatValue(metric.value2, metric.type, metric.formatter)}
                </td>
                <td className="py-2 px-4 text-sm text-right">
                  <DifferenceIndicator 
                    value1={metric.value1} 
                    value2={metric.value2} 
                    metric={metric} 
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}; 
