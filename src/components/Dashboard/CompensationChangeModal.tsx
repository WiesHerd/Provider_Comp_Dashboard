import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CompensationChange, PartialCompensationChange } from '@/types/compensation';
import { formatCurrency } from '@/utils/formatters';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface CompensationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (change: PartialCompensationChange) => void;
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
  const [localNewSalary, setLocalNewSalary] = useState<number>(currentSalary);
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
    const change: PartialCompensationChange = {
      effectiveDate: localEffectiveDate,
      newSalary: localNewSalary,
      newFTE: localNewFTE,
      conversionFactor: conversionFactor,
      reason: localReason
    };
    onSave(change);
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900 mb-4"
                >
                  {editingChange ? 'Edit Compensation Change' : 'New Compensation Change'}
                </Dialog.Title>

                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Base Salary
                      </label>
                      <div className="mt-1 text-lg font-semibold text-gray-900">
                        {formatCurrency(currentSalary)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        New Salary
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1000"
                        value={localNewSalary}
                        onChange={(e) => setLocalNewSalary(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Current FTE
                      </label>
                      <div className="mt-1 text-lg font-semibold text-gray-900">
                        {currentFTE.toFixed(2)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        New FTE
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="1"
                        step="0.1"
                        value={localNewFTE}
                        onChange={(e) => setLocalNewFTE(Number(e.target.value))}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Effective Date
                      </label>
                      <input
                        type="date"
                        required
                        value={localEffectiveDate}
                        onChange={(e) => setLocalEffectiveDate(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Reason
                      </label>
                      <textarea
                        required
                        value={localReason}
                        onChange={(e) => setLocalReason(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Save
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