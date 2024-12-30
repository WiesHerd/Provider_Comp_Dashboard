'use client';

import { useRef } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

interface UploadSectionProps {
  onFileSelect: (file: File) => void;
  accept: string;
  maxSize: number;
}

export default function UploadSection({ onFileSelect, accept, maxSize }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > maxSize) {
        alert(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }
      onFileSelect(file);
    }
  };

  return (
    <div
      className={`
        relative border-2 border-dashed border-gray-300 rounded-lg
        bg-white hover:bg-gray-50 transition-colors
      `}
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
          <CloudArrowUpIcon className="h-10 w-10 text-gray-400" />
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
          CSV or Excel files only
        </p>
      </div>
    </div>
  );
} 