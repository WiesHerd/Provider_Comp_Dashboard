'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ProviderUpload from '@/components/Upload/ProviderUpload';
import MarketUpload from '@/components/Upload/MarketUpload';
import WRVUUpload from '@/components/Upload/WRVUUpload';

interface PreviewData {
  data: any[];
  columns: any[];
  mode: 'append' | 'clear';
  type: 'provider' | 'market' | 'wrvu';
  file: File;
}

const ROWS_PER_PAGE = 5;

export default function UploadPage() {
  const router = useRouter();
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handlePreview = (data: any[] | null, columns: any[], mode: 'append' | 'clear', type: 'provider' | 'market' | 'wrvu', file: File) => {
    if (data) {
      setPreviewData({ data, columns, mode, type, file });
      setCurrentPage(1); // Reset to first page when new data is loaded
    } else {
      setPreviewData(null);
    }
  };

  const handleCancel = () => {
    setPreviewData(null);
    setCurrentPage(1);
  };

  const handleUpload = async () => {
    if (!previewData) return;

    try {
      setIsUploading(true);
      const endpoint = `/api/upload/${previewData.type}`;
      const formData = new FormData();
      formData.append('file', previewData.file);
      formData.append('mode', previewData.mode);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      alert(`Successfully uploaded ${result.count} records`);
      
      switch (previewData.type) {
        case 'provider':
          router.push('/admin/providers');
          break;
        case 'market':
          router.push('/admin/market-data');
          break;
        case 'wrvu':
          router.push('/admin/wrvu-data');
          break;
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const totalPages = previewData ? Math.ceil(previewData.data.length / ROWS_PER_PAGE) : 0;
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentData = previewData?.data.slice(startIndex, endIndex) || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Data Upload</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <ProviderUpload onPreview={(data, columns, mode, file) => handlePreview(data, columns, mode, 'provider', file)} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <MarketUpload onPreview={(data, columns, mode, file) => handlePreview(data, columns, mode, 'market', file)} />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <WRVUUpload onPreview={(data, columns, mode, file) => handlePreview(data, columns, mode, 'wrvu', file)} />
        </div>
      </div>

      {previewData && (
        <div className="bg-white rounded-lg shadow mt-6 p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-medium text-gray-900">Data Preview</h2>
              <span className="text-sm text-gray-500">
                {previewData.type === 'provider' && 'Provider Data'}
                {previewData.type === 'market' && 'Market Data'}
                {previewData.type === 'wrvu' && 'wRVU Data'}
              </span>
            </div>
            <div className="flex gap-3">
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
                {currentData.map((row: any, index: number) => (
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
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(endIndex, previewData.data.length)} of {previewData.data.length} records
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4 mr-1" />
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 