'use client';

import { useRef, useState } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  accept: string;
  maxSize: number;
}

export default function UploadSection({ onFileSelect, accept, maxSize }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File size must be less than ${maxSize / (1024 * 1024)}MB`;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileType = file.name.toLowerCase().split('.').pop() || '';
    const isValidType = acceptedTypes.some(type => 
      type.includes(fileType) || type === `.${fileType}`
    );

    if (!isValidType) {
      return `Invalid file type. Please upload ${accept} files only`;
    }

    return null;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      onFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      onFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg
        ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:bg-gray-50'}
        transition-colors
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        className="sr-only"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
      />
      <div className="p-4 text-center">
        <div className="flex justify-center">
          <CloudArrowUpIcon className={`h-10 w-10 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop your file here, or{' '}
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
            onClick={() => fileInputRef.current?.click()}
          >
            click to select
          </button>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          CSV or Excel files only (max {maxSize / (1024 * 1024)}MB)
        </p>
      </div>
    </div>
  );
} 