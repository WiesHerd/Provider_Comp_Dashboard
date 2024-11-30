import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface EditAdditionalPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPayment: any) => void;
  payment: any;
}

const EditAdditionalPayModal: React.FC<EditAdditionalPayModalProps> = ({
  isOpen,
  onClose,
  onSave,
  payment
}) => {
  const [values, setValues] = useState<{ [key: string]: number }>({});
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  useEffect(() => {
    if (payment) {
      const initialValues = {};
      months.forEach(month => {
        initialValues[month] = payment[month] || 0;
      });
      setValues(initialValues);
    }
  }, [payment]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Edit {payment?.component}</h3>
          <button onClick={onClose}>
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {months.map((month) => (
            <div key={month} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 capitalize mb-1">
                {month}
              </label>
              <input
                type="number"
                value={values[month] || 0}
                onChange={(e) => setValues(prev => ({
                  ...prev,
                  [month]: parseFloat(e.target.value) || 0
                }))}
                className="border rounded-md px-3 py-2"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ ...payment, ...values })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAdditionalPayModal; 