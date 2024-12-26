import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CompensationChange } from '@/types/compensation';
import { formatCurrency } from '@/utils/formatters';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CompensationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (change: CompensationChange) => void;
  currentSalary: number;
  currentFTE: number;
  conversionFactor: number;
  editingChange?: CompensationChange;
}

const CompensationChangeModal: React.FC<CompensationChangeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSalary,
  currentFTE,
  conversionFactor,
  editingChange
}) => {
  const [localNewSalary, setLocalNewSalary] = useState(currentSalary);
  const [localNewFTE, setLocalNewFTE] = useState(currentFTE);
  const [localEffectiveDate, setLocalEffectiveDate] = useState('');
  const [localReason, setLocalReason] = useState('');

  useEffect(() => {
    if (editingChange) {
      setLocalNewSalary(editingChange.newSalary);
      setLocalNewFTE(editingChange.newFTE);
      setLocalEffectiveDate(editingChange.effectiveDate);
      setLocalReason(editingChange.reason);
    } else {
      setLocalNewSalary(currentSalary);
      setLocalNewFTE(currentFTE);
      setLocalEffectiveDate('');
      setLocalReason('');
    }
  }, [editingChange, isOpen, currentSalary, currentFTE]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: editingChange?.id || `change-${Date.now()}`,
      providerId: editingChange?.providerId || 'default-provider',
      effectiveDate: localEffectiveDate,
      previousSalary: editingChange ? editingChange.previousSalary : currentSalary,
      newSalary: localNewSalary,
      previousFTE: editingChange ? editingChange.previousFTE : currentFTE,
      newFTE: localNewFTE,
      conversionFactor,
      reason: localReason
    });
  };

  const handleFTEChange = (value: string) => {
    if (value === '' || value === '.') {
      setLocalNewFTE(0);
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
        setLocalNewFTE(Number(numValue.toFixed(2)));
      }
    }
  };

  const isFormValid = localEffectiveDate && localNewSalary > 0 && localNewFTE > 0 && localReason;

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                    Record Compensation Change
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
                      value={localEffectiveDate}
                      onChange={(e) => setLocalEffectiveDate(e.target.value)}
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
                        value={formatCurrency(currentSalary)}
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
                          value={localNewSalary === 0 ? '' : localNewSalary.toLocaleString()}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            setLocalNewSalary(value ? parseInt(value, 10) : 0);
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
                        value={currentFTE}
                        disabled
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-gray-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New FTE <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={localNewFTE === 0 ? '' : localNewFTE.toFixed(2)}
                        onChange={(e) => handleFTEChange(e.target.value)}
                        className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Enter FTE (0-1)"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Conversion Factor
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="text"
                        value={Number(conversionFactor).toFixed(2)}
                        disabled
                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 pl-8 pr-4 py-2.5 text-gray-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Change <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={localReason}
                      onChange={(e) => setLocalReason(e.target.value)}
                      rows={3}
                      className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter reason for compensation change..."
                      required
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Change Summary</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Salary Change: {formatCurrency(currentSalary)} → {formatCurrency(localNewSalary)}</p>
                      <p>FTE Change: {currentFTE} → {localNewFTE}</p>
                      <p>Effective: {localEffectiveDate || 'Invalid Date'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                      Save Change
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