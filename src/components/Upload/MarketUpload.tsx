'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import UploadSection from './UploadSection';

interface MarketUploadProps {
  onPreview: (data: any[] | null, columns: { key: string; header: string; formatter?: (value: any) => string }[], mode: 'append' | 'clear') => void;
}

export default function MarketUpload({ onPreview }: MarketUploadProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'append' | 'clear'>('append');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      onPreview(transformedData, columns, uploadMode);
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

      alert(`Successfully uploaded ${result.count} market data records`);
      router.push('/admin/market-data');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setError(null);
    onPreview(null, [], uploadMode); // Clear the preview
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Market Data</h2>
          <p className="mt-1 text-sm text-gray-500">
            Upload market data for provider specialties. Loaded annually from survey data.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/api/templates/market'}
          className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <DocumentArrowDownIcon className="w-4 h-4 mr-1.5" />
          Template
        </button>
      </div>

      <div className="space-y-4">
        <UploadSection
          onFileSelect={handleFileSelect}
          accept=".csv,.xlsx,.xls"
          maxSize={5 * 1024 * 1024}
        />
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
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
                      handleFileSelect(file); // Refresh preview with new mode
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </div>
            </label>
            <span className={`text-sm ${uploadMode === 'clear' ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
              Clear & Replace
            </span>
          </div>
          {uploadMode === 'clear' && (
            <span className="text-orange-600 text-sm">
              Warning: This will delete existing data
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        {file && (
          <div className="flex justify-end gap-3">
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
        )}
      </div>
    </div>
  );
} 