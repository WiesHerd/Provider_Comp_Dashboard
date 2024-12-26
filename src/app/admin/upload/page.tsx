'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import UploadSection from '@/components/Upload/UploadSection';
import * as XLSX from 'xlsx';

// Utility function for combining class names
function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type UploadType = 'provider' | 'wrvu' | 'market';
interface FileState {
  file: File | null;
  isUploading: boolean;
  error: string | null;
  preview: any[] | null;
}

interface ProviderData {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  specialty: string;
  department: string;
  hire_date: string;
  fte: number;
  base_salary: number;
  compensation_model: string;
}

const PREVIEW_COLUMNS = [
  { key: 'employee_id', label: 'Employee ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'specialty', label: 'Specialty' },
  { key: 'department', label: 'Department' },
  { key: 'hire_date', label: 'Hire Date' },
  { key: 'fte', label: 'FTE' },
  { key: 'base_salary', label: 'Base Salary' },
  { key: 'compensation_model', label: 'Compensation Model' }
];

const validateProviderData = (data: any[]) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 'No data found in file';
  }

  const requiredFields = [
    'employee_id',
    'first_name',
    'last_name',
    'email',
    'specialty',
    'department',
    'hire_date',
    'fte',
    'base_salary',
    'compensation_model'
  ];

  const firstRow = data[0];
  const missingFields = requiredFields.filter(field => {
    const value = firstRow[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(', ')}`;
  }

  return null;
};

export default function UploadPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [fileStates, setFileStates] = useState<Record<UploadType, FileState>>({
    provider: { file: null, isUploading: false, error: null, preview: null },
    wrvu: { file: null, isUploading: false, error: null, preview: null },
    market: { file: null, isUploading: false, error: null, preview: null }
  });

  const handleFileSelect = async (type: UploadType, file: File | null) => {
    if (!file) return;

    try {
      // Validate file type
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        throw new Error('Please upload a CSV or Excel file');
      }

      // Read file contents
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to JSON with header row mapping
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        dateNF: 'yyyy-mm-dd',
        defval: '',
        blankrows: false,
        header: 1
      }) as Array<Array<string>>;

      if (jsonData.length < 2) {
        throw new Error('File must contain a header row and at least one data row');
      }

      // Extract headers and data
      const [headers, ...rows] = jsonData;
      
      // Convert headers to lowercase for consistent mapping
      const formattedHeaders = headers.map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
      
      // Map data to objects with formatted headers
      const formattedData = rows.map(row => {
        const obj: Record<string, string | number> = {};
        formattedHeaders.forEach((header, index) => {
          obj[header] = row[index] || '';
        });
        return obj;
      });

      // Set the preview data
      setFileStates(prev => ({
        ...prev,
        [type]: {
          file,
          isUploading: false,
          error: null,
          preview: formattedData
        }
      }));
    } catch (error) {
      console.error('File validation error:', error);
      setFileStates(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          file,
          error: error instanceof Error 
            ? error.message 
            : 'Could not read the file. Please make sure it matches the template format.',
          preview: null
        }
      }));
    }
  };

  const handleUpload = async (type: UploadType) => {
    const state = fileStates[type];
    if (!state.file || !state.preview) {
      console.error('No file or preview data available');
      return;
    }

    try {
      setFileStates(prev => ({
        ...prev,
        [type]: { ...prev[type], isUploading: true, error: null }
      }));

      // Log the data being sent
      console.log('Attempting to upload data:', {
        type,
        previewLength: state.preview.length,
        firstRow: state.preview[0]
      });

      // Validate the data before mapping
      const validationError = validateProviderData(state.preview);
      if (validationError) {
        throw new Error(validationError);
      }

      // Map the data to match the database schema
      const mappedData = state.preview.map((row: any, index: number) => {
        try {
          // Parse numeric values
          const baseSalary = parseFloat(row.base_salary);
          if (isNaN(baseSalary)) {
            throw new Error(`Invalid base salary: ${row.base_salary}`);
          }

          const fte = parseFloat(row.fte);
          if (isNaN(fte)) {
            throw new Error(`Invalid FTE: ${row.fte}`);
          }

          // Create the provider object with default status
          return {
            employee_id: String(row.employee_id),
            first_name: String(row.first_name),
            last_name: String(row.last_name),
            email: String(row.email),
            specialty: String(row.specialty),
            department: String(row.department),
            hire_date: String(row.hire_date),
            fte: fte,
            base_salary: baseSalary,
            compensation_model: String(row.compensation_model),
            status: 'Active' // Set default status to Active
          };
        } catch (error) {
          throw new Error(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      console.log('Sending mapped data to API:', {
        firstRow: mappedData[0],
        totalRows: mappedData.length
      });

      // Make the upload request
      const response = await fetch(`/api/upload/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: mappedData })
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        try {
          const result = JSON.parse(text);
          throw new Error(result.error || 'Upload failed');
        } catch (e) {
          throw new Error('Upload failed: ' + text);
        }
      }

      const result = await response.json();
      console.log('API Response data:', result);

      // Clear the file state and show success message
      setFileStates(prev => ({
        ...prev,
        [type]: {
          file: null,
          isUploading: false,
          error: null,
          preview: null
        }
      }));
      
      // Show success message to user
      alert(result.message || 'Upload successful');

      return result;
    } catch (error) {
      console.error('Upload error:', error);
      setFileStates(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          isUploading: false,
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }));
    }
  };

  const downloadTemplate = (type: UploadType) => {
    window.location.href = `/api/templates/${type}`;
  };

  const clearFile = (type: UploadType) => {
    setFileStates(prev => ({
      ...prev,
      [type]: { file: null, isUploading: false, error: null, preview: null }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Data Upload</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload and manage provider data, wRVUs, and market information.
          </p>
        </div>

        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 rounded-xl bg-white p-1 shadow">
            {['Provider Data', 'wRVU Data', 'Market Data'].map((category, index) => (
              <Tab
                key={category}
                className={({ selected }) =>
                  classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 focus:outline-none',
                    selected
                      ? 'bg-blue-100 text-blue-700 shadow'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )
                }
              >
                {category}
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="mt-4">
            <Tab.Panel className="focus:outline-none">
              <UploadSection
                type="provider"
                state={fileStates.provider}
                onFileSelect={(file) => handleFileSelect('provider', file)}
                onUpload={() => handleUpload('provider')}
                onDownload={() => downloadTemplate('provider')}
                onClear={() => clearFile('provider')}
                title="Provider Data Upload"
                description="Upload provider details including basic information and compensation."
                columns={[
                  { name: 'employee_id', example: 'EMP1001' },
                  { name: 'first_name', example: 'John' },
                  { name: 'last_name', example: 'Smith' },
                  { name: 'email', example: 'john.smith@example.com' },
                  { name: 'specialty', example: 'Cardiology' },
                  { name: 'department', example: 'Medicine' },
                  { name: 'hire_date', example: '2023-01-01' },
                  { name: 'fte', example: '1.0' },
                  { name: 'base_salary', example: '220000' },
                  { name: 'compensation_model', example: 'Standard' }
                ]}
              />
            </Tab.Panel>

            <Tab.Panel className="focus:outline-none">
              <UploadSection
                type="wrvu"
                state={fileStates.wrvu}
                onFileSelect={(file) => handleFileSelect('wrvu', file)}
                onUpload={() => handleUpload('wrvu')}
                onDownload={() => downloadTemplate('wrvu')}
                onClear={() => clearFile('wrvu')}
                title="wRVU Data Upload"
                description="Upload monthly wRVU data for providers."
                columns={[
                  { name: 'Employee ID', example: 'EMP1001' },
                  { name: 'Month', example: '2024-01' },
                  { name: 'Actual wRVUs', example: '400.00' },
                  { name: 'Target wRVUs', example: '375.70' },
                  { name: 'Adjustment Type', example: 'Bonus' },
                  { name: 'Adjustment Amount', example: '50.00' }
                ]}
              />
            </Tab.Panel>

            <Tab.Panel className="focus:outline-none">
              <UploadSection
                type="market"
                state={fileStates.market}
                onFileSelect={(file) => handleFileSelect('market', file)}
                onUpload={() => handleUpload('market')}
                onDownload={() => downloadTemplate('market')}
                onClear={() => clearFile('market')}
                title="Market Data Upload"
                description="Upload specialty-specific market data including compensation, wRVUs, and conversion factors."
                columns={[
                  { name: 'Specialty', example: 'Cardiology' },
                  { name: 'Total Compensation', example: 'p25: 220000, p50: 250000, p75: 280000, p90: 310000' },
                  { name: 'wRVUs', example: 'p25: 4500, p50: 4800, p75: 5100, p90: 5400' },
                  { name: 'Conversion Factors', example: 'p25: 42.00, p50: 45.00, p75: 48.00, p90: 51.00' }
                ]}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 