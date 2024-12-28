import { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import UploadSection from './UploadSection';

type UploadStep = 'upload' | 'preview' | 'confirm';

interface BaseUploadFlowProps {
  title: string;
  description: string;
  templateUrl: string;
  onPreview: (file: File) => Promise<any[]>;
  onUpload: (file: File, mode: 'append' | 'clear') => Promise<void>;
  previewData?: any[];
  previewColumns: {
    key: string;
    header: string;
    formatter?: (value: any) => string;
  }[];
}

export default function BaseUploadFlow({
  title,
  description,
  templateUrl,
  onPreview,
  onUpload,
  previewData,
  previewColumns
}: BaseUploadFlowProps) {
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'append' | 'clear'>('append');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsLoading(true);
    
    try {
      await onPreview(selectedFile);
      setCurrentStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError(null);
      await onUpload(file, uploadMode);
      // Success handling will be done in the parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Upload Box */}
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Steps */}
        <div className="border-b border-gray-200">
          <nav className="flex justify-center -mb-px" aria-label="Progress">
            {['Upload', 'Preview', 'Confirm'].map((step, index) => {
              const stepKey = step.toLowerCase() as UploadStep;
              const isCurrent = currentStep === stepKey;
              const isComplete = index < ['upload', 'preview', 'confirm'].indexOf(currentStep);

              return (
                <button
                  key={step}
                  onClick={() => {
                    if (file && index <= ['upload', 'preview', 'confirm'].indexOf(currentStep)) {
                      setCurrentStep(stepKey);
                    }
                  }}
                  className={`
                    w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm
                    ${isCurrent ? 'border-blue-500 text-blue-600' : 
                      isComplete ? 'border-blue-200 text-blue-600 hover:border-blue-300' : 
                      'border-transparent text-gray-500'}
                  `}
                  disabled={!file && step !== 'Upload'}
                >
                  {step}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Upload Box Content */}
        <div className="mt-6">
          {currentStep === 'upload' && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{description}</p>
                </div>
                <div className="mt-6">
                  <UploadSection
                    onFileSelect={handleFileSelect}
                    accept=".csv,.xlsx,.xls"
                    maxSize={5 * 1024 * 1024}
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${uploadMode === 'append' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                          Append Data
                        </span>
                        <label className="inline-flex items-center">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={uploadMode === 'clear'}
                              onChange={(e) => setUploadMode(e.target.checked ? 'clear' : 'append')}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                          </div>
                        </label>
                        <span className={`text-sm ${uploadMode === 'clear' ? 'text-orange-600 font-medium' : 'text-gray-400'}`}>
                          Clear & Replace
                        </span>
                      </div>
                      {uploadMode === 'clear' && (
                        <span className="text-orange-600 text-sm">
                          Warning: This will delete existing data
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => window.location.href = templateUrl}
                      className="inline-flex items-center px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-1.5" />
                      Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'confirm' && file && (
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900">Confirm Upload</h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                  <p>You are about to upload {previewData?.length} {title.toLowerCase()} records.</p>
                  {uploadMode === 'clear' && (
                    <p className="mt-2 text-orange-600">
                      Warning: This will delete all existing {title.toLowerCase()} before upload.
                    </p>
                  )}
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    onClick={() => setCurrentStep('preview')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isUploading ? 'Uploading...' : 'Confirm Upload'}
                  </button>
                </div>
                {error && (
                  <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Container - Below Upload Boxes */}
      {currentStep === 'preview' && file && previewData && (
        <div className="mt-8 px-4">
          <div className="bg-white shadow-lg rounded-lg border border-gray-200">
            <div className="px-6 py-5">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Data Preview - {title}</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Review the data before uploading
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${uploadMode === 'append' ? 'text-blue-600 font-medium' : 'text-orange-600 font-medium'}`}>
                    Mode: {uploadMode === 'append' ? 'Append' : 'Clear & Replace'}
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCurrentStep('upload')}
                      className="px-4 py-2 font-medium text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setCurrentStep('confirm')}
                      className="px-4 py-2 font-medium text-sm text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        {previewColumns.map((column) => (
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
                      {previewData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          {previewColumns.map((column) => (
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
                  Total records: {previewData.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 