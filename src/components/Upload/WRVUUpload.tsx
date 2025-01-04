'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import UploadSection from './UploadSection';

interface WRVUUploadProps {
  onPreview: (data: any[] | null, columns: any[], mode: 'append' | 'clear', file: File | null) => void;
  previewData?: { data: any[]; columns: any[]; mode: string } | null;
}

export default function WRVUUpload({ onPreview, previewData }: WRVUUploadProps) {
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
      const response = await fetch('/api/clear/wrvu', {
        method: 'POST'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear data');
      }

      toast.success(`Successfully cleared ${result.count} wRVU records`);
      router.push('/admin/wrvu-data');
      router.refresh();
    } catch (err) {
      console.error('Error clearing wRVU data:', err);
      toast.error('Failed to clear wRVU data');
    } finally {
      setIsClearing(false);
      setIsConfirmDialogOpen(false);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    
    try {
      console.log('Preparing to upload wRVU file:', selectedFile.name);
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('Sending wRVU preview request...');
      const response = await fetch('/api/upload/wrvu/preview', {
        method: 'POST',
        body: formData,
      });

      console.log('wRVU preview response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('wRVU preview error:', errorData);
        throw new Error(errorData.error || 'Failed to preview wRVU file');
      }

      const result = await response.json();
      console.log('wRVU preview result:', result);
      
      const formatNumber = (value: number | string) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof num !== 'number' || isNaN(num)) {
          console.warn('Invalid number value:', value);
          return 0;
        }
        return num;
      };

      // Transform the data to match the API expectations
      console.log('Transforming wRVU data...');
      const transformedData = result.data.map((row: any) => {
        const transformed = {
          employee_id: row.employee_id,
          first_name: row.first_name,
          last_name: row.last_name,
          specialty: row.specialty,
          jan: formatNumber(row.Jan),
          feb: formatNumber(row.Feb),
          mar: formatNumber(row.Mar),
          apr: formatNumber(row.Apr),
          may: formatNumber(row.May),
          jun: formatNumber(row.Jun),
          jul: formatNumber(row.Jul),
          aug: formatNumber(row.Aug),
          sep: formatNumber(row.Sep),
          oct: formatNumber(row.Oct),
          nov: formatNumber(row.Nov),
          dec: formatNumber(row.Dec)
        };
        console.log('Transformed row:', transformed);
        return transformed;
      });

      const columns = [
        { key: 'employee_id', header: 'EMPLOYEE ID' },
        { key: 'first_name', header: 'FIRST NAME' },
        { key: 'last_name', header: 'LAST NAME' },
        { key: 'specialty', header: 'SPECIALTY' },
        { key: 'jan', header: 'JAN', formatter: formatNumber },
        { key: 'feb', header: 'FEB', formatter: formatNumber },
        { key: 'mar', header: 'MAR', formatter: formatNumber },
        { key: 'apr', header: 'APR', formatter: formatNumber },
        { key: 'may', header: 'MAY', formatter: formatNumber },
        { key: 'jun', header: 'JUN', formatter: formatNumber },
        { key: 'jul', header: 'JUL', formatter: formatNumber },
        { key: 'aug', header: 'AUG', formatter: formatNumber },
        { key: 'sep', header: 'SEP', formatter: formatNumber },
        { key: 'oct', header: 'OCT', formatter: formatNumber },
        { key: 'nov', header: 'NOV', formatter: formatNumber },
        { key: 'dec', header: 'DEC', formatter: formatNumber }
      ];

      onPreview(transformedData, columns, uploadMode, selectedFile);
    } catch (err) {
      console.error('wRVU file selection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview wRVU file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError(null);

      console.log('Starting wRVU file upload:', file.name);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', uploadMode);

      console.log('Sending wRVU upload request...');
      const response = await fetch('/api/upload/wrvu', {
        method: 'POST',
        body: formData,
      });

      console.log('wRVU upload response status:', response.status);
      let result;
      try {
        result = await response.json();
        console.log('wRVU upload result:', result);
      } catch (e) {
        console.error('wRVU response parsing error:', e);
        throw new Error('Server response was invalid');
      }

      if (!response.ok) {
        console.error('wRVU upload failed:', result);
        throw new Error(result.message || result.error || 'Upload failed');
      }

      toast.success(`Successfully uploaded ${result.count} wRVU records`);
      router.push('/admin/wrvu-data');
    } catch (err) {
      console.error('wRVU upload error:', err);
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
        title="Clear wRVU Data"
        message="Are you sure you want to clear all wRVU data? This action cannot be undone."
        warningMessage="This will permanently delete all wRVU records from the database."
        confirmButtonText="Clear Data"
      />
    </div>
  );
} 