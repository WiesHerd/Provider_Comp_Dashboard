import React, { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface AddAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  type: 'wrvu' | 'target' | 'additionalPay';
  editingData?: any;
}

export default function AddAdjustmentModal({
  isOpen,
  onClose,
  onAdd,
  type,
  editingData
}: AddAdjustmentModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyValues, setMonthlyValues] = useState<Record<string, number | string>>(
    Object.fromEntries(months.map(m => [m.toLowerCase(), '']))
  );
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (editingData) {
      setName(editingData.name || editingData.metric || '');
      setDescription(editingData.description || '');
      const values: Record<string, number | string> = {};
      months.forEach(month => {
        const key = month.toLowerCase();
        values[key] = editingData[key] || '';
      });
      setMonthlyValues(values);
    } else {
      setName('');
      setDescription('');
      setMonthlyValues(Object.fromEntries(months.map(m => [m.toLowerCase(), ''])));
    }
  }, [editingData]);

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.modal-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionValues = Object.fromEntries(
      Object.entries(monthlyValues).map(([key, value]) => [
        key,
        value === '' ? 0 : Number(value)
      ])
    );
    onAdd({
      name,
      description,
      ...submissionValues
    });
    setName('');
    setDescription('');
    setMonthlyValues(Object.fromEntries(months.map(m => [m.toLowerCase(), ''])));
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
        
        <Dialog.Panel 
          className="relative bg-white rounded-xl shadow-xl w-[500px] transform transition-all"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'auto'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Draggable handle */}
          <div className="modal-handle cursor-grab px-6 py-4 border-b border-gray-200 flex justify-between items-center select-none">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {type === 'wrvu' ? 'Add wRVU Adjustment' : 
               type === 'target' ? 'Add Target Adjustment' : 
               'Add Additional Pay'}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
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
                  rows={2}
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
                      value={monthlyValues[month.toLowerCase()]}
                      onChange={(e) => setMonthlyValues(prev => ({
                        ...prev,
                        [month.toLowerCase()]: e.target.value === '' ? '' : Number(e.target.value)
                      }))}
                      className="w-full p-2 border rounded"
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {editingData ? 'Save Changes' : 'Add Adjustment'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 