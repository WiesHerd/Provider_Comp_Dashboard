'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MarketData } from '@/types/market-data';
import { read, utils } from 'xlsx';

export default function MarketDataUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MarketData[]>([]);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFile(file);
    
    // Read and parse Excel file
    const data = await file.arrayBuffer();
    const workbook = read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = utils.sheet_to_json(worksheet);

    // Transform data to match MarketData interface
    const marketData = jsonData.map((row: any) => ({
      specialty: row.specialty,
      p25_total: Number(row.p25_total),
      p50_total: Number(row.p50_total),
      p75_total: Number(row.p75_total),
      p90_total: Number(row.p90_total),
      p25_wrvu: Number(row.p25_wrvu),
      p50_wrvu: Number(row.p50_wrvu),
      p75_wrvu: Number(row.p75_wrvu),
      p90_wrvu: Number(row.p90_wrvu),
      p25_cf: Number(row.p25_cf),
      p50_cf: Number(row.p50_cf),
      p75_cf: Number(row.p75_cf),
      p90_cf: Number(row.p90_cf),
    }));

    setPreview(marketData);
  };

  const handleUpload = async () => {
    if (!preview.length) return;

    try {
      const response = await fetch('/api/upload/market', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: preview }),
      });

      if (!response.ok) throw new Error('Upload failed');

      router.push('/admin/market-data');
    } catch (error) {
      console.error('Error uploading market data:', error);
      // Show error message to user
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Market Data</h1>
          <p className="mt-2 text-sm text-gray-500">
            Upload specialty-specific market data including compensation, wRVUs, and conversion factors.
          </p>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            <p className="mt-2 text-xs text-gray-500">
              Upload Excel file containing market data. File should include columns for specialty, percentiles (p25, p50, p75, p90) for total compensation, wRVUs, and conversion factors.
            </p>
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Preview</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Specialty</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">p50 Total</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">p50 wRVU</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">p50 CF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.map((row, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{row.specialty}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${row.p50_total.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{row.p50_wrvu.toLocaleString()}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">${row.p50_cf.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Upload Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 