import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/modal';
import { CompensationChange } from '@/types/compensation';
import { formatCurrency } from '@/utils/formatters';
import { NumericFormat } from 'react-number-format';

interface CompensationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (change: CompensationChange) => void;
  currentSalary: number;
  currentFTE: number;
  currentCF: number;
  newSalary: number;
  newFTE: number;
  reason: string;
  effectiveDate: string;
  isEditing?: boolean;
}

const CompensationChangeModal: React.FC<CompensationChangeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSalary = 0,
  currentFTE = 0,
  currentCF = 0,
  newSalary = 0,
  newFTE = 0,
  reason = '',
  effectiveDate = '',
  isEditing = false
}) => {
  const [effectiveDateState, setEffectiveDateState] = useState(
    effectiveDate || new Date().toISOString().split('T')[0]
  );
  const [newSalaryState, setNewSalaryState] = useState<string>((currentSalary || 0).toFixed(2));
  const [newFTEState, setNewFTEState] = useState<string>((currentFTE || 0).toFixed(2));
  const [conversionFactor, setConversionFactor] = useState<string>((currentCF || 0).toFixed(2));
  const [reasonState, setReasonState] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setNewSalaryState(newSalary.toString());
      setNewFTEState(newFTE.toString());
      setConversionFactor(currentCF.toString());
      setReasonState(reason);
      setEffectiveDateState(effectiveDate || new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, newSalary, newFTE, currentCF, reason, effectiveDate]);

  const validateChange = (change: CompensationChange): boolean => {
    const errors: string[] = [];
    
    if (change.newSalary < 0) errors.push('Salary cannot be negative');
    if (change.newFTE < 0 || change.newFTE > 1) errors.push('FTE must be between 0 and 1');
    if (!change.effectiveDate) errors.push('Effective date is required');
    
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const change: CompensationChange = {
      effectiveDate: effectiveDateState,
      previousSalary: currentSalary,
      newSalary: parseFloat(newSalaryState),
      previousFTE: currentFTE,
      newFTE: parseFloat(newFTEState),
      conversionFactor: parseFloat(conversionFactor),
      reason: reasonState,
      providerId: 'temp-id'
    };

    if (validateChange(change)) {
      onSave(change);
    }
  };

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove all non-numeric characters except decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    
    // Ensure only valid numbers are entered
    if (value === '' || !isNaN(parseFloat(value))) {
      setNewSalaryState(value);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">
          {isEditing ? 'Edit Compensation Change' : 'Record Compensation Change'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDateState}
              onChange={(e) => setEffectiveDateState(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Salary Section */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Salary
              </label>
              <div className="relative">
                <NumericFormat
                  value={currentSalary}
                  thousandSeparator={true}
                  prefix="$"
                  disabled
                  className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm px-3 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Salary
              </label>
              <div className="relative">
                <NumericFormat
                  value={newSalaryState}
                  onValueChange={(values) => {
                    setNewSalaryState(values.value);
                  }}
                  thousandSeparator={true}
                  prefix="$"
                  allowNegative={false}
                  decimalScale={2}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* FTE Section */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current FTE
              </label>
              <input
                type="text"
                value={currentFTE.toFixed(2)}
                className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New FTE
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={newFTEState}
                onChange={(e) => setNewFTEState(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Conversion Factor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conversion Factor
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={conversionFactor}
                onChange={(e) => setConversionFactor(e.target.value)}
                className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Change
            </label>
            <textarea
              value={reasonState}
              onChange={(e) => setReasonState(e.target.value)}
              className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
              rows={3}
              placeholder="Enter reason for change"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Change
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CompensationChangeModal; 