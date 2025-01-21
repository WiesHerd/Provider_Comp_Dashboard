'use client';

import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { AdditionalPay, AdditionalPayFormData, MonthlyValues } from '@/types/additional-pay';
import { useToast } from '@/components/ui/use-toast';

const MONTHS = [
  { key: 'jan', label: 'Jan' },
  { key: 'feb', label: 'Feb' },
  { key: 'mar', label: 'Mar' },
  { key: 'apr', label: 'Apr' },
  { key: 'may', label: 'May' },
  { key: 'jun', label: 'Jun' },
  { key: 'jul', label: 'Jul' },
  { key: 'aug', label: 'Aug' },
  { key: 'sep', label: 'Sep' },
  { key: 'oct', label: 'Oct' },
  { key: 'nov', label: 'Nov' },
  { key: 'dec', label: 'Dec' }
] as const;

interface AdditionalPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adjustment: AdditionalPayFormData) => void;
  providerId: string;
  initialData?: AdditionalPay & Partial<MonthlyValues>;
}

const defaultMonthlyValues: MonthlyValues = {
  jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
  jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
};

export default function AdditionalPayModal({
  isOpen,
  onClose,
  onSubmit,
  providerId,
  initialData
}: AdditionalPayModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<AdditionalPayFormData>(() => ({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    year: initialData?.year ?? new Date().getFullYear(),
    providerId,
    monthlyValues: initialData ? {
      jan: initialData.jan ?? 0,
      feb: initialData.feb ?? 0,
      mar: initialData.mar ?? 0,
      apr: initialData.apr ?? 0,
      may: initialData.may ?? 0,
      jun: initialData.jun ?? 0,
      jul: initialData.jul ?? 0,
      aug: initialData.aug ?? 0,
      sep: initialData.sep ?? 0,
      oct: initialData.oct ?? 0,
      nov: initialData.nov ?? 0,
      dec: initialData.dec ?? 0
    } : { ...defaultMonthlyValues }
  }));

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name ?? '',
        description: initialData?.description ?? '',
        year: initialData?.year ?? new Date().getFullYear(),
        providerId,
        monthlyValues: initialData ? {
          jan: initialData.jan ?? 0,
          feb: initialData.feb ?? 0,
          mar: initialData.mar ?? 0,
          apr: initialData.apr ?? 0,
          may: initialData.may ?? 0,
          jun: initialData.jun ?? 0,
          jul: initialData.jul ?? 0,
          aug: initialData.aug ?? 0,
          sep: initialData.sep ?? 0,
          oct: initialData.oct ?? 0,
          nov: initialData.nov ?? 0,
          dec: initialData.dec ?? 0
        } : { ...defaultMonthlyValues }
      });
    }
  }, [isOpen, initialData, providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Name is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting additional pay:', error);
      toast({
        title: 'Error',
        description: 'Failed to save additional pay',
        variant: 'destructive'
      });
    }
  };

  const handleMonthlyValueChange = (month: keyof MonthlyValues, value: string) => {
    // Convert empty string to 0, otherwise parse as float
    const numericValue = value === '' ? 0 : parseFloat(value);
    
    // Ensure the value is a valid number
    if (isNaN(numericValue)) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      monthlyValues: {
        ...prev.monthlyValues,
        [month]: numericValue
      }
    }));
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
        
        <Dialog.Panel className="relative bg-white rounded-xl shadow-xl w-[500px] transform transition-all">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <Dialog.Title className="text-lg font-medium text-gray-900">
              {initialData ? 'Edit Additional Pay' : 'Add Additional Pay'}
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
                  Additional Pay Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter description (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {MONTHS.map(month => (
                  <div key={month.key} className="flex items-center">
                    <label className="w-20">{month.label}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.monthlyValues[month.key as keyof MonthlyValues] || ''}
                      onChange={(e) => handleMonthlyValueChange(month.key as keyof MonthlyValues, e.target.value)}
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
                {initialData ? 'Save Changes' : 'Add Adjustment'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 