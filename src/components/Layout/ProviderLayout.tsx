'use client';

import React from 'react';
import JumpToProvider from '@/components/common/JumpToProvider';

interface ProviderLayoutProps {
  children: React.ReactNode;
  provider: {
    firstName: string;
    lastName: string;
    specialty: string;
    employeeId: string;
  };
}

export default function ProviderLayout({ children, provider }: ProviderLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900">
                {provider.firstName} {provider.lastName}
              </h1>
              <p className="text-sm text-gray-500">
                {provider.specialty} • {provider.employeeId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <JumpToProvider className="w-64" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
} 