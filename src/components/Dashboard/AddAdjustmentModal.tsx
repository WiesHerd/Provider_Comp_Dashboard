import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface AddAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  type: 'wrvu' | 'target' | 'additionalPay';
  editingData?: any;
}

const AddAdjustmentModal: React.FC<AddAdjustmentModalProps> = ({ isOpen, onClose, onAdd, type, editingData }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyAmounts, setMonthlyAmounts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingData) {
      setName(editingData.name || editingData.component || editingData.metric || '');
      setDescription(editingData.description || '');
      
      const newMonthlyValues: Record<string, string> = {};
      months.forEach(month => {
        const monthKey = month.toLowerCase();
        newMonthlyValues[monthKey] = editingData[monthKey]?.toString() || '0';
      });
      setMonthlyAmounts(newMonthlyValues);
    } else {
      setName('');
      setDescription('');
      const emptyValues: Record<string, string> = {};
      months.forEach(month => {
        emptyValues[month.toLowerCase()] = '';
      });
      setMonthlyAmounts(emptyValues);
    }
  }, [editingData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monthlyValues = Object.fromEntries(
      Object.entries(monthlyAmounts).map(([key, value]) => [
        key,
        value === '' ? 0 : Number(value)
      ])
    );

    const data = {
      id: editingData?.id,
      name,
      description,
      type,
      ...monthlyValues
    };
    onAdd(data);
    onClose();
  };

  const handleMonthlyAmountChange = (month: string, value: string) => {
    const monthKey = month.toLowerCase();
    setMonthlyAmounts(prev => ({
      ...prev,
      [monthKey]: value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          {editingData ? `Edit ${type === 'wrvu' ? 'wRVU' : type === 'target' ? 'Target' : 'Additional Pay'} Adjustment` : 
           type === 'wrvu' ? 'Add wRVU Adjustment' : 
           type === 'target' ? 'Add Target Adjustment' : 
           'Add Additional Pay'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {type === 'additionalPay' ? 'Additional Pay Name' : 'Adjustment Name'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter description (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {months.map(month => (
              <div key={month} className="flex items-center">
                <label className="w-20">{month}</label>
                <input
                  type="number"
                  value={monthlyAmounts[month.toLowerCase()] || ''}
                  onChange={(e) => handleMonthlyAmountChange(month, e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="0.00"
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
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            {editingData ? 'Save Changes' : 'Add Adjustment'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddAdjustmentModal; 