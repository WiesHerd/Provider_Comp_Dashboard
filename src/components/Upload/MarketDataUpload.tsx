'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import UploadSection from './UploadSection';

interface MarketDataUploadProps {
  onPreview: (data: any[], columns: any[], mode: string, file: File) => void;
}

export default function MarketDataUpload({ onPreview }: MarketDataUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    
    try {
      console.log('Preparing to upload market data file:', selectedFile.name);
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('Sending market data preview request...');
      const response = await fetch('/api/upload/market/preview', {
        method: 'POST',
        body: formData,
      });

      console.log('Market data preview response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Market data preview error:', errorData);
        throw new Error(errorData.error || 'Failed to preview market data file');
      }

      const result = await response.json();
      console.log('Market data preview result:', result);
      
      const columns = [
        { key: 'specialty', header: 'Specialty' },
        { key: 'tcc_25', header: 'TCC 25th', formatter: (value: number) => 
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        },
        { key: 'tcc_50', header: 'TCC 50th', formatter: (value: number) => 
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        },
        { key: 'tcc_75', header: 'TCC 75th', formatter: (value: number) => 
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        },
        { key: 'tcc_90', header: 'TCC 90th', formatter: (value: number) => 
          new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }).format(value)
        },
        { key: 'wrvu_25', header: 'wRVU 25th' },
        { key: 'wrvu_50', header: 'wRVU 50th' },
        { key: 'wrvu_75', header: 'wRVU 75th' },
        { key: 'wrvu_90', header: 'wRVU 90th' },
        { key: 'cf_25', header: 'CF 25th' },
        { key: 'cf_50', header: 'CF 50th' },
        { key: 'cf_75', header: 'CF 75th' },
        { key: 'cf_90', header: 'CF 90th' }
      ];

      onPreview(result.data, columns, 'replace', selectedFile);
    } catch (err) {
      console.error('Market data file selection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview market data file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError(null);

      console.log('Starting market data file upload:', file.name);
      const formData = new FormData();
      formData.append('file', file);

      console.log('Sending market data upload request...');
      const response = await fetch('/api/upload/market', {
        method: 'POST',
        body: formData,
      });

      console.log('Market data upload response status:', response.status);
      let result;
      try {
        result = await response.json();
        console.log('Market data upload result:', result);
      } catch (e) {
        console.error('Market data response parsing error:', e);
        throw new Error('Server response was invalid');
      }

      if (!response.ok) {
        console.error('Market data upload failed:', result);
        throw new Error(result.message || result.error || 'Upload failed');
      }

      toast.success(`Successfully uploaded ${result.count} market data records`);
      router.push('/admin/market-data');
    } catch (err) {
      console.error('Market data upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <UploadSection
        onFileSelect={handleFileSelect}
        accept=".csv,.xlsx,.xls"
        maxSize={5 * 1024 * 1024} // 5MB
      />
      {error && (
        <div className="text-red-500 text-sm mt-2">
          {error}
        </div>
      )}
      {file && !error && (
        <div className="mt-4">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`
              px-4 py-2 text-white rounded-md
              ${isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'}
            `}
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
    </div>
  );
} 