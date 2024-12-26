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

interface FileStates {
  provider: FileState;
  wrvu: FileState;
  market: FileState;
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

const validateWRVUData = (data: any[]) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 'No data found in file';
  }

  const firstRow = data[0];
  const requiredFields = [
    'employee_id',
    'first_name',
    'last_name',
    'specialty',
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];

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
  const [fileStates, setFileStates] = useState<FileStates>({
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

  const handleFileChange = async (type: UploadType, file: File | null) => {
    if (!file) return;
    
    try {
      const reader = new FileReader();
      reader.onload = async (event: ProgressEvent<FileReader>) => {
        try {
          const text = event.target?.result;
          if (typeof text !== 'string') {
            throw new Error('Failed to read file as text');
          }
          
          const workbook = XLSX.read(text, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Read data as JSON with header row, using lowercase headers
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false, // Get formatted text
            defval: '', // Default to empty string
            header: 'A', // Use A1 notation
          });

          // Get headers from first row
          const headers = Object.keys(jsonData[0] || {}).reduce((acc: Record<string, string>, key) => {
            const value = ((jsonData[0] as Record<string, any>)[key] || '').toString().toLowerCase().trim();
            acc[key] = value;
            return acc;
          }, {} as Record<string, string>);

          console.log('Headers:', headers);

          // Remove header row and map data
          const rows = jsonData.slice(1).map((row: any) => {
            const mappedRow: Record<string, any> = {};
            Object.keys(row).forEach(key => {
              const header = headers[key];
              if (header) {
                // Convert numeric values for months
                if (['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].includes(header)) {
                  mappedRow[header] = Number(row[key] || 0);
                } else if (header === 'employee_id' || header === 'employee id') {
                  mappedRow['employee_id'] = row[key].toString().trim();
                } else if (header === 'first_name' || header === 'first name') {
                  mappedRow['first_name'] = row[key].toString().trim();
                } else if (header === 'last_name' || header === 'last name') {
                  mappedRow['last_name'] = row[key].toString().trim();
                } else if (header === 'specialty') {
                  mappedRow['specialty'] = row[key].toString().trim();
                }
              }
            });
            return mappedRow;
          });

          console.log('Processed rows:', rows);
          
          setFileStates(prev => ({
            ...prev,
            [type]: {
              file,
              preview: rows,
              isUploading: false,
              error: null
            }
          }));
        } catch (error) {
          console.error('Error parsing file:', error);
          setFileStates(prev => ({
            ...prev,
            [type]: {
              ...prev[type],
              error: 'Failed to parse file'
            }
          }));
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setFileStates(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          error: 'Failed to read file'
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

      // Validate preview data
      if (!Array.isArray(state.preview)) {
        throw new Error('Preview data is not an array');
      }

      if (state.preview.length === 0) {
        throw new Error('No data to upload');
      }

      // Log the data we're about to send
      const requestData = {
        data: state.preview.map(row => ({
          employee_id: row.employee_id,
          first_name: row.first_name,
          last_name: row.last_name,
          specialty: row.specialty,
          jan: Number(row.jan),
          feb: Number(row.feb),
          mar: Number(row.mar),
          apr: Number(row.apr),
          may: Number(row.may),
          jun: Number(row.jun),
          jul: Number(row.jul),
          aug: Number(row.aug),
          sep: Number(row.sep),
          oct: Number(row.oct),
          nov: Number(row.nov),
          dec: Number(row.dec)
        }))
      };

      console.log('Request data:', requestData);
      console.log('Stringified request:', JSON.stringify(requestData));

      // Make the upload request
      const response = await fetch(`/api/upload/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response text:', text);
        let errorMessage = 'Upload failed';
        try {
          if (text) {
            const result = JSON.parse(text);
            errorMessage = result.error || errorMessage;
          } else {
            console.error('Empty error response from server');
            errorMessage = 'Server returned an empty error response';
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
          errorMessage = text || 'Unknown error occurred';
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Upload successful:', result);

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

      alert(`Successfully uploaded ${result.count} records`);
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
      alert(error instanceof Error ? error.message : 'Upload failed');
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
                onFileSelect={(file) => handleFileChange('provider', file)}
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
                onFileSelect={(file) => handleFileChange('wrvu', file)}
                onUpload={() => handleUpload('wrvu')}
                onDownload={() => downloadTemplate('wrvu')}
                onClear={() => clearFile('wrvu')}
                title="wRVU Data Upload"
                description="Upload monthly wRVU data for providers."
                columns={[
                  { name: 'employee_id', example: 'EMP1001' },
                  { name: 'first_name', example: 'John' },
                  { name: 'last_name', example: 'Smith' },
                  { name: 'specialty', example: 'Cardiology' },
                  { name: 'jan', example: '450' },
                  { name: 'feb', example: '425' },
                  { name: 'mar', example: '500' },
                  { name: 'apr', example: '475' },
                  { name: 'may', example: '525' },
                  { name: 'jun', example: '450' },
                  { name: 'jul', example: '475' },
                  { name: 'aug', example: '500' },
                  { name: 'sep', example: '450' },
                  { name: 'oct', example: '475' },
                  { name: 'nov', example: '425' },
                  { name: 'dec', example: '450' }
                ]}
              />
            </Tab.Panel>

            <Tab.Panel className="focus:outline-none">
              <UploadSection
                type="market"
                state={fileStates.market}
                onFileSelect={(file) => handleFileChange('market', file)}
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