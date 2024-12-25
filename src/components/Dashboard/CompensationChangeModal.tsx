import React, { useEffect } from 'react';
import { CompensationChange } from '@/types/compensation';
import { formatCurrency } from '@/utils/formatters';

interface CompensationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (change: CompensationChange) => void;
  currentSalary: number;
  newSalary: number;
  currentFTE: number;
  newFTE: number;
  currentCF: number;
  effectiveDate: string;
  reason: string;
  editingChange?: CompensationChange;
}

const CompensationChangeModal: React.FC<CompensationChangeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSalary,
  newSalary,
  currentFTE,
  newFTE,
  currentCF,
  effectiveDate,
  reason,
  editingChange
}) => {
  const [localNewSalary, setLocalNewSalary] = React.useState(newSalary);
  const [localNewFTE, setLocalNewFTE] = React.useState(newFTE);
  const [localEffectiveDate, setLocalEffectiveDate] = React.useState(effectiveDate);
  const [localReason, setLocalReason] = React.useState(reason);
  const [localConversionFactor, setLocalConversionFactor] = React.useState(currentCF);

  // Update local state when editing an existing change
  useEffect(() => {
    if (editingChange) {
      setLocalNewSalary(editingChange.newSalary);
      setLocalNewFTE(editingChange.newFTE || 1.0);
      setLocalEffectiveDate(editingChange.effectiveDate);
      setLocalReason(editingChange.reason || '');
    } else {
      // Reset to defaults when not editing
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
      effectiveDate: localEffectiveDate,
      previousSalary: editingChange ? editingChange.previousSalary : currentSalary,
      newSalary: localNewSalary,
      previousFTE: editingChange ? editingChange.previousFTE : currentFTE,
      newFTE: localNewFTE,
      reason: localReason
    });
  };

  const validateNumericInput = (value: string, min?: number, max?: number) => {
    const numValue = value.replace(/[^\d.-]/g, '');
    if (numValue === '' || isNaN(parseFloat(numValue))) return '';
    const parsed = parseFloat(numValue);
    if (min !== undefined && parsed < min) return min.toString();
    if (max !== undefined && parsed > max) return max.toString();
    return parsed.toString();
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isOpen ? 'block' : 'hidden'}`}>
      <div className="modal-content w-[600px]">
        <h2 className="text-2xl font-semibold mb-6">Record Compensation Change</h2>
        
        <div className="space-y-6">
          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effective Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={localEffectiveDate}
              onChange={(e) => setLocalEffectiveDate(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Salary
              </label>
              <input
                type="text"
                value={formatCurrency(editingChange ? editingChange.previousSalary : currentSalary)}
                disabled
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-500"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Salary <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="text"
                  value={localNewSalary === 0 ? '' : localNewSalary}
                  onChange={(e) => {
                    const value = e.target.value.replace(/^\$/, '');
                    setLocalNewSalary(Number(validateNumericInput(value, 0)));
                  }}
                  className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter new salary"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current FTE
              </label>
              <input
                type="text"
                value={editingChange ? editingChange.previousFTE : currentFTE}
                disabled
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-300 text-gray-500"
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New FTE <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={localNewFTE === 0 ? '' : localNewFTE}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow digits, single decimal point, and handle empty input
                  if (value === '' || value === '.') {
                    setLocalNewFTE(value === '' ? 0 : value);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1) {
                      // Allow up to 2 decimal places
                      setLocalNewFTE(Number(Math.min(1, Math.max(0, Number(value))).toFixed(2)));
                    }
                  }
                }}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter FTE (0-1)"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conversion Factor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                type="text"
                value={localConversionFactor === 0 ? '' : localConversionFactor}
                onChange={(e) => {
                  setLocalConversionFactor(Number(validateNumericInput(e.target.value, 0)));
                }}
                className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Enter conversion factor"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Change <span className="text-red-500">*</span>
            </label>
            <textarea
              value={localReason}
              onChange={(e) => setLocalReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              placeholder="Enter reason for compensation change..."
              required
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Change Summary</h3>
            <div className="space-y-2 text-sm">
              <p>Salary Change: {formatCurrency(currentSalary)} → {formatCurrency(localNewSalary)}</p>
              <p>FTE Change: {currentFTE} → {localNewFTE}</p>
              <p>Effective: {new Date(localEffectiveDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!localEffectiveDate || !localNewSalary || !localNewFTE || !localReason}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Save Change
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompensationChangeModal; 