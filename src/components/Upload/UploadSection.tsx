import { CloudArrowUpIcon, DocumentArrowDownIcon, XMarkIcon, InformationCircleIcon, ChevronRightIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/20/solid';
import { Disclosure } from '@headlessui/react';

type UploadType = 'provider' | 'wrvu' | 'market';

interface FileState {
  file: File | null;
  isUploading: boolean;
  error: string | null;
  preview: any[] | null;
}

interface UploadSectionProps {
  type: UploadType;
  state: FileState;
  onFileSelect: (file: File | null) => void;
  onUpload: () => void;
  onDownload: () => void;
  onClear: () => void;
  title: string;
  description: string;
  columns: Array<{ name: string; example: string }>;
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UploadSection({
  type,
  state,
  onFileSelect,
  onUpload,
  onDownload,
  onClear,
  title,
  description,
  columns
}: UploadSectionProps): JSX.Element {
  const { file, isUploading, error, preview } = state;

  const renderPreviewTable = () => {
    if (!preview || preview.length === 0) return null;

    const previewColumns = Object.keys(preview[0]);
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {previewColumns.map(column => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {preview.slice(0, 5).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {previewColumns.map(column => (
                  <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row[column]?.toString() || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {preview.length > 5 && (
          <p className="mt-2 text-sm text-gray-500 text-center">
            Showing first 5 rows of {preview.length} total rows
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2 text-gray-500" />
            Download Template
          </button>
        </div>

        {!file ? (
          <div className="mt-6">
            <label className="block">
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400">
                <div className="space-y-1 text-center">
                  <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                      <span>Upload a file</span>
                      <input
                        type="file"
                        className="sr-only"
                        accept=".csv,.xlsx"
                        onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV or Excel files only</p>
                </div>
              </div>
            </label>

            <div className="mt-6">
              <Disclosure>
                {({ open }) => (
                  <div>
                    <Disclosure.Button className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                      <InformationCircleIcon className="h-5 w-5 mr-2" />
                      <span>View required columns</span>
                      <ChevronRightIcon
                        className={classNames(
                          'ml-2 h-5 w-5 transform transition-transform duration-200',
                          open ? 'rotate-90' : ''
                        )}
                      />
                    </Disclosure.Button>
                    
                    <Disclosure.Panel className="mt-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {columns.map((column) => (
                            <div key={column.name} className="text-sm">
                              <p className="font-medium text-gray-700">{column.name}</p>
                              <p className="text-gray-500">Example: {column.example}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClear}
                  className="ml-4 bg-white rounded-md p-1 hover:bg-gray-100"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                    <p className="ml-3 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {preview && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-900">Preview</h4>
                  {renderPreviewTable()}
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onUpload}
                  disabled={isUploading || !!error}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                    isUploading || error
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 