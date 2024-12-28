'use client';

import { Card } from '@/components/ui/card';
import ProviderUpload from '@/components/Upload/ProviderUpload';
import MarketUpload from '@/components/Upload/MarketUpload';
import WRVUUpload from '@/components/Upload/WRVUUpload';
import { useState } from 'react';

interface PreviewState {
  isVisible: boolean;
  data: any[] | null;
  columns: { key: string; header: string; formatter?: (value: any) => string }[];
  title: string;
  mode: 'append' | 'clear';
}

export default function UploadPage() {
  const [preview, setPreview] = useState<PreviewState>({
    isVisible: false,
    data: null,
    columns: [],
    title: '',
    mode: 'append'
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Data Upload</h1>
      
      {/* Upload Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow sm:rounded-lg">
          <ProviderUpload onPreview={(data, columns, mode) => {
            setPreview({
              isVisible: true,
              data,
              columns,
              title: 'Provider Data',
              mode
            });
          }} />
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <MarketUpload onPreview={(data, columns, mode) => {
            setPreview({
              isVisible: true,
              data,
              columns,
              title: 'Market Data',
              mode
            });
          }} />
        </div>

        <div className="bg-white shadow sm:rounded-lg">
          <WRVUUpload onPreview={(data, columns, mode) => {
            setPreview({
              isVisible: true,
              data,
              columns,
              title: 'wRVU Data',
              mode
            });
          }} />
        </div>
      </div>

      {/* Preview Area */}
      {preview.isVisible && preview.data && (
        <div className="mt-8">
          <div className="bg-white shadow-lg rounded-lg border border-gray-200">
            <div className="px-6 py-5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Data Preview - {preview.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Review the data before uploading
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${preview.mode === 'append' ? 'text-blue-600 font-medium' : 'text-orange-600 font-medium'}`}>
                    Mode: {preview.mode === 'append' ? 'Append' : 'Clear & Replace'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        {preview.columns.map((column) => (
                          <th
                            key={column.key}
                            scope="col"
                            className="px-6 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            {column.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {preview.data.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {preview.columns.map((column) => (
                            <td
                              key={column.key}
                              className="whitespace-nowrap px-6 py-4 text-sm text-gray-900"
                            >
                              {column.formatter ? column.formatter(row[column.key]) : row[column.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                  Total records: {preview.data.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 