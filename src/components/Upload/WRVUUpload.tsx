'use client';

import { useState } from 'react';
import UploadSection from './UploadSection';

interface WRVUUploadProps {
  onPreview: (data: any[], columns: any[], mode: 'append' | 'clear', type: 'provider' | 'market' | 'wrvu', file: File) => void;
  previewData?: { data: any[]; columns: any[]; mode: string } | null;
}

export default function WRVUUpload({ onPreview, previewData }: WRVUUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'append' | 'clear'>('append');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/upload/wrvu/preview', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to preview file');
      }

      const result = await response.json();
      
      const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      };
      
      const columns = [
        { key: 'employee_id', header: 'Employee ID' },
        { key: 'first_name', header: 'First Name' },
        { key: 'last_name', header: 'Last Name' },
        { key: 'specialty', header: 'Specialty' },
        { key: 'year', header: 'Year' },
        { key: 'Jan', header: 'Jan', formatter: formatNumber },
        { key: 'Feb', header: 'Feb', formatter: formatNumber },
        { key: 'Mar', header: 'Mar', formatter: formatNumber },
        { key: 'Apr', header: 'Apr', formatter: formatNumber },
        { key: 'May', header: 'May', formatter: formatNumber },
        { key: 'Jun', header: 'Jun', formatter: formatNumber },
        { key: 'Jul', header: 'Jul', formatter: formatNumber },
        { key: 'Aug', header: 'Aug', formatter: formatNumber },
        { key: 'Sep', header: 'Sep', formatter: formatNumber },
        { key: 'Oct', header: 'Oct', formatter: formatNumber },
        { key: 'Nov', header: 'Nov', formatter: formatNumber },
        { key: 'Dec', header: 'Dec', formatter: formatNumber }
      ];

      onPreview(result.data, columns, uploadMode, 'wrvu', selectedFile);
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