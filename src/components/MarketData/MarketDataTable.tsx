import React, { useState, useMemo } from 'react';
import { PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';

interface MarketData {
  id: string;
  specialty: string;
  p25_total: number;
  p50_total: number;
  p75_total: number;
  p90_total: number;
  p25_wrvu: number;
  p50_wrvu: number;
  p75_wrvu: number;
  p90_wrvu: number;
  p25_cf: number;
  p50_cf: number;
  p75_cf: number;
  p90_cf: number;
  history?: {
    changeType: string;
    fieldName: string;
    oldValue: string;
    newValue: string;
    changedAt: string;
  }[];
}

interface MarketDataTableProps {
  data: MarketData[];
  onEdit: (data: MarketData) => void;
  onDelete: (id: string) => void;
}

const isRecentlyEdited = (data: MarketData) => {
  return Boolean(data.history && Array.isArray(data.history) && data.history.length > 0);
};

export default function MarketDataTable({ data, onEdit, onDelete }: MarketDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item =>
    item.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasEdits = useMemo(() => {
    return data.some(item => isRecentlyEdited(item));
  }, [data]);

  return (
    <div className="w-full">
      <div className="mb-4 max-w-md">
        <input
          type="text"
          placeholder="Search specialties..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div className="w-full overflow-x-auto border border-gray-200 rounded-lg shadow">
        <table className="w-full table-fixed divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="w-[15%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                Specialty
              </th>
              {hasEdits && (
                <th scope="col" className="w-8 px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  History
                </th>
              )}
              <th scope="col" colSpan={4} className="w-[28%] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Cash Compensation
              </th>
              <th scope="col" colSpan={4} className="w-[28%] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                WRVUs
              </th>
              <th scope="col" colSpan={4} className="w-[28%] px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conversion Factor
              </th>
              <th scope="col" className="w-[1%] relative px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
            <tr>
              <th scope="col" className="px-3 py-3"></th>
              {hasEdits && <th scope="col" className="w-8 px-2"></th>}
              {['25th', '50th', '75th', '90th'].map((percentile) => (
                <th key={`total-${percentile}`} scope="col" className="w-[7%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {percentile}
                </th>
              ))}
              {['25th', '50th', '75th', '90th'].map((percentile) => (
                <th key={`wrvu-${percentile}`} scope="col" className="w-[7%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {percentile}
                </th>
              ))}
              {['25th', '50th', '75th', '90th'].map((percentile) => (
                <th key={`cf-${percentile}`} scope="col" className="w-[7%] px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {percentile}
                </th>
              ))}
              <th scope="col" className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-3 py-4 text-sm font-medium text-gray-900 truncate">
                  {item.specialty}
                </td>
                {hasEdits && (
                  <td className="w-8 px-2 py-3 text-center">
                    {isRecentlyEdited(item) && (
                      <ClockIcon className="h-4 w-4 text-blue-500 inline-block" aria-hidden="true" />
                    )}
                  </td>
                )}
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  ${item.p25_total.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  ${item.p50_total.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  ${item.p75_total.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  ${item.p90_total.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  {item.p25_wrvu.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  {item.p50_wrvu.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  {item.p75_wrvu.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  {item.p90_wrvu.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  ${item.p25_cf.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  ${item.p50_cf.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  ${item.p75_cf.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500 text-right">
                  ${item.p90_cf.toLocaleString()}
                </td>
                <td className="px-3 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <PencilIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 