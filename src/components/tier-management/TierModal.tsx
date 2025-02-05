import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TierFormData) => void;
  initialData?: TierFormData;
  configType: 'WRVU' | 'Percentile';
}

export interface TierFormData {
  name: string;
  threshold: number;
  conversionFactor: number;
}

export function TierModal({ isOpen, onClose, onSubmit, initialData, configType }: TierModalProps) {
  const [formData, setFormData] = React.useState<TierFormData>(() => ({
    name: initialData?.name || '',
    threshold: initialData?.threshold || 0,
    conversionFactor: initialData?.conversionFactor || 0,
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Tier' : 'Add New Tier'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tier Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Base Tier"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="threshold">
              {configType === 'WRVU' ? 'wRVU Threshold' : 'Percentile Threshold'}
            </Label>
            <Input
              id="threshold"
              type="number"
              step="0.01"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: parseFloat(e.target.value) })}
              placeholder={configType === 'WRVU' ? "e.g., 4000" : "e.g., 50"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conversionFactor">Conversion Factor</Label>
            <Input
              id="conversionFactor"
              type="number"
              step="0.01"
              value={formData.conversionFactor}
              onChange={(e) => setFormData({ ...formData, conversionFactor: parseFloat(e.target.value) })}
              placeholder="e.g., 45.00"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Save Changes' : 'Add Tier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 