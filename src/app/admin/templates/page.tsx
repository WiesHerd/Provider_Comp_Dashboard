'use client';

import { useState } from 'react';
import { DocumentIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface Template {
  id: string;
  name: string;
  description: string;
  version: string;
  lastUpdated: string;
}

export default function TemplatesPage() {
  const [downloadStatus, setDownloadStatus] = useState<Record<string, 'idle' | 'downloading' | 'error'>>({
    'provider-upload': 'idle',
    'wrvu-upload': 'idle',
    'market-data': 'idle'
  });

  const templates: Template[] = [
    {
      id: 'provider-upload',
      name: 'Provider Upload Template',
      description: 'Template for uploading provider details including compensation structure.',
      version: '1.0',
      lastUpdated: '2024-01-15'
    },
    {
      id: 'wrvu-upload',
      name: 'wRVU Upload Template',
      description: 'Template for uploading monthly wRVU data and adjustments.',
      version: '1.0',
      lastUpdated: '2024-01-15'
    },
    {
      id: 'market-data',
      name: 'Market Data Template',
      description: 'Template for uploading specialty-specific market data including compensation, wRVUs, and conversion factors.',
      version: '1.0',
      lastUpdated: '2024-01-15'
    }
  ];

  const handleDownload = async (templateId: string) => {
    setDownloadStatus(prev => ({ ...prev, [templateId]: 'downloading' }));
    
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setDownloadStatus(prev => ({ ...prev, [templateId]: 'idle' }));
    } catch (error) {
      console.error('Error downloading template:', error);
      setDownloadStatus(prev => ({ ...prev, [templateId]: 'error' }));
      setTimeout(() => {
        setDownloadStatus(prev => ({ ...prev, [templateId]: 'idle' }));
      }, 3000);
    }
  };

  const handleEdit = (templateId: string) => {
    // TODO: Implement template editing
    console.log(`Editing template: ${templateId}`);
  };

  const handleDelete = (templateId: string) => {
    // TODO: Implement template deletion
    console.log(`Deleting template: ${templateId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and customize data upload templates.
          </p>
        </div>

        <div className="space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <DocumentIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="text-sm text-gray-500">Version {template.version}</span>
                      <span className="text-sm text-gray-500">Updated {template.lastUpdated}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(template.id)}
                    disabled={downloadStatus[template.id] === 'downloading'}
                    className={`inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      downloadStatus[template.id] === 'downloading' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <ArrowDownTrayIcon className={`h-4 w-4 mr-1.5 ${
                      downloadStatus[template.id] === 'downloading' ? 'animate-bounce' : ''
                    }`} />
                    {downloadStatus[template.id] === 'downloading' ? 'Downloading...' : 
                     downloadStatus[template.id] === 'error' ? 'Try Again' : 'Download'}
                  </button>
                  <button
                    onClick={() => handleEdit(template.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 