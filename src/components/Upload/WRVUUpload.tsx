import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function WRVUUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const processFile = async (file: File) => {
    try {
      const data = await readExcelFile(file);
      if (!data || data.length === 0) {
        toast.error('No data found in file');
        return;
      }

      setIsUploading(true);
      const response = await fetch('/api/upload/wrvu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload data');
      }

      toast.success(`Successfully uploaded ${result.count} records`);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Convert column names to lowercase
          const processedData = jsonData.map((row: any) => {
            const processedRow: any = {};
            Object.keys(row).forEach((key) => {
              const newKey = key.toLowerCase().replace(/\s+/g, '_');
              processedRow[newKey] = row[key];
            });
            return processedRow;
          });

          resolve(processedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error('Please upload an Excel or CSV file');
      return;
    }

    await processFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">wRVU Data Upload</h2>
        <p className="text-sm text-gray-600 mb-4">
          Upload monthly wRVU data for providers.
        </p>
        
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-base">
                {isDragActive
                  ? 'Drop the file here'
                  : 'Drag and drop your file here, or click to select'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                CSV or Excel files only
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = '/templates/wrvu-template.xlsx'}
          >
            Download Template
          </Button>
        </div>
      </Card>
    </div>
  );
} 