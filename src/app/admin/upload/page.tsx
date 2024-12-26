'use client';

import { Tab } from '@headlessui/react';
import { CloudArrowUpIcon, DocumentTextIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const providerColumns = [
  { name: 'First Name', required: true, example: 'John' },
  { name: 'Last Name', required: true, example: 'Smith' },
  { name: 'Employee ID', required: true, example: 'EMP1001' },
  { name: 'Specialty', required: true, example: 'Cardiology' },
  { name: 'Provider Type', required: true, example: 'MD' },
  { name: 'FTE', required: true, example: '0.8' },
  { name: 'Annual Base Salary', required: true, example: '220000' },
  { name: 'wRVU Conversion Factor', required: true, example: '45.00' },
  { name: 'Annual wRVU Target', required: true, example: '4800' },
  { name: 'Hire Date', required: true, example: '2023-01-01' },
  { name: 'Incentive Type', required: true, example: 'Quarterly' },
  { name: 'Holdback Percentage', required: true, example: '20' },
];

const wRVUColumns = [
  { name: 'Employee ID', required: true, example: 'EMP1001' },
  { name: 'Month', required: true, example: '2024-01' },
  { name: 'Actual wRVUs', required: true, example: '400.00' },
  { name: 'Target wRVUs', required: true, example: '375.70' },
  { name: 'Adjustment Type', required: false, example: 'Bonus' },
  { name: 'Adjustment Amount', required: false, example: '50.00' },
  { name: 'Adjustment Notes', required: false, example: 'Additional coverage' },
];

export default function UploadPage() {
  const [downloadStatus, setDownloadStatus] = useState<{
    provider: 'idle' | 'downloading' | 'error';
    wrvu: 'idle' | 'downloading' | 'error';
  }>({
    provider: 'idle',
    wrvu: 'idle'
  });

  const handleDownload = async (type: 'provider' | 'wrvu') => {
    setDownloadStatus(prev => ({ ...prev, [type]: 'downloading' }));
    
    try {
      const response = await fetch(`/api/templates/${type}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type === 'provider' ? 'Provider_Template' : 'wRVU_Template'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadStatus(prev => ({ ...prev, [type]: 'idle' }));
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus(prev => ({ ...prev, [type]: 'error' }));
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, [type]: 'idle' }));
      }, 3000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Data Upload</h1>
        <p className="mt-2 text-base text-gray-600">
          Upload provider and wRVU data using the templates below.
        </p>
      </div>

      <Tab.Group>
        <Tab.List className="flex space-x-2 rounded-xl bg-white p-1.5 shadow-sm border border-gray-200">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-3 px-6 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none',
                selected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            Provider Upload
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-3 px-6 text-sm font-medium leading-5 transition-all duration-200',
                'focus:outline-none',
                selected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            wRVU Upload
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-6">
          <Tab.Panel>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Provider Upload</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Upload provider details including compensation structure and targets.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload('provider')}
                    disabled={downloadStatus.provider === 'downloading'}
                    className={classNames(
                      'inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg',
                      'transition-colors duration-200',
                      downloadStatus.provider === 'downloading'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <DocumentTextIcon className={classNames(
                      'h-5 w-5 mr-2',
                      downloadStatus.provider === 'error' ? 'text-red-600' : 'text-blue-600'
                    )} />
                    {downloadStatus.provider === 'downloading'
                      ? 'Downloading...'
                      : downloadStatus.provider === 'error'
                      ? 'Download Failed'
                      : 'Download Template'}
                  </button>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" aria-hidden="true" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-900 mb-3">Required Columns</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-2">
                        {providerColumns.map((column) => (
                          <div key={column.name} className="flex items-center text-sm">
                            <div className="min-w-0">
                              <span className="font-medium text-gray-900">{column.name}</span>
                              <span className="text-gray-500 ml-2">({column.example})</span>
                            </div>
                            {column.required && (
                              <span className="ml-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/50">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-blue-100">
                        <CloudArrowUpIcon className="h-10 w-10 text-blue-600" />
                      </div>
                      <div className="mt-4">
                        <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" accept=".xlsx,.xls,.csv" />
                        </label>
                        <p className="pl-1 text-sm text-gray-600 inline">or drag and drop</p>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">XLSX, XLS, or CSV up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">wRVU Upload</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Upload monthly wRVU data and adjustments for providers.
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload('wrvu')}
                    disabled={downloadStatus.wrvu === 'downloading'}
                    className={classNames(
                      'inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg',
                      'transition-colors duration-200',
                      downloadStatus.wrvu === 'downloading'
                        ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    )}
                  >
                    <DocumentTextIcon className={classNames(
                      'h-5 w-5 mr-2',
                      downloadStatus.wrvu === 'error' ? 'text-red-600' : 'text-blue-600'
                    )} />
                    {downloadStatus.wrvu === 'downloading'
                      ? 'Downloading...'
                      : downloadStatus.wrvu === 'error'
                      ? 'Download Failed'
                      : 'Download Template'}
                  </button>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-start">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" aria-hidden="true" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-900 mb-3">Required Columns</h3>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-2">
                        {wRVUColumns.map((column) => (
                          <div key={column.name} className="flex items-center text-sm">
                            <div className="min-w-0">
                              <span className="font-medium text-gray-900">{column.name}</span>
                              <span className="text-gray-500 ml-2">({column.example})</span>
                            </div>
                            {column.required && (
                              <span className="ml-2 h-1.5 w-1.5 rounded-full bg-blue-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/50">
                    <div className="flex flex-col items-center text-center">
                      <div className="p-3 rounded-full bg-blue-100">
                        <CloudArrowUpIcon className="h-10 w-10 text-blue-600" />
                      </div>
                      <div className="mt-4">
                        <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload a file</span>
                          <input type="file" className="sr-only" accept=".xlsx,.xls,.csv" />
                        </label>
                        <p className="pl-1 text-sm text-gray-600 inline">or drag and drop</p>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">XLSX, XLS, or CSV up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
} 