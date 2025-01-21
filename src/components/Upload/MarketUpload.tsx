'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadSection from './UploadSection';

interface MarketUploadProps {
  onPreview: (data: any[], columns: any[], mode: 'append' | 'clear', type: 'provider' | 'market' | 'wrvu', file: File) => void;
  previewData?: { data: any[]; columns: any[]; mode: string } | null;
}

export default function MarketUpload({ onPreview, previewData }: MarketUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'append' | 'clear'>('append');
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to preview file');
      }

      const result = await response.json();
      
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      };

      const formatDecimal = (value: number) => {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(value);
      };
      
      const columns = [
        { key: 'specialty', header: 'Specialty' },
        { key: 'p25_TCC', header: '25th TCC', formatter: formatCurrency },
        { key: 'p50_TCC', header: '50th TCC', formatter: formatCurrency },
        { key: 'p75_TCC', header: '75th TCC', formatter: formatCurrency },
        { key: 'p90_TCC', header: '90th TCC', formatter: formatCurrency },
        { key: 'p25_wrvu', header: '25th wRVU', formatter: formatDecimal },
        { key: 'p50_wrvu', header: '50th wRVU', formatter: formatDecimal },
        { key: 'p75_wrvu', header: '75th wRVU', formatter: formatDecimal },
        { key: 'p90_wrvu', header: '90th wRVU', formatter: formatDecimal },
        { key: 'p25_cf', header: '25th CF', formatter: formatDecimal },
        { key: 'p50_cf', header: '50th CF', formatter: formatDecimal },
        { key: 'p75_cf', header: '75th CF', formatter: formatDecimal },
        { key: 'p90_cf', header: '90th CF', formatter: formatDecimal }
      ];

      onPreview(result.data, columns, uploadMode, 'market', selectedFile);
    } catch (err) {
      console.error('File selection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview file');
    }
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
      </div>
    </div>
  );
} 