import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface AddAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  type: 'wrvu' | 'target' | 'additionalPay';
}

const AddAdjustmentModal: React.FC<AddAdjustmentModalProps> = ({ isOpen, onClose, onAdd, type, editingData }) => {
  const [amount, setAmount] = useState<number>(0);
  const [month, setMonth] = useState<string>('');
  const [description, setDescription] = useState('');
  const [payType, setPayType] = useState<string>('');
  const [name, setName] = useState('');
  const [monthlyAmounts, setMonthlyAmounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (editingData) {
      setName(editingData.component || '');
      setDescription(editingData.description || '');
      const amounts = {};
      months.forEach(month => {
        amounts[month] = editingData[month.toLowerCase()] || '';
      });
      setMonthlyAmounts(amounts);
    } else {
      setName('');
      setDescription('');
      setMonthlyAmounts({});
    }
  }, [editingData]);

  const handleSubmit = () => {
    const amounts = {};
    months.forEach(month => {
      amounts[month.toLowerCase()] = parseFloat(monthlyAmounts[month]) || 0;
    });

    const data = {
      ...(editingData || {}),
      component: editingData ? editingData.component : name,
      name: name,
      description: description,
      type: 'additionalPay',
      ...amounts
    };

    onAdd(data);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          {editingData ? 'Edit Additional Pay' : 
           type === 'wrvu' ? 'Add wRVU Adjustment' : 
           type === 'target' ? 'Add Target Adjustment' : 
           'Add Additional Pay'}
        </h3>
        
        <div className="space-y-4">
          {type === 'additionalPay' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Pay Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter additional pay name"
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
                      value={monthlyAmounts[month] || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        setMonthlyAmounts(prev => ({
                          ...prev,
                          [month]: value
                        }));
                      }}
                      className="w-full p-2 border rounded"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {type === 'target' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter target name"
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
                  placeholder="Enter description"
                />
              </div>
            </>
          )}
          
          {type === 'wrvu' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter adjustment name"
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
            </>
          )}
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