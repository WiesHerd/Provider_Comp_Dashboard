import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AddTargetAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (adjustment: any) => void;
  editingData?: any;
}

const AddTargetAdjustmentModal: React.FC<AddTargetAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  editingData
}) => {
  const [name, setName] = useState('');
  const [monthlyAmounts, setMonthlyAmounts] = useState<{ [key: string]: number }>({});
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  useEffect(() => {
    if (editingData) {
      setName(editingData.component || '');
      const amounts = {};
      months.forEach(month => {
        amounts[month] = editingData[month] || 0;
      });
      setMonthlyAmounts(amounts);
    } else {
      setName('');
      setMonthlyAmounts(months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {}));
    }
  }, [editingData]);

  const handleSubmit = () => {
    const adjustment = {
      component: name,
      ...monthlyAmounts
    };
    onAdd(adjustment);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Add Target Adjustment</h3>
          <button onClick={onClose}>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Adjustment Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {months.map((month) => (
              <div key={month}>
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {month}
                </label>
                <input
                  type="number"
                  value={monthlyAmounts[month] || 0}
                  onChange={(e) => setMonthlyAmounts(prev => ({
                    ...prev,
                    [month]: parseFloat(e.target.value) || 0
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {editingData ? 'Save Changes' : 'Add Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTargetAdjustmentModal; 