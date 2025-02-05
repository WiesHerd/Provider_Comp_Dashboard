'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface NewConfigFormData {
  name: string;
  description: string;
  thresholdType: 'WRVU' | 'Percentile';
  isDefault: boolean;
}

export default function NewTierConfig() {
  const router = useRouter();
  const [formData, setFormData] = useState<NewConfigFormData>({
    name: '',
    description: '',
    thresholdType: 'WRVU',
    isDefault: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/compensation/tier-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create configuration');
      
      const data = await response.json();
      toast.success('Configuration created successfully');
      router.push(`/admin/compensation/tier-configs/${data.id}`);
    } catch (error) {
      console.error('Error creating configuration:', error);
      toast.error('Failed to create configuration');
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Tier Configuration</h1>
        <Button variant="outline" onClick={() => router.push('/admin/compensation/tier-configs')}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Standard wRVU Tiers"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Standard tiered compensation model for primary care"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thresholdType">Threshold Type</Label>
              <select
                id="thresholdType"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1"
                value={formData.thresholdType}
                onChange={(e) => setFormData({ ...formData, thresholdType: e.target.value as 'WRVU' | 'Percentile' })}
                required
              >
                <option value="WRVU">wRVU Target</option>
                <option value="Percentile">Percentile</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                className="h-4 w-4"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              />
              <Label htmlFor="isDefault">Set as Default Configuration</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="submit">
                Create Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 