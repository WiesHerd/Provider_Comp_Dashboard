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
import { Plus, ChevronRight, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TierConfig {
  id: string;
  name: string;
  description: string | null;
  thresholdType: string;
  status: string;
  effectiveDate: string;
  updatedAt: string;
}

export default function TierConfigs() {
  const router = useRouter();
  const [configs, setConfigs] = useState<TierConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/compensation/tier-configs');
      if (!response.ok) throw new Error('Failed to load configurations');
      const data = await response.json();
      setConfigs(data);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;
    
    try {
      const response = await fetch(`/api/compensation/tier-configs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400) {
          toast.error(data.error || 'Cannot delete this configuration');
          return;
        }
        throw new Error('Failed to delete configuration');
      }
      
      toast.success('Configuration deleted successfully');
      loadConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
      toast.error('Failed to delete configuration');
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-8">
      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tier Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage provider compensation tiers and conversion factors.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-4 text-gray-700"
              onClick={() => {/* Export logic */}}
            >
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>
            <Button
              onClick={() => router.push('/admin/compensation/tier-configs/new')}
              size="sm"
              className="h-9 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Configuration
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="py-3 px-4 text-xs font-medium text-gray-500">Name</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium text-gray-500">Description</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium text-gray-500">Type</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium text-gray-500">Status</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium text-gray-500">Effective Date</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium text-gray-500">Last Modified</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium text-gray-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center text-sm text-gray-500">
                      <p>No configurations found</p>
                      <Button
                        variant="link"
                        onClick={() => router.push('/admin/compensation/tier-configs/new')}
                        className="mt-2 text-[#4F46E5] hover:text-[#4338CA]"
                      >
                        Add your first configuration
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                configs.map((config) => (
                  <TableRow
                    key={config.id}
                    className="group cursor-pointer hover:bg-gray-50/50"
                    onClick={() => router.push(`/admin/compensation/tier-configs/${config.id}`)}
                  >
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{config.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-gray-500">
                      {config.description || '-'}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-gray-900">
                      {config.thresholdType}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        config.status === 'Active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {config.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-gray-500">
                      {new Date(config.effectiveDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-sm text-gray-500">
                      {new Date(config.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div 
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(config.id);
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                          </Button>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 