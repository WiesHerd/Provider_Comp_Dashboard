import React from 'react';
import { CompensationChange } from '@/types/compensation';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatters';

interface CompensationHistoryProps {
  changes: CompensationChange[];
  onDelete: (id: string) => void;
  onEdit: (change: CompensationChange) => void;
}

const CompensationHistory: React.FC<CompensationHistoryProps> = ({ changes, onDelete, onEdit }) => {
  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-4">Compensation History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Effective Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Salary Change
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                FTE Change
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {changes.map((change) => (
              <tr key={change.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {change.effectiveDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {`${formatCurrency(change.previousSalary)} → ${formatCurrency(change.newSalary)}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {`${change.previousFTE} → ${change.newFTE}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {change.reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onEdit(change)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(change.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompensationHistory; 