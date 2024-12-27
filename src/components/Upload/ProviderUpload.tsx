'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadSection from './UploadSection';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface PreviewData {
  employeeId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  department: string;
  fte: number;
  baseSalary: number;
  compensationModel: string;
}

export default function ProviderUpload() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData[] | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setPreviewData(null);
    setIsConfirming(false);
  };

  const handlePreview = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/provider/preview', {
        method: 'POST',
        body: formData,
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        const errorMessage = result?.error || result?.details || 'Preview failed';
        throw new Error(Array.isArray(errorMessage) ? errorMessage.join('\n') : errorMessage);
      }

      setPreviewData(result.data);
      setIsConfirming(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Preview failed';
      console.error('Preview error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/provider', {
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

      alert(`Successfully uploaded ${result.count} records`);
      setFile(null);
      setPreviewData(null);
      setIsConfirming(false);
      router.push('/admin/providers');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    window.location.href = '/api/templates/provider';
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  return (
    <div className="space-y-4">
      <div className="h-10 flex justify-end">
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <DocumentArrowDownIcon className="w-4 h-4 mr-1.5 text-gray-500" />
          Template
        </button>
      </div>

      <UploadSection
        onFileSelect={handleFileSelect}
        accept=".csv,.xlsx,.xls"
        maxSize={5 * 1024 * 1024} // 5MB
      />

      {file && !isConfirming && (
        <div className="flex justify-end">
          <button
            onClick={handlePreview}
            disabled={isUploading}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              isUploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isUploading ? (
              <>
                <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              'Preview Data'
            )}
          </button>
        </div>
      )}

      {previewData && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Data Preview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FTE
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Salary
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.slice(0, 5).map((provider, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.employeeId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {provider.firstName} {provider.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.specialty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.fte}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatSalary(provider.baseSalary)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{provider.compensationModel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length > 5 && (
            <p className="text-sm text-gray-500 mt-2">
              Showing first 5 of {previewData.length} records
            </p>
          )}
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => {
                setPreviewData(null);
                setIsConfirming(false);
              }}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isUploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading...
                </>
              ) : (
                'Confirm Upload'
              )}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
} 