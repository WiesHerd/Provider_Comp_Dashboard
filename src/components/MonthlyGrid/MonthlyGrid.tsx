import React from 'react';
import { Card, Title, Text } from '@tremor/react';
import { Table, TableHead, TableHeaderCell, TableBody, TableRow, TableCell } from '@tremor/react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface MonthlyGridProps {
  provider: {
    id: string;
    name: string;
    employeeId: string;
    specialty: string;
    providerType: string;
    fte: number;
    annualSalary: number;
    conversionFactor: number;
    annualWRVUTarget: number;
  };
  metrics: {
    month: string;
    actualWRVU: number;
    targetWRVU: number;
    difference: number;
  }[];
}

const MonthlyGrid: React.FC<MonthlyGridProps> = ({ provider, metrics }) => {
  const calculateIncentive = (difference: number) => {
    const amount = difference * provider.conversionFactor;
    const holdback = amount * 0.2; // 20% holdback
    return { amount, holdback };
  };

  const monthlyTarget = provider.annualWRVUTarget / 12;

  return (
    <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Monthly Performance</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Metric
              </th>
              {metrics.map((metric) => (
                <th
                  key={metric.month}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {metric.month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Actual wRVUs Row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Actual wRVUs
              </td>
              {metrics.map((metric) => (
                <td
                  key={`actual-${metric.month}`}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${
                    metric.actualWRVU >= monthlyTarget ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {metric.actualWRVU.toLocaleString()}
                </td>
              ))}
            </tr>

            {/* Target Row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Target
              </td>
              {metrics.map((metric) => (
                <td
                  key={`target-${metric.month}`}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {monthlyTarget.toLocaleString()}
                </td>
              ))}
            </tr>

            {/* Difference Row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Difference
              </td>
              {metrics.map((metric) => (
                <td
                  key={`diff-${metric.month}`}
                  className="px-6 py-4 whitespace-nowrap text-sm"
                >
                  <div className={`flex items-center gap-1 ${
                    metric.difference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.difference >= 0 ? (
                      <ArrowUpIcon className="w-4 h-4" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4" />
                    )}
                    {metric.difference.toLocaleString()}
                  </div>
                </td>
              ))}
            </tr>

            {/* Incentive Row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Incentive Payment
              </td>
              {metrics.map((metric) => {
                const { amount } = calculateIncentive(metric.difference);
                return (
                  <td
                    key={`incentive-${metric.month}`}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                      amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    ${amount.toLocaleString()}
                  </td>
                );
              })}
            </tr>

            {/* Holdback Row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                Holdback
              </td>
              {metrics.map((metric) => {
                const { holdback } = calculateIncentive(metric.difference);
                return (
                  <td
                    key={`holdback-${metric.month}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    ${holdback.toLocaleString()}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyGrid; 