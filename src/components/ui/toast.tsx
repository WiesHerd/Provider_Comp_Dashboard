'use client';

import { useToast } from './use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`
            rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px]
            ${toast.variant === 'destructive' ? 'bg-red-600 text-white' : 'bg-white text-gray-900'}
          `}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description && (
            <div className="mt-1 text-sm opacity-90">{toast.description}</div>
          )}
        </div>
      ))}
    </div>
  );
} 