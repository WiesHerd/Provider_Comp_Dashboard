import React, { useMemo } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { classNames } from '@/lib/utils';

const WrvuPage: React.FC = () => {
  const hasEdits = useMemo(() => {
    return wrvuData.some(data => 
      data.lastEditedAt != null || 
      (data.history && data.history.length > 0)
    );
  }, [wrvuData]);

  return (
    <div>
      <thead>
        <tr>
          <th scope="col" className="relative w-12 px-4 sm:w-16 sm:px-6">
            <input
              type="checkbox"
              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={selectedItems.size > 0 && selectedItems.size === filteredData.length}
              onChange={(e) => handleSelectAll(e)}
            />
          </th>
          {hasEdits && (
            <th scope="col" className="w-8 px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
              EDIT
            </th>
          )}
          <th scope="col" className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">
            EMPLOYEE ID
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredData.map(data => (
          <tr
            key={data.id}
            className={classNames(
              selectedItems.has(data.id) ? 'bg-gray-50' : 'bg-white',
              'hover:bg-gray-50'
            )}
          >
            <td className="relative w-12 px-4 sm:w-16 sm:px-6">
              <input
                type="checkbox"
                className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={selectedItems.has(data.id)}
                onChange={(e) => handleSelectRow(e, data.id)}
              />
            </td>
            {hasEdits && (
              <td className="whitespace-nowrap w-8 px-2 py-3 text-center">
                {data.history && data.history.length > 0 && (
                  <ClockIcon className="h-4 w-4 text-blue-500 inline-block" aria-hidden="true" />
                )}
              </td>
            )}
            <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
              {data.employeeId}
            </td>
          </tr>
        ))}
      </tbody>
    </div>
  );
};

export default WrvuPage; 