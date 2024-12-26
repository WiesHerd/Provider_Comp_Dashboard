import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const UploadInterface: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<{
    providers: File | null;
    wrvus: File | null;
  }>({
    providers: null,
    wrvus: null
  });

  const handleFileChange = (type: 'providers' | 'wrvus', file: File | null) => {
    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const handleUpload = async (type: 'providers' | 'wrvus') => {
    const file = selectedFiles[type];
    if (!file) return;

    // TODO: Implement actual file upload logic
    console.log(`Uploading ${type} file:`, file);
  };

  const downloadTemplate = (type: 'providers' | 'wrvus') => {
    // TODO: Implement template download logic
    console.log(`Downloading ${type} template`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              )
            }
          >
            Provider Upload
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
              )
            }
          >
            wRVU Upload
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Provider Upload</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload provider details including compensation structure and targets.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => downloadTemplate('providers')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Download Template
                  </button>
                  
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    View Template Guide
                  </a>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex flex-col items-center">
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                    <div className="mt-4 flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange('providers', e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">XLSX, XLS, or CSV up to 10MB</p>
                  </div>
                  {selectedFiles.providers && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Selected file: {selectedFiles.providers.name}</p>
                      <button
                        onClick={() => handleUpload('providers')}
                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Upload File
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">wRVU Upload</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Upload monthly wRVU data for providers.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => downloadTemplate('wrvus')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Download Template
                  </button>
                  
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    View Template Guide
                  </a>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex flex-col items-center">
                    <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                    <div className="mt-4 flex text-sm text-gray-600">
                      <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".xlsx,.xls,.csv"
                          onChange={(e) => handleFileChange('wrvus', e.target.files?.[0] || null)}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">XLSX, XLS, or CSV up to 10MB</p>
                  </div>
                  {selectedFiles.wrvus && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-500">Selected file: {selectedFiles.wrvus.name}</p>
                      <button
                        onClick={() => handleUpload('wrvus')}
                        className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Upload File
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default UploadInterface; 