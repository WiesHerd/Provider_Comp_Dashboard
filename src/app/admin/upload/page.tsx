'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useDropzone } from 'react-dropzone';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<{
    providers: File | null;
    wrvus: File | null;
  }>({
    providers: null,
    wrvus: null
  });

  const [uploadStatus, setUploadStatus] = useState<{
    providers: 'idle' | 'uploading' | 'success' | 'error';
    wrvus: 'idle' | 'uploading' | 'success' | 'error';
  }>({
    providers: 'idle',
    wrvus: 'idle'
  });

  const onDrop = (type: 'providers' | 'wrvus') => async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFiles(prev => ({
      ...prev,
      [type]: file
    }));
  };

  const providersDropzone = useDropzone({
    onDrop: onDrop('providers'),
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const wrvusDropzone = useDropzone({
    onDrop: onDrop('wrvus'),
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1
  });

  const handleUpload = async (type: 'providers' | 'wrvus') => {
    const file = selectedFiles[type];
    if (!file) return;

    setUploadStatus(prev => ({ ...prev, [type]: 'uploading' }));

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/upload/${type}`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Upload failed');

      setUploadStatus(prev => ({ ...prev, [type]: 'success' }));
      setTimeout(() => {
        setUploadStatus(prev => ({ ...prev, [type]: 'idle' }));
        setSelectedFiles(prev => ({ ...prev, [type]: null }));
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(prev => ({ ...prev, [type]: 'error' }));
    }
  };

  const removeFile = (type: 'providers' | 'wrvus') => {
    setSelectedFiles(prev => ({ ...prev, [type]: null }));
    setUploadStatus(prev => ({ ...prev, [type]: 'idle' }));
  };

  const downloadTemplate = async (type: 'providers' | 'wrvus') => {
    try {
      const response = await fetch(`/api/templates/${type}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download template');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Data Upload</h1>
        <p className="mt-2 text-sm text-gray-700">
          Upload provider and wRVU data using the templates below.
        </p>
      </div>

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
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Download Template
                  </button>
                  
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    View Template Guide
                  </a>
                </div>

                <div 
                  {...providersDropzone.getRootProps()}
                  className={classNames(
                    "border-2 border-dashed rounded-lg p-6",
                    providersDropzone.isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
                    selectedFiles.providers ? "bg-gray-50" : ""
                  )}
                >
                  <div className="flex flex-col items-center">
                    {!selectedFiles.providers ? (
                      <>
                        <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                        <div className="mt-4 flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input {...providersDropzone.getInputProps()} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">XLSX, XLS, or CSV up to 10MB</p>
                      </>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <DocumentIcon className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {selectedFiles.providers.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(selectedFiles.providers.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile('providers');
                            }}
                            className="ml-4 inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:text-gray-500"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpload('providers');
                            }}
                            disabled={uploadStatus.providers === 'uploading'}
                            className={classNames(
                              "w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white",
                              uploadStatus.providers === 'uploading'
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            )}
                          >
                            {uploadStatus.providers === 'uploading' ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                              </>
                            ) : uploadStatus.providers === 'success' ? (
                              "Upload Complete!"
                            ) : uploadStatus.providers === 'error' ? (
                              "Upload Failed - Try Again"
                            ) : (
                              "Upload File"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
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
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Download Template
                  </button>
                  
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    View Template Guide
                  </a>
                </div>

                <div 
                  {...wrvusDropzone.getRootProps()}
                  className={classNames(
                    "border-2 border-dashed rounded-lg p-6",
                    wrvusDropzone.isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
                    selectedFiles.wrvus ? "bg-gray-50" : ""
                  )}
                >
                  <div className="flex flex-col items-center">
                    {!selectedFiles.wrvus ? (
                      <>
                        <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                        <div className="mt-4 flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                            <span>Upload a file</span>
                            <input {...wrvusDropzone.getInputProps()} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">XLSX, XLS, or CSV up to 10MB</p>
                      </>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <DocumentIcon className="h-8 w-8 text-blue-500" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {selectedFiles.wrvus.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(selectedFiles.wrvus.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile('wrvus');
                            }}
                            className="ml-4 inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:text-gray-500"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpload('wrvus');
                            }}
                            disabled={uploadStatus.wrvus === 'uploading'}
                            className={classNames(
                              "w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white",
                              uploadStatus.wrvus === 'uploading'
                                ? "bg-blue-400 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700"
                            )}
                          >
                            {uploadStatus.wrvus === 'uploading' ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                              </>
                            ) : uploadStatus.wrvus === 'success' ? (
                              "Upload Complete!"
                            ) : uploadStatus.wrvus === 'error' ? (
                              "Upload Failed - Try Again"
                            ) : (
                              "Upload File"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
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