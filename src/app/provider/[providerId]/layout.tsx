'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import JumpToProvider from '@/components/common/JumpToProvider';
import Sidebar from '@/components/common/Sidebar';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNavExpanded, setIsNavExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onCollapse={setIsCollapsed} 
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'pl-16' : 'pl-64'}`}>
        {/* Navigation container */}
        <div className="relative bg-gray-50">
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isNavExpanded ? 'h-16 opacity-100' : 'h-0 opacity-0'
          }`}>
            <div className="px-8 py-4 flex items-center justify-between absolute w-full">
              <Link
                href="/admin/providers"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Providers
              </Link>
              <div className="relative z-50">
                <JumpToProvider />
              </div>
            </div>
          </div>

          {/* Bottom border and toggle button */}
          <div className="relative">
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-40">
              <button
                onClick={() => setIsNavExpanded(!isNavExpanded)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ChevronDownIcon 
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                    isNavExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <main className="py-6 px-8">
          {children}
        </main>
      </div>
    </div>
  );
} 