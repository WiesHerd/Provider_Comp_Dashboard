'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative">
        <header className={`sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'h-16' : 'h-10'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className={`flex justify-between items-center h-full transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
              <div className="flex items-center gap-4">
                <Link
                  href="/providers"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  <ArrowLeftIcon className="w-4 h-4 mr-2" />
                  Back to Providers
                </Link>
              </div>
              <div className="w-72">
                <JumpToProvider />
              </div>
            </div>
          </div>
        </header>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute left-1/2 transform -translate-x-1/2 -bottom-4 z-50 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-lg flex items-center gap-1 text-sm font-medium"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="w-4 h-4" />
              <span>Hide Navigation</span>
            </>
          ) : (
            <>
              <ChevronDownIcon className="w-4 h-4" />
              <span>Show Navigation</span>
            </>
          )}
        </button>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-6">
        <div className="mb-6">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900">
              {provider.firstName} {provider.lastName}
            </h1>
            <p className="text-sm text-gray-500">
              {provider.specialty} • {provider.employeeId}
            </p>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
} 