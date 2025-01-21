import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CompensationChange } from '@/types/compensation';
import { formatCurrency } from '@/utils/formatters';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Position {
  x: number;
  y: number;
}

interface CompensationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSalary: number;
  currentFTE: number;
  conversionFactor: number;
  onSave: (data: {
    effectiveDate: string;
    previousSalary: number;
    newSalary: number;
    previousFTE: number;
    newFTE: number;
    previousConversionFactor: number;
    newConversionFactor: number;
    reason?: string;
  }) => void;
  editingData?: CompensationChange;
}

export default function CompensationChangeModal({
  isOpen,
  onClose,
  currentSalary,
  currentFTE,
  conversionFactor,
  onSave,
  editingData
}: CompensationChangeModalProps) {
  const [newSalary, setNewSalary] = useState(editingData?.newSalary || currentSalary);
  const [newFTE, setNewFTE] = useState(editingData?.newFTE || currentFTE);
  const [effectiveDate, setEffectiveDate] = useState(editingData?.effectiveDate || '');
  const [changeReason, setChangeReason] = useState(editingData?.reason || '');
  const [newConversionFactor, setNewConversionFactor] = useState(editingData?.newConversionFactor || conversionFactor);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (editingData) {
      setNewSalary(editingData.newSalary);
      setNewFTE(editingData.newFTE);
      setEffectiveDate(editingData.effectiveDate);
      setChangeReason(editingData.reason || '');
      setNewConversionFactor(editingData.newConversionFactor || conversionFactor);
    }
  }, [editingData, conversionFactor]);

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.modal-header')) {
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
    onSave({
      effectiveDate,
      previousSalary: currentSalary,
      newSalary,
      previousFTE: currentFTE,
      newFTE,
      previousConversionFactor: conversionFactor,
      newConversionFactor,
      reason: changeReason
    });
    // Reset form
    setNewSalary(currentSalary);
    setNewFTE(currentFTE);
    setEffectiveDate('');
    setChangeReason('');
    setNewConversionFactor(conversionFactor);
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Dialog.Panel 
              className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all"
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                cursor: isDragging ? 'grabbing' : 'auto'
              }}
            >
              <div 
                className="modal-header bg-gray-50 px-6 py-4 flex items-center justify-between cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
              >
                <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900 select-none">
                  Record Compensation Change
                </Dialog.Title>
                <button
                  type="button"
                  className="rounded-md text-gray-400 hover:text-gray-500"
                  onClick={onClose}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="bg-white rounded-lg">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Effective Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      required
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Salary</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="text"
                          value={formatCurrency(currentSalary).replace('$', '')}
                          disabled
                          className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Salary <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={newSalary}
                          onChange={(e) => setNewSalary(Number(e.target.value))}
                          required
                          className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current FTE</label>
                      <input
                        type="number"
                        value={currentFTE}
                        disabled
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New FTE <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={newFTE}
                        onChange={(e) => setNewFTE(Number(e.target.value))}
                        required
                        step="0.01"
                        min="0"
                        max="1"
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current CF</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={conversionFactor}
                          disabled
                          step="0.01"
                          className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New CF <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={newConversionFactor}
                          onChange={(e) => setNewConversionFactor(Number(e.target.value))}
                          required
                          step="0.01"
                          className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Change <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      required
                      rows={3}
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter reason for compensation change..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                  >
                    Save Change
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 