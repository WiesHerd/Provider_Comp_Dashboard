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
  const [amount, setAmount] = useState<number>(0);
  const [month, setMonth] = useState<string>('');
  const [description, setDescription] = useState('');
  const [payType, setPayType] = useState<string>('');
  const [name, setName] = useState(editingData?.name || '');
  const [monthlyAmounts, setMonthlyAmounts] = useState({
    jan: editingData?.monthlyAmounts?.jan || '0',
    feb: editingData?.monthlyAmounts?.feb || '0',
    mar: editingData?.monthlyAmounts?.mar || '0',
    apr: editingData?.monthlyAmounts?.apr || '0',
    may: editingData?.monthlyAmounts?.may || '0',
    jun: editingData?.monthlyAmounts?.jun || '0',
    jul: editingData?.monthlyAmounts?.jul || '0',
    aug: editingData?.monthlyAmounts?.aug || '0',
    sep: editingData?.monthlyAmounts?.sep || '0',
    oct: editingData?.monthlyAmounts?.oct || '0',
    nov: editingData?.monthlyAmounts?.nov || '0',
    dec: editingData?.monthlyAmounts?.dec || '0'
  });

  // Add a reset function
  const resetForm = () => {
    console.log('Resetting form state');
    setName('');
    setDescription('');
    setMonthlyAmounts({
      jan: '0',
      feb: '0',
      mar: '0',
      apr: '0',
      may: '0',
      jun: '0',
      jul: '0',
      aug: '0',
      sep: '0',
      oct: '0',
      nov: '0',
      dec: '0'
    });
  };

  useEffect(() => {
    console.group('=== Adjustment Modal Effect ===');
    console.log('Editing Data:', editingData);
    console.log('Type:', type);
    console.log('Is Open:', isOpen);

    if (!isOpen) {
      // Reset form when modal closes
      resetForm();
      console.log('Modal closed - form reset');
    } else if (editingData) {
      console.log('Setting initial form values');
      console.log('Name:', editingData.name || editingData.metric);
      console.log('Description:', editingData.description);
      
      // Log the monthly amounts transformation
      console.log('Raw Monthly Values:', editingData);
      const initialMonthlyAmounts = months.reduce((acc, month) => {
        const monthKey = month.toLowerCase();
        // Check both direct property and monthlyAmounts object
        let value = 0;
        
        if (editingData.monthlyAmounts && editingData.monthlyAmounts[month]) {
          value = editingData.monthlyAmounts[month];
        } else if (editingData[monthKey] !== undefined) {
          value = editingData[monthKey];
        }

        console.log(`Month ${month}:`, { 
          directValue: editingData[monthKey],
          monthlyAmountsValue: editingData.monthlyAmounts?.[month],
          finalValue: value 
        });

        return {
          ...acc,
          [month]: value
        };
      }, {});
      
      console.log('Initial Monthly Amounts:', initialMonthlyAmounts);
      setMonthlyAmounts(initialMonthlyAmounts);
      setName(editingData.name || editingData.metric || '');
      setDescription(editingData.description || '');
    } else {
      // Reset form when opening for new adjustment
      resetForm();
      console.log('New adjustment - form reset');
    }
    
    console.groupEnd();
  }, [editingData, type, isOpen]);

  const handleSubmit = () => {
    console.group('=== Modal Submit Debug ===');
    console.log('Form Data Before Submit:', {
      name,
      description,
      monthlyAmounts,
      type
    });
    console.log('Original Editing Data:', editingData);
    
    // Log the exact monthly amounts being submitted
    console.log('Monthly Amounts Detail:', {
      raw: monthlyAmounts,
      parsed: Object.entries(monthlyAmounts).map(([month, value]) => ({
        month,
        value,
        parsed: parseFloat(value as string) || 0
      }))
    });

    try {
      const data = {
        ...(editingData?.id ? { id: editingData.id } : {}),
        name,
        description,
        type,
        monthlyAmounts: Object.fromEntries(
          Object.entries(monthlyAmounts).map(([month, value]) => [
            month.toLowerCase(),
            parseFloat(value as string) || 0
          ])
        )
      };
      
      console.log('Final Submission Data:', data);
      onAdd(data);
      resetForm(); // Reset form after successful submission
      onClose();
    } catch (error) {
      console.error('Submit Error:', error);
    }
    
    console.groupEnd();
  };

  // Add logging to the monthly amount change handler
  const handleMonthlyAmountChange = (month: string, value: string) => {
    console.group('=== Monthly Amount Change ===');
    console.log('Month:', month);
    console.log('New Value:', value);
    console.log('Current Monthly Amounts:', monthlyAmounts);
    
    setMonthlyAmounts(prev => {
      const updated = {
        ...prev,
        [month]: value
      };
      console.log('Updated Monthly Amounts:', updated);
      return updated;
    });
    
    console.groupEnd();
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
                      onChange={(e) => handleMonthlyAmountChange(month, e.target.value)}
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

              <div className="grid grid-cols-2 gap-4">
                {months.map(month => (
                  <div key={month} className="flex items-center">
                    <label className="w-20">{month}</label>
                    <input
                      type="number"
                      value={monthlyAmounts[month] || ''}
                      onChange={(e) => handleMonthlyAmountChange(month, e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0.00"
                    />
                  </div>
                ))}
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

              <div className="grid grid-cols-2 gap-4">
                {months.map(month => (
                  <div key={month} className="flex items-center">
                    <label className="w-20">{month}</label>
                    <input
                      type="number"
                      value={monthlyAmounts[month] || ''}
                      onChange={(e) => handleMonthlyAmountChange(month, e.target.value)}
                      className="w-full p-2 border rounded"
                      placeholder="0.00"
                    />
                  </div>
                ))}
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