'use client';

import { useState, useEffect } from 'react';
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

// Add this new validation function for market data
const validateMarketData = (data: any[]) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 'No data found in file';
  }

  const firstRow = data[0];
  
  // Check specialty field
  if (!firstRow.specialty) {
    return 'Missing required field: specialty';
  }

  // Check TCC/total fields
  const tccFields = ['p25_tcc', 'p50_tcc', 'p75_tcc', 'p90_tcc'];
  const totalFields = ['p25_total', 'p50_total', 'p75_total', 'p90_total'];
  const hasTccFields = tccFields.every(field => typeof firstRow[field] !== 'undefined');
  const hasTotalFields = totalFields.every(field => typeof firstRow[field] !== 'undefined');
  
  if (!hasTccFields && !hasTotalFields) {
    return 'Missing required TCC fields. Expected either p25_tcc, p50_tcc, p75_tcc, p90_tcc or p25_total, p50_total, p75_total, p90_total';
  }

  // Check wRVU fields
  const wrvuFields = ['p25_wrvu', 'p50_wrvu', 'p75_wrvu', 'p90_wrvu'];
  const missingWrvu = wrvuFields.filter(field => typeof firstRow[field] === 'undefined');
  if (missingWrvu.length > 0) {
    return `Missing required wRVU fields: ${missingWrvu.join(', ')}`;
  }

  // Check CF fields
  const cfFields = ['p25_cf', 'p50_cf', 'p75_cf', 'p90_cf'];
  const missingCf = cfFields.filter(field => typeof firstRow[field] === 'undefined');
  if (missingCf.length > 0) {
    return `Missing required CF fields: ${missingCf.join(', ')}`;
  }

  return null;
};

export default function UploadPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [fileStates, setFileStates] = useState<Record<UploadType, FileState>>({
    provider: { file: null, isUploading: false, error: null, preview: null },
    wrvu: { file: null, isUploading: false, error: null, preview: null },
    market: { file: null, isUploading: false, error: null, preview: null }
  });

  // Use useEffect to handle client-side initialization
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

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

      // Use different validation based on type
      let validationError;
      if (type === 'market') {
        validationError = validateMarketData(state.preview);
      } else if (type === 'provider') {
        validationError = validateProviderData(state.preview);
      }

      if (validationError) {
        throw new Error(validationError);
      }

      // Map the data based on type
      let mappedData;
      if (type === 'market') {
        mappedData = state.preview.map((row: any, index: number) => {
          try {
            return {
              specialty: String(row.specialty),
              p25_total: Number(row.p25_tcc || row.p25_total || 0),
              p50_total: Number(row.p50_tcc || row.p50_total || 0),
              p75_total: Number(row.p75_tcc || row.p75_total || 0),
              p90_total: Number(row.p90_tcc || row.p90_total || 0),
              p25_wrvu: Number(row.p25_wrvu || 0),
              p50_wrvu: Number(row.p50_wrvu || 0),
              p75_wrvu: Number(row.p75_wrvu || 0),
              p90_wrvu: Number(row.p90_wrvu || 0),
              p25_cf: Number(row.p25_cf || 0),
              p50_cf: Number(row.p50_cf || 0),
              p75_cf: Number(row.p75_cf || 0),
              p90_cf: Number(row.p90_cf || 0),
            };
          } catch (error) {
            throw new Error(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
          }
        });
      } else if (type === 'provider') {
        // Existing provider data mapping
        mappedData = state.preview.map((row: any, index: number) => {
          try {
            const baseSalary = parseFloat(row.base_salary);
            if (isNaN(baseSalary)) {
              throw new Error(`Invalid base salary: ${row.base_salary}`);
            }

            const fte = parseFloat(row.fte);
            if (isNaN(fte)) {
              throw new Error(`Invalid FTE: ${row.fte}`);
            }

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
              status: 'Active'
            };
          } catch (error) {
            throw new Error(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });
      }

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
                  { name: 'specialty', example: 'Cardiology' },
                  { name: 'p25_tcc', example: '220000' },
                  { name: 'p50_tcc', example: '250000' },
                  { name: 'p75_tcc', example: '280000' },
                  { name: 'p90_tcc', example: '310000' },
                  { name: 'p25_wrvu', example: '4500' },
                  { name: 'p50_wrvu', example: '4800' },
                  { name: 'p75_wrvu', example: '5100' },
                  { name: 'p90_wrvu', example: '5400' },
                  { name: 'p25_cf', example: '42.00' },
                  { name: 'p50_cf', example: '45.00' },
                  { name: 'p75_cf', example: '48.00' },
                  { name: 'p90_cf', example: '51.00' }
                ]}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
} 