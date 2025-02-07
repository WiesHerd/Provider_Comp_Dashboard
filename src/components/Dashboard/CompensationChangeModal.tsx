import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CompensationChange } from '@/types/compensation';
import { formatCurrency } from '@/utils/formatters';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface Position {
  x: number;
  y: number;
}

interface TierConfig {
  id: string;
  name: string;
  tiers?: {
    wrvuThreshold: number;
    conversionFactor: number;
  }[];
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
    compensationModel?: string;
    tieredCFConfigId?: string;
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
  const [formData, setFormData] = useState({
    effectiveDate: editingData?.effectiveDate || '',
    newSalary: editingData?.newSalary || currentSalary,
    newFTE: editingData?.newFTE || currentFTE,
    newConversionFactor: editingData?.newConversionFactor || conversionFactor,
    reason: editingData?.reason || '',
    compensationModel: editingData?.compensationModel || 'Standard',
    tieredCFConfigId: editingData?.tieredCFConfigId || ''
  });
  const [tierConfigs, setTierConfigs] = useState<TierConfig[]>([]);
  const [selectedTierDetails, setSelectedTierDetails] = useState<TierConfig | null>(null);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (editingData) {
      setFormData({
        effectiveDate: editingData.effectiveDate,
        newSalary: editingData.newSalary,
        newFTE: editingData.newFTE,
        newConversionFactor: editingData.newConversionFactor || conversionFactor,
        reason: editingData.reason || '',
        compensationModel: editingData.compensationModel || 'Standard',
        tieredCFConfigId: editingData.tieredCFConfigId || ''
      });
    }
  }, [editingData, conversionFactor]);

  useEffect(() => {
    if (isOpen) {
      setPosition({ x: 0, y: 0 });
      // Fetch tier configurations when modal opens
      fetch('/api/compensation/tier-configs')
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch tier configurations');
          }
          return res.json();
        })
        .then(data => setTierConfigs(data))
        .catch(err => {
          console.error('Error fetching tier configs:', err);
          toast.error('Failed to fetch tier configurations');
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.tieredCFConfigId) {
      fetch(`/api/compensation/tier-configs/${formData.tieredCFConfigId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch tier details');
          }
          return res.json();
        })
        .then(data => setSelectedTierDetails(data))
        .catch(err => {
          console.error('Error fetching tier details:', err);
          toast.error('Failed to fetch tier details');
        });
    } else {
      setSelectedTierDetails(null);
    }
  }, [formData.tieredCFConfigId]);

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

    // Validate required fields
    if (!formData.effectiveDate) {
      toast.error('Please select an effective date');
      return;
    }

    if (!formData.reason) {
      toast.error('Please provide a reason for the compensation change');
      return;
    }

    // Validate numeric fields
    if (typeof formData.newSalary !== 'number' || formData.newSalary <= 0) {
      toast.error('Please enter a valid salary');
      return;
    }

    if (typeof formData.newFTE !== 'number' || formData.newFTE <= 0 || formData.newFTE > 1) {
      toast.error('Please enter a valid FTE between 0 and 1');
      return;
    }

    // Model-specific validation
    if (formData.compensationModel === 'Standard') {
      if (typeof formData.newConversionFactor !== 'number' || formData.newConversionFactor === 0) {
        toast.error('Please enter a valid conversion factor');
        return;
      }
    } else if (formData.compensationModel === 'Tiered CF') {
      if (!formData.tieredCFConfigId) {
        toast.error('Please select a tier configuration');
        return;
      }
      if (!selectedTierDetails?.tiers?.length) {
        toast.error('Selected tier configuration has no tiers defined');
        return;
      }
      // Use the base tier's conversion factor
      const baseTierCF = selectedTierDetails.tiers[0].conversionFactor;
      formData.newConversionFactor = baseTierCF;
    }

    onSave({
      effectiveDate: formData.effectiveDate,
      previousSalary: currentSalary,
      newSalary: formData.newSalary,
      previousFTE: currentFTE,
      newFTE: formData.newFTE,
      previousConversionFactor: conversionFactor,
      newConversionFactor: formData.newConversionFactor,
      reason: formData.reason,
      compensationModel: formData.compensationModel,
      tieredCFConfigId: formData.compensationModel === 'Tiered CF' ? formData.tieredCFConfigId : undefined
    });

    // Reset form
    setFormData({
      effectiveDate: '',
      newSalary: currentSalary,
      newFTE: currentFTE,
      newConversionFactor: conversionFactor,
      reason: '',
      compensationModel: 'Standard',
      tieredCFConfigId: ''
    });
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
                      value={formData.effectiveDate}
                      onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                      required
                      className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Compensation Model <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.compensationModel}
                        onChange={(e) => setFormData({ ...formData, compensationModel: e.target.value })}
                        required
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Base Pay">Base Pay</option>
                        <option value="Custom">Custom</option>
                        <option value="Tiered CF">Tiered CF</option>
                      </select>
                    </div>

                    {formData.compensationModel === 'Tiered CF' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tier Configuration <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.tieredCFConfigId}
                          onChange={(e) => setFormData({ ...formData, tieredCFConfigId: e.target.value })}
                          required
                          className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a tier configuration</option>
                          {tierConfigs.map(config => (
                            <option key={config.id} value={config.id}>{config.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
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
                          value={formData.newSalary}
                          onChange={(e) => setFormData({ ...formData, newSalary: Number(e.target.value) })}
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
                        value={formData.newFTE}
                        onChange={(e) => setFormData({ ...formData, newFTE: Number(e.target.value) })}
                        required
                        step="0.01"
                        min="0"
                        max="1"
                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 mb-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current CF</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          value={conversionFactor}
                          disabled
                          className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>

                    {formData.compensationModel !== 'Tiered CF' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New CF <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                          </div>
                          <input
                            type="number"
                            value={formData.newConversionFactor}
                            onChange={(e) => setFormData({ ...formData, newConversionFactor: Number(e.target.value) })}
                            required
                            step="0.01"
                            className="block w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.compensationModel === 'Tiered CF' && formData.tieredCFConfigId && selectedTierDetails && (
                    <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50/50 shadow-sm">
                      <div className="border-b border-gray-200 bg-white px-6 py-4 rounded-t-lg">
                        <h4 className="text-base font-semibold text-gray-900">Selected Configuration: {selectedTierDetails.name}</h4>
                      </div>
                      <div className="p-6">
                        {selectedTierDetails.tiers && selectedTierDetails.tiers.length > 0 ? (
                          <div className="space-y-4">
                            {selectedTierDetails.tiers.map((tier, index) => (
                              <div 
                                key={index} 
                                className="flex items-center justify-between rounded-md bg-white p-4 shadow-sm border border-gray-100"
                              >
                                <div className="space-y-1">
                                  <span className="text-base font-medium text-gray-900">
                                    {index === 0 ? 'Base' : `Tier ${index}`}
                                  </span>
                                  <p className="text-base text-gray-600">
                                    {index === selectedTierDetails.tiers!.length - 1 
                                      ? `${tier.wrvuThreshold}+ wRVUs` 
                                      : `${tier.wrvuThreshold}-${selectedTierDetails.tiers![index + 1].wrvuThreshold} wRVUs`}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-semibold text-blue-600">${tier.conversionFactor.toFixed(2)}</span>
                                  <p className="text-base text-gray-600">per wRVU</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-base text-gray-600 text-center py-4">No tiers configured</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Change <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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