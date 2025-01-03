'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import UploadSection from './UploadSection';

interface MarketUploadProps {
  onPreview: (data: any[] | null, columns: any[], mode: 'append' | 'clear', file: File | null) => void;
  previewData?: { data: any[]; columns: any[]; mode: string } | null;
}

export default function MarketUpload({ onPreview, previewData }: MarketUploadProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'append' | 'clear'>('append');
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleClearData = async () => {
    try {
      setIsClearing(true);
      const response = await fetch('/api/clear/market', {
        method: 'POST'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear data');
      }

      toast.success(`Successfully cleared ${result.count} market data records`);
      router.push('/admin/market-data');
      router.refresh();
    } catch (err) {
      console.error('Error clearing market data:', err);
      toast.error('Failed to clear market data');
    } finally {
      setIsClearing(false);
      setIsConfirmDialogOpen(false);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload/market/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to preview file');
      }

      const result = await response.json();
      
      const formatCurrency = (value: number) => {
        if (typeof value !== 'number' || isNaN(value)) return '$0';
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      };

      const formatNumber = (value: number) => {
        if (typeof value !== 'number' || isNaN(value)) return '0.0';
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value);
      };

      // Transform the data to match prisma schema
      const transformedData = result.data.map((row: any) => ({
        specialty: row.specialty,
        p25_total: row.p25_TCC,
        p50_total: row.p50_TCC,
        p75_total: row.p75_TCC,
        p90_total: row.p90_TCC,
        p25_wrvu: row.p25_wrvu,
        p50_wrvu: row.p50_wrvu,
        p75_wrvu: row.p75_wrvu,
        p90_wrvu: row.p90_wrvu,
        p25_cf: row.p25_cf,
        p50_cf: row.p50_cf,
        p75_cf: row.p75_cf,
        p90_cf: row.p90_cf,
      }));

      const columns = [
        { key: 'specialty', header: 'Specialty' },
        { key: 'p25_total', header: '25th Percentile TCC', formatter: formatCurrency },
        { key: 'p50_total', header: 'Median TCC', formatter: formatCurrency },
        { key: 'p75_total', header: '75th Percentile TCC', formatter: formatCurrency },
        { key: 'p90_total', header: '90th Percentile TCC', formatter: formatCurrency },
        { key: 'p25_wrvu', header: '25th Percentile wRVU', formatter: formatNumber },
        { key: 'p50_wrvu', header: 'Median wRVU', formatter: formatNumber },
        { key: 'p75_wrvu', header: '75th Percentile wRVU', formatter: formatNumber },
        { key: 'p90_wrvu', header: '90th Percentile wRVU', formatter: formatNumber },
        { key: 'p25_cf', header: '25th Percentile CF', formatter: formatNumber },
        { key: 'p50_cf', header: 'Median CF', formatter: formatNumber },
        { key: 'p75_cf', header: '75th Percentile CF', formatter: formatNumber },
        { key: 'p90_cf', header: '90th Percentile CF', formatter: formatNumber },
      ];

      onPreview(transformedData, columns, uploadMode, selectedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', uploadMode);

      const response = await fetch('/api/upload/market', {
        method: 'POST',
        body: formData,
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error('Response parsing error:', e);
        throw new Error('Server response was invalid');
      }

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Upload failed');
      }

      toast.success(`Successfully uploaded ${result.count} market data records`);
      router.push('/admin/market-data');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setError(null);
    onPreview(null, [], uploadMode, null); // Clear the preview
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <UploadSection
          onFileSelect={handleFileSelect}
          accept=".csv,.xlsx,.xls"
          maxSize={5 * 1024 * 1024}
        />

        <div className="flex items-center justify-center gap-2">
          <span className={`text-sm ${uploadMode === 'append' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
            Append Data
          </span>
          <label className="inline-flex items-center">
            <div className="relative">
              <input
                type="checkbox"
                checked={uploadMode === 'clear'}
                onChange={(e) => {
                  const newMode = e.target.checked ? 'clear' : 'append';
                  setUploadMode(newMode);
                  if (file) {
                    handleFileSelect(file);
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500" />
            </div>
          </label>
          <span className={`text-sm ${uploadMode === 'clear' ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
            Clear & Replace
          </span>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        {previewData && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Data Preview</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {previewData.columns.map((column: any) => (
                      <th 
                        key={column.key}
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.data.slice(0, 5).map((row: any, index: number) => (
                    <tr key={index}>
                      {previewData.columns.map((column: any) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {column.formatter ? column.formatter(row[column.key]) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.data.length > 5 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 5 of {previewData.data.length} records
              </p>
            )}
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleClearData}
        title="Clear Market Data"
        message="Are you sure you want to clear all market data? This action cannot be undone."
        warningMessage="This will permanently delete all market data records from the database."
        confirmButtonText="Clear Data"
      />
    </div>
  );
} 