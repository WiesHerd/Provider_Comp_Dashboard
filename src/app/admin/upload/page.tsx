'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import ProviderUpload from '@/components/Upload/ProviderUpload';
import MarketUpload from '@/components/Upload/MarketUpload';
import WRVUUpload from '@/components/Upload/WRVUUpload';
import UploadAlert from '@/components/Alert/UploadAlert';
import ConfirmationDialog from '@/components/Alert/ConfirmationDialog';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ title: '', message: '', type: 'success' });

  // State for confirmation dialogs
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {}
  });

  const handleClearProviderData = async () => {
    try {
      const response = await fetch('/api/clear/provider', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear provider data');
      setAlertConfig({
        title: 'Success',
        message: 'Provider data cleared successfully',
        type: 'success'
      });
      setAlertOpen(true);
    } catch (error) {
      console.error('Error clearing provider data:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Failed to clear provider data',
        type: 'error'
      });
      setAlertOpen(true);
    }
  };

  const handleClearMarketData = async () => {
    try {
      const response = await fetch('/api/clear/market', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear market data');
      setAlertConfig({
        title: 'Success',
        message: 'Market data cleared successfully',
        type: 'success'
      });
      setAlertOpen(true);
    } catch (error) {
      console.error('Error clearing market data:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Failed to clear market data',
        type: 'error'
      });
      setAlertOpen(true);
    }
  };

  const handleClearWRVUData = async () => {
    try {
      const response = await fetch('/api/clear/wrvu', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear wRVU data');
      setAlertConfig({
        title: 'Success',
        message: 'wRVU data cleared successfully',
        type: 'success'
      });
      setAlertOpen(true);
    } catch (error) {
      console.error('Error clearing wRVU data:', error);
      setAlertConfig({
        title: 'Error',
        message: 'Failed to clear wRVU data',
        type: 'error'
      });
      setAlertOpen(true);
    }
  };

  const showConfirmDialog = (type: 'provider' | 'market' | 'wrvu') => {
    const config = {
      provider: {
        title: 'Clear Provider Data',
        message: 'Are you sure you want to clear all provider data? This action cannot be undone.',
        onConfirm: handleClearProviderData
      },
      market: {
        title: 'Clear Market Data',
        message: 'Are you sure you want to clear all market data? This action cannot be undone.',
        onConfirm: handleClearMarketData
      },
      wrvu: {
        title: 'Clear wRVU Data',
        message: 'Are you sure you want to clear all wRVU data? This action cannot be undone.',
        onConfirm: handleClearWRVUData
      }
    }[type];

    setConfirmDialog({
      isOpen: true,
      ...config
    });
  };

  const handlePreview = (data: any[], columns: any[], mode: 'append' | 'clear', type: 'provider' | 'market' | 'wrvu', file: File) => {
    setPreviewData({ data, columns, mode, type, file });
    setCurrentPage(1);
    setUploadError(null);
  };

  const handleUpload = async () => {
    if (!previewData) return;

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', previewData.file);
      formData.append('mode', previewData.mode);

      const response = await fetch(`/api/upload/${previewData.type}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      const result = await response.json();
      
      let title = '';
      let message = '';
      
      if (previewData.type === 'provider') {
        title = 'Provider Data Upload Complete';
        message = `Successfully processed ${result.successCount} out of ${result.totalRows} provider records${
          result.errorCount > 0 ? `\n\nThere were ${result.errorCount} errors during upload. Check the console for details.` : ''
        }`;
      } else if (previewData.type === 'market') {
        title = 'Market Data Upload Complete';
        message = `Successfully processed ${result.successCount} out of ${result.totalRows} market data records${
          result.errorCount > 0 ? `\n\nThere were ${result.errorCount} errors during upload.` : ''
        } (${result.mode} mode)`;
      } else if (previewData.type === 'wrvu') {
        title = 'wRVU Data Upload Complete';
        message = `Successfully processed ${result.successCount} providers with ${result.recordsCreated} monthly records${
          result.errorCount > 0 ? `\n\nThere were ${result.errorCount} errors during upload.` : ''
        }`;
      }
      
      setAlertConfig({
        title,
        message,
        type: 'success'
      });
      setAlertOpen(true);
      setPreviewData(null);
      router.refresh();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setAlertConfig({
        title: 'Upload Failed',
        message: errorMessage,
        type: 'error'
      });
      setAlertOpen(true);
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const totalPages = previewData ? Math.ceil(previewData.data.length / ROWS_PER_PAGE) : 0;
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Data Upload</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 relative hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Provider Data</h2>
            <div className="flex gap-3">
              <button
                onClick={() => showConfirmDialog('provider')}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
              >
                Clear Data
              </button>
              <a
                href="/templates/provider_template.xlsx"
                download
                className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm font-medium transition-colors duration-200"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Template
              </a>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-6 h-12">
            Upload provider information including employee data, specialties, and department details.
          </p>
          <ProviderUpload onPreview={handlePreview} />
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 relative hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Market Data</h2>
            <div className="flex gap-3">
              <button
                onClick={() => showConfirmDialog('market')}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
              >
                Clear Data
              </button>
              <a
                href="/templates/market_template.xlsx"
                download
                className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm font-medium transition-colors duration-200"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Template
              </a>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-6 h-12">
            Upload benchmarking data for specialties from industry-standard sources.
          </p>
          <MarketUpload onPreview={handlePreview} />
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-100 p-6 relative hover:shadow-lg transition-shadow duration-200">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold text-gray-900">wRVU Data</h2>
            <div className="flex gap-3">
              <button
                onClick={() => showConfirmDialog('wrvu')}
                className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200"
              >
                Clear Data
              </button>
              <a
                href="/templates/wrvu_template.xlsx"
                download
                className="text-blue-600 hover:text-blue-800 inline-flex items-center text-sm font-medium transition-colors duration-200"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Template
              </a>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-6 h-12">
            Upload monthly work RVU data with targets and adjustments for providers.
          </p>
          <WRVUUpload onPreview={handlePreview} />
        </div>
      </div>

      {previewData && (
        <div className="bg-white rounded-lg shadow-lg mt-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">
                  Preview {previewData.type.charAt(0).toUpperCase() + previewData.type.slice(1)} Data
                </h3>
                <p className="text-sm text-gray-500">
                  File: {previewData.file.name}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 text-sm border ${
                  previewData.mode === 'append' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-orange-600 text-orange-600'
                }`}>
                  {previewData.mode === 'append' ? 'Append Mode' : 'Clear & Replace Mode'}
                </span>
                <button
                  onClick={() => setPreviewData(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {previewData.columns.map((column) => (
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
                  {previewData.data.slice(startIndex, endIndex).map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {previewData.columns.map((column) => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {column.formatter ? column.formatter(row[column.key]) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 border-t pt-4">
                <div className="flex items-center">
                  <button
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <span className="mx-4 text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded-md disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, previewData.data.length)} of {previewData.data.length} records
                </div>
              </div>
            )}

            {uploadError && (
              <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                {uploadError}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
              <button
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Upload Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      <UploadAlert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmButtonText="Clear Data"
        cancelButtonText="Cancel"
      />
    </div>
  );
} 