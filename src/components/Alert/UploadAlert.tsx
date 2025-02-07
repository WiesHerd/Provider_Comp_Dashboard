'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';

interface UploadAlertProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  show: boolean;
  onClose: () => void;
}

export default function UploadAlert({ type, title, message, show, onClose }: UploadAlertProps) {
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;
  const variant = type === 'success' ? 'default' : 'destructive';

  // Auto-hide after 5 seconds for success messages
  useEffect(() => {
    if (show && type === 'success') {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, type, onClose]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert variant={variant} className="pr-8">
        <Icon className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </Alert>
    </div>
  );
} 