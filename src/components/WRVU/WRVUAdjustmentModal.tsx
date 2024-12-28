'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { WRVUAdjustmentFormData, MonthlyValues, WRVUAdjustment } from '@/types/wrvu-adjustment';
import { createWRVUAdjustment, updateWRVUAdjustment } from '@/services/wrvu-adjustment';
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

interface WRVUAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adjustment: WRVUAdjustment) => void;
  providerId: string;
  initialData?: WRVUAdjustment;
}

const defaultMonthlyValues: MonthlyValues = {
  jan: 0, feb: 0, mar: 0, apr: 0, may: 0, jun: 0,
  jul: 0, aug: 0, sep: 0, oct: 0, nov: 0, dec: 0
};

export default function WRVUAdjustmentModal({
  isOpen,
  onClose,
  onSubmit,
  providerId,
  initialData
}: WRVUAdjustmentModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<WRVUAdjustmentFormData>(() => ({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    year: initialData?.year ?? new Date().getFullYear(),
    providerId,
    monthlyValues: initialData ? {
      jan: initialData.jan,
      feb: initialData.feb,
      mar: initialData.mar,
      apr: initialData.apr,
      may: initialData.may,
      jun: initialData.jun,
      jul: initialData.jul,
      aug: initialData.aug,
      sep: initialData.sep,
      oct: initialData.oct,
      nov: initialData.nov,
      dec: initialData.dec
    } : defaultMonthlyValues
  }));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log('Submitting form data:', formData);

      if (initialData && !initialData.id) {
        throw new Error('Missing adjustment ID for update');
      }

      const response = initialData
        ? await updateWRVUAdjustment(initialData.id!, formData)
        : await createWRVUAdjustment(formData);

      if (!response.success || !response.data) {
        toast({
          title: 'Error',
          description: response.error || 'Failed to save adjustment',
          variant: 'destructive'
        });
        return;
      }

      onSubmit(response.data);
      onClose();
      toast({
        title: 'Success',
        description: `Successfully ${initialData ? 'updated' : 'created'} adjustment`,
      });
    } catch (error) {
      console.error('Error saving adjustment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMonthlyValueChange = (month: keyof MonthlyValues, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      monthlyValues: {
        ...prev.monthlyValues,
        [month]: numValue
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit wRVU Adjustment' : 'Add wRVU Adjustment'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Adjustment Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="EMR Go Live Adj"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                min={2020}
                max={2050}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Productivity loss compensation"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {MONTHS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.monthlyValues[key as keyof MonthlyValues]}
                  onChange={(e) => handleMonthlyValueChange(key as keyof MonthlyValues, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Add'} Adjustment
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 