'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TargetAdjustment, TargetAdjustmentFormData, MonthlyValues } from '@/types/target-adjustment';
import { useToast } from '@/components/ui/use-toast';

const MONTHS = [
  { key: 'jan', label: 'January' },
  { key: 'feb', label: 'February' },
  { key: 'mar', label: 'March' },
  { key: 'apr', label: 'April' },
  { key: 'may', label: 'May' },
  { key: 'jun', label: 'June' },
  { key: 'jul', label: 'July' },
  { key: 'aug', label: 'August' },
  { key: 'sep', label: 'September' },
  { key: 'oct', label: 'October' },
  { key: 'nov', label: 'November' },
  { key: 'dec', label: 'December' }
] as const;

interface TargetAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adjustment: TargetAdjustmentFormData) => void;
  providerId: string;
  initialData?: TargetAdjustment & Partial<MonthlyValues>;
}

const defaultMonthlyValues: MonthlyValues = {
  jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
  jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
};

export default function TargetAdjustmentModal({
  isOpen,
  onClose,
  onSubmit,
  providerId,
  initialData
}: TargetAdjustmentModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<TargetAdjustmentFormData>(() => ({
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
      console.error('Error submitting target adjustment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save target adjustment',
        variant: 'destructive'
      });
    }
  };

  const handleMonthlyValueChange = (month: keyof MonthlyValues, value: string) => {
    const numericValue = value === '' ? 0 : Number(value);
    setFormData(prev => ({
      ...prev,
      monthlyValues: {
        ...prev.monthlyValues,
        [month]: numericValue
      }
    }));
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium">
                    {initialData ? 'Edit Target Adjustment' : 'Add Target Adjustment'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {MONTHS.map(({ key, label }) => (
                      <div key={key}>
                        <label htmlFor={key} className="block text-sm font-medium text-gray-700">
                          {label}
                        </label>
                        <input
                          type="number"
                          id={key}
                          value={formData.monthlyValues[key] || ''}
                          onChange={e => handleMonthlyValueChange(key, e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {initialData ? 'Save Changes' : 'Add Adjustment'}
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
} 