import React, { useState } from 'react';
import Modal from '@/components/ui/modal';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface AddAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  type: 'wrvu' | 'target' | 'additionalPay';
}

const AddAdjustmentModal: React.FC<AddAdjustmentModalProps> = ({ isOpen, onClose, onAdd, type }) => {
  const [amount, setAmount] = useState<number>(0);
  const [month, setMonth] = useState<string>('');
  const [description, setDescription] = useState('');
  const [payType, setPayType] = useState<string>('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'additionalPay') {
      console.log('1. Modal - Starting submission for Additional Pay');
      console.log('2. Modal - Name:', name);
      console.log('3. Modal - Description:', description);
      console.log('4. Modal - Month:', month);
      console.log('5. Modal - Amount:', amount);

      // Create monthly values
      const monthlyValues = months.reduce((acc, month) => ({
        ...acc,
        [month.toLowerCase()]: 0
      }), {});

      console.log('1. Monthly Values Created:', monthlyValues);
      console.log('2. Selected Month:', month);
      console.log('3. Amount:', amount);

      const payloadData = {
        type: 'additionalPay',
        name: name,
        description: description,
        ...monthlyValues,
        [month.toLowerCase()]: Number(amount)
      };

      console.log('6. Modal - Final payload:', payloadData);
      onAdd(payloadData);
    } else if (type === 'wrvu') {
      // Create an object with all months
      const monthlyValues = months.reduce((acc, month) => ({
        ...acc,
        [month.toLowerCase()]: 0
      }), {});

      onAdd({
        type: 'wrvu',
        name: name,
        description: description,
        ...monthlyValues, // Initialize all months with 0
        [month.toLowerCase()]: Number(amount) // Set the selected month's value
      });
    } else if (type === 'target') {
      // Add target adjustment handling
      const monthlyValues = months.reduce((acc, month) => ({
        ...acc,
        [month.toLowerCase()]: 0
      }), {});

      onAdd({
        type: 'target',
        name: name,
        description: description,
        ...monthlyValues,
        [month.toLowerCase()]: Number(amount)
      });
    }
    
    // Reset form
    setName('');
    setAmount(0);
    setMonth('');
    setDescription('');
    setPayType('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          {type === 'wrvu' ? 'Add wRVU Adjustment' : 
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Month
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select month</option>
                    {months.map((m) => (
                      <option key={m} value={m.toLowerCase()}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter amount"
                  />
                </div>
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
            Add Adjustment
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddAdjustmentModal; 