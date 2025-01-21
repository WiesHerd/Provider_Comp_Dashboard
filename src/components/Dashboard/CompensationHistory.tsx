import React from 'react';
import { CompensationChange } from '@/types/compensation';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '@/utils/formatters';

interface CompensationHistoryProps {
  changes: CompensationChange[];
  onDelete: (id: string) => void;
  onEdit: (change: CompensationChange) => void;
}

const CompensationHistory: React.FC<CompensationHistoryProps> = ({
  changes,
  onDelete,
  onEdit,
}) => {
  return (
    <div className="mt-8">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Previous Salary
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                New Salary
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Previous FTE
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                New FTE
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Previous CF
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                New CF
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {changes.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  No compensation changes recorded
                </td>
              </tr>
            ) : (
              changes.map((change) => (
                <tr key={change.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(change.effectiveDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(change.previousSalary || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(change.newSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {change.previousFTE?.toFixed(2) || "1.00"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {change.newFTE.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(change.previousConversionFactor || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatCurrency(change.newConversionFactor)}
                  </td>
                  <td className="px-6 py-4">
                    {change.reason || "No reason provided"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => onEdit(change)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => change.id && onDelete(change.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompensationHistory; 