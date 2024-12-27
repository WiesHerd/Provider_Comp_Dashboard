import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WRVUAdjustmentData {
  id?: string;
  employeeId: string;
  name: string;
  description?: string;
  year: number;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  type: string;
  category: string;
  status: string;
}

interface WRVUAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WRVUAdjustmentData) => void;
  mode: 'add' | 'edit';
  initialData?: WRVUAdjustmentData | null;
  employeeId?: string;
}

export default function WRVUAdjustmentModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialData,
  employeeId
}: WRVUAdjustmentModalProps) {
  const [formData, setFormData] = useState<WRVUAdjustmentData>({
    employeeId: '',
    name: '',
    description: '',
    year: new Date().getFullYear(),
    jan: 0,
    feb: 0,
    mar: 0,
    apr: 0,
    may: 0,
    jun: 0,
    jul: 0,
    aug: 0,
    sep: 0,
    oct: 0,
    nov: 0,
    dec: 0,
    type: 'adjustment',
    category: 'operational',
    status: 'active'
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData(initialData);
    } else if (mode === 'add' && employeeId) {
      setFormData(prev => ({ ...prev, employeeId }));
    }
  }, [mode, initialData, employeeId]);

  const handleInputChange = (field: keyof WRVUAdjustmentData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add wRVU Adjustment' : 'Edit wRVU Adjustment'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="year" className="text-right">
              Year
            </Label>
            <Input
              id="year"
              type="number"
              value={formData.year}
              onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="correction">Correction</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange('status', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <Label className="col-span-12">Monthly Adjustments</Label>
            {[
              { month: 'jan', label: 'Jan' },
              { month: 'feb', label: 'Feb' },
              { month: 'mar', label: 'Mar' },
              { month: 'apr', label: 'Apr' },
              { month: 'may', label: 'May' },
              { month: 'jun', label: 'Jun' },
              { month: 'jul', label: 'Jul' },
              { month: 'aug', label: 'Aug' },
              { month: 'sep', label: 'Sep' },
              { month: 'oct', label: 'Oct' },
              { month: 'nov', label: 'Nov' },
              { month: 'dec', label: 'Dec' }
            ].map(({ month, label }) => (
              <div key={month} className="col-span-3">
                <Label htmlFor={month}>{label}</Label>
                <Input
                  id={month}
                  type="number"
                  value={formData[month as keyof WRVUAdjustmentData]}
                  onChange={(e) => handleInputChange(month as keyof WRVUAdjustmentData, parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {mode === 'add' ? 'Add Adjustment' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 