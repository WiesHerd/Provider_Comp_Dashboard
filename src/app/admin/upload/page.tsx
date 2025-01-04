'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import ProviderUpload from '@/components/Upload/ProviderUpload';
import MarketUpload from '@/components/Upload/MarketUpload';
import WRVUUpload from '@/components/Upload/WRVUUpload';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface PreviewData {
  data: any[];
  columns: any[];
  mode: 'append' | 'clear';
  type: 'provider' | 'market' | 'wrvu';
  file: File;
}

const ROWS_PER_PAGE = 5;

export default function UploadPage() {
  const handleClearProviderData = async () => {
    if (confirm('Are you sure you want to clear all provider data?')) {
      try {
        const response = await fetch('/api/providers/clear', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to clear provider data');
        alert('Provider data cleared successfully');
      } catch (error) {
        console.error('Error clearing provider data:', error);
        alert('Failed to clear provider data');
      }
    }
  };

  const handleClearMarketData = async () => {
    if (confirm('Are you sure you want to clear all market data?')) {
      try {
        const response = await fetch('/api/market-data/clear', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to clear market data');
        alert('Market data cleared successfully');
      } catch (error) {
        console.error('Error clearing market data:', error);
        alert('Failed to clear market data');
      }
    }
  };

  const handleClearWRVUData = async () => {
    if (confirm('Are you sure you want to clear all wRVU data?')) {
      try {
        const response = await fetch('/api/wrvu-data/clear', { method: 'POST' });
        if (!response.ok) throw new Error('Failed to clear wRVU data');
        alert('wRVU data cleared successfully');
      } catch (error) {
        console.error('Error clearing wRVU data:', error);
        alert('Failed to clear wRVU data');
      }
    }
  };

  const handlePreview = (data: any[], columns: any[], mode: string) => {
    // Preview handling will be implemented in the upload components
    console.log('Preview data:', { data, columns, mode });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Data Upload</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow p-6 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold">Provider Data</h2>
            <div className="flex gap-2">
              <button
                onClick={handleClearProviderData}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Clear Data
              </button>
              <a
                href="/templates/provider_template.xlsx"
                download
                className="text-gray-600 hover:text-gray-800 inline-flex items-center text-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Template
              </a>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Upload provider data including employee IDs, names, specialties, and other relevant information.
          </p>
          <ProviderUpload onPreview={handlePreview} />
        </div>
        <div className="bg-white rounded-lg shadow p-6 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold">Market Data</h2>
            <div className="flex gap-2">
              <button
                onClick={handleClearMarketData}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Clear Data
              </button>
              <a
                href="/templates/market_template.xlsx"
                download
                className="text-gray-600 hover:text-gray-800 inline-flex items-center text-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Template
              </a>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Upload market data for specialties. Contains benchmarking data from SullivanCotter, Gallagher, and MGMA.
          </p>
          <MarketUpload onPreview={handlePreview} />
        </div>
        <div className="bg-white rounded-lg shadow p-6 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold">wRVU Data</h2>
            <div className="flex gap-2">
              <button
                onClick={handleClearWRVUData}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Clear Data
              </button>
              <a
                href="/templates/wrvu_template.xlsx"
                download
                className="text-gray-600 hover:text-gray-800 inline-flex items-center text-sm"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
                Template
              </a>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Upload monthly wRVU data for providers. Contains monthly wRVU generations by provider.
          </p>
          <WRVUUpload onPreview={handlePreview} />
        </div>
      </div>

      {/* Preview Modal would go here */}
    </div>
  );
} 