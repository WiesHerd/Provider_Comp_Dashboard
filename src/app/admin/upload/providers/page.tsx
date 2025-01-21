'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { read, utils } from 'xlsx';

interface ProviderUpload {
  name: string;
  id: string;
  specialty: string;
  baseSalary: number;
  baseConversionFactor: number;
  fte: number;
  customTarget?: number;
}

export default function ProviderUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ProviderUpload[]>([]);
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

    // Transform data to match Provider interface
    const providers = jsonData.map((row: any) => ({
      name: row.name,
      id: row.id,
      specialty: row.specialty,
      baseSalary: Number(row.baseSalary) || 0,
      baseConversionFactor: Number(row.baseConversionFactor) || 0,
      fte: Number(row.fte) || 1,
      customTarget: Number(row.customTarget) || undefined
    }));

    setPreview(providers);
  };

  const handleUpload = async () => {
    if (!preview.length) return;

    try {
      const response = await fetch('/api/providers/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ providers: preview }),
      });

      if (!response.ok) throw new Error('Upload failed');

      router.push('/admin/providers');
    } catch (error) {
      console.error('Error uploading providers:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Provider Data</h1>
          <p className="mt-2 text-sm text-gray-500">
            Upload provider information including compensation details and targets.
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
              Upload Excel file containing provider data. Required columns: name, id, specialty, baseSalary, baseConversionFactor, fte. Optional: customTarget
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
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Specialty</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Base Salary</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Base CF</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">FTE</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {preview.map((provider, index) => (
                    <tr key={index}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{provider.name}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{provider.id}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{provider.specialty}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ${provider.baseSalary.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        ${provider.baseConversionFactor.toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{provider.fte}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {provider.customTarget ? provider.customTarget.toLocaleString() : 
                         Math.round(provider.baseSalary / provider.baseConversionFactor).toLocaleString()}
                      </td>
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
                Upload Providers
              </button>
            </div>
          </div>
        )}

        {/* Template Download */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900">Download Template</h3>
          <p className="mt-1 text-sm text-gray-500">
            Download our Excel template with the required columns and format.
          </p>
          <button
            onClick={() => {/* TODO: Add template download */}}
            className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Download Template
          </button>
        </div>
      </div>
    </div>
  );
} 