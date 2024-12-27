import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CompensationChange } from '@/types/compensation';
import { formatCurrency } from '@/utils/formatters';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CompensationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSalary: number;
  currentFTE: number;
  conversionFactor: number;
  onSave: (data: any) => void;
  editingData?: CompensationChange;
}

const CompensationChangeModal: React.FC<CompensationChangeModalProps> = ({
  isOpen,
  onClose,
  currentSalary,
  currentFTE,
  conversionFactor,
  onSave,
  editingData
}) => {
  const [newSalary, setNewSalary] = useState<number>(currentSalary);
  const [newFTE, setNewFTE] = useState<number>(currentFTE);
  const [effectiveDate, setEffectiveDate] = useState('');
  const [changeReason, setChangeReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        // If editing, use the editing data values
        setNewSalary(editingData.newSalary);
        setNewFTE(editingData.newFTE);
        setEffectiveDate(editingData.effectiveDate);
        setChangeReason(editingData.reason || '');
      } else {
        // If new change, use current values
        setNewSalary(currentSalary);
        setNewFTE(currentFTE);
        setEffectiveDate('');
        setChangeReason('');
      }
    }
  }, [isOpen, editingData, currentSalary, currentFTE]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      effectiveDate,
      newSalary,
      newFTE,
      conversionFactor,
      reason: changeReason,
      ...(editingData && { id: editingData.id }),
      ...(editingData && { providerId: editingData.providerId }),
      previousSalary: editingData?.previousSalary || currentSalary,
      previousFTE: editingData?.previousFTE || currentFTE
    };
    onSave(data);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    {editingData ? 'Edit Compensation Change' : 'Record Compensation Change'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1 text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Effective Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Salary
                      </label>
                      <input
                        type="text"
                        value={formatCurrency(editingData ? editingData.previousSalary : currentSalary)}
                        disabled
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Salary <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="text"
                          value={newSalary ? newSalary.toLocaleString() : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setNewSalary(value ? parseInt(value, 10) : 0);
                          }}
                          className="block w-full rounded-lg border border-gray-300 pl-8 pr-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Enter new salary"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current FTE
                      </label>
                      <input
                        type="text"
                        value={editingData ? editingData.previousFTE : currentFTE}
                        disabled
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New FTE <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={newFTE}
                        onChange={(e) => setNewFTE(Number(e.target.value))}
                        step="0.1"
                        min="0"
                        max="1"
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Change <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter reason for compensation change..."
                      required
                    />
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Change Summary</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Salary Change: {formatCurrency(editingData ? editingData.previousSalary : currentSalary)} → {formatCurrency(newSalary)}</p>
                      <p>FTE Change: {editingData ? editingData.previousFTE : currentFTE} → {newFTE}</p>
                      <p>Effective: {effectiveDate || 'Not set'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {editingData ? 'Save Changes' : 'Save Change'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CompensationChangeModal; 