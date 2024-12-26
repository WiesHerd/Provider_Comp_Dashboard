'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  accept: string;
  maxSize: number;
}

export default function UploadSection({ onFileSelect, accept, maxSize }: UploadSectionProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxSize,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg h-[200px] flex flex-col items-center justify-center transition-colors ${
        isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-500'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-center">
        <div className="mb-4">
          <svg
            className="w-12 h-12 text-gray-400 mx-auto"
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
        <p className="text-base">
          {isDragActive ? 'Drop the file here' : 'Drag and drop your file here, or click to select'}
        </p>
        <p className="text-sm text-gray-500 mt-1">CSV or Excel files only</p>
      </div>
    </div>
  );
} 