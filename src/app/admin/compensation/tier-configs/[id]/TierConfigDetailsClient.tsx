'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TierForm } from '@/components/tier-management/TierForm';
import { formatNumber, formatDollars } from '@/lib/utils';

interface Tier {
  id: string;
  name: string;
  wrvuThreshold: number;
  conversionFactor: number;
  description?: string;
}

interface TierConfig {
  id: string;
  name: string;
  description: string | null;
  thresholdType: string;
  status: string;
  effectiveDate: string;
  updatedAt: string;
  tiers: Tier[];
}

export default function TierConfigDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const [config, setConfig] = useState<TierConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTierForm, setShowTierForm] = useState(false);
  const [editingTier, setEditingTier] = useState<Tier | null>(null);

  useEffect(() => {
    if (id) {
      loadConfig();
    }
  }, [id]);

  const loadConfig = async () => {
    try {
      const response = await fetch(`/api/compensation/tier-configs/${id}`);
      if (!response.ok) throw new Error('Failed to load configuration');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTier = async (data: Omit<Tier, 'id'>) => {
    try {
      const response = await fetch(`/api/compensation/tier-configs/${id}/tiers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to add tier');
      
      toast.success('Tier added successfully');
      loadConfig();
    } catch (error) {
      console.error('Error adding tier:', error);
      toast.error('Failed to add tier');
      throw error;
    }
  };

  const handleEditTier = async (data: Omit<Tier, 'id'>) => {
    if (!editingTier) return;
    
    try {
      console.log('Sending update request with data:', data);
      const response = await fetch(`/api/compensation/tier-configs/${id}/tiers/${editingTier.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          wrvuThreshold: Number(data.wrvuThreshold),
          conversionFactor: Number(data.conversionFactor)
        }),
      });
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update tier');
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          throw new Error('Server error: Failed to update tier');
        }
      }
      
      const updatedTier = await response.json();
      console.log('Update successful:', updatedTier);
      
      toast.success('Tier updated successfully');
      loadConfig();
      setShowTierForm(false);
      setEditingTier(null);
    } catch (error) {
      console.error('Error updating tier:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update tier');
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this tier?')) return;
    
    try {
      const response = await fetch(`/api/compensation/tier-configs/${id}/tiers/${tierId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete tier');
      
      toast.success('Tier deleted successfully');
      loadConfig();
    } catch (error) {
      console.error('Error deleting tier:', error);
      toast.error('Failed to delete tier');
    }
  };

  if (loading || !config) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{config.name}</h1>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                config.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {config.status}
              </span>
            </div>
            <Button
              size="sm"
              className="h-9 w-[120px] px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              onClick={() => router.push('/admin/compensation/tier-configs')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">
              {config.description || 'Configure compensation tiers and conversion factors.'}
            </p>
          </div>

          <div className="flex items-center gap-8 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Type</span>
              <span className="text-sm text-gray-900">{config.thresholdType}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Effective</span>
              <span className="text-sm text-gray-900">{new Date(config.effectiveDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Modified</span>
              <span className="text-sm text-gray-900">{new Date(config.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tiers Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 flex justify-between items-center border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Tiers</h2>
            <p className="mt-1 text-sm text-gray-500">
              Configure compensation tiers and their conversion factors.
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingTier(null);
              setShowTierForm(true);
            }}
            size="sm"
            className="h-9 w-[120px] px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Tier
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-4 px-6 text-sm font-medium text-[#6B7280]">Name</TableHead>
                <TableHead className="py-4 px-6 text-sm font-medium text-[#6B7280]">wRVU Threshold</TableHead>
                <TableHead className="py-4 px-6 text-sm font-medium text-[#6B7280]">Conversion Factor</TableHead>
                <TableHead className="py-4 px-6 text-sm font-medium text-[#6B7280] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.tiers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-sm text-gray-500">
                      <p>No tiers configured</p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setEditingTier(null);
                          setShowTierForm(true);
                        }}
                        className="mt-2 text-[#4F46E5] hover:text-[#4338CA]"
                      >
                        Add your first tier
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                config.tiers.map((tier) => (
                  <TableRow 
                    key={tier.id} 
                    className="group hover:bg-gray-50/50"
                  >
                    <TableCell className="py-4 px-6">
                      <span className="font-medium text-gray-900">{tier.name}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-gray-900">{formatNumber(tier.wrvuThreshold)}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <span className="text-gray-900">{formatDollars(tier.conversionFactor)}</span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTier({
                              ...tier,
                              wrvuThreshold: Number(tier.wrvuThreshold),
                              conversionFactor: Number(tier.conversionFactor)
                            });
                            setShowTierForm(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTier(tier.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TierForm
        open={showTierForm}
        onClose={() => {
          setShowTierForm(false);
          setEditingTier(null);
        }}
        onSubmit={editingTier ? handleEditTier : handleAddTier}
        initialData={editingTier || undefined}
        title={editingTier ? 'Edit Tier' : 'Add New Tier'}
      />
    </div>
  );
} 