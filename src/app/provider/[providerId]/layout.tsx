'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import JumpToProvider from '@/components/common/JumpToProvider';
import Sidebar from '@/components/common/Sidebar';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isCollapsed={isCollapsed} 
        onCollapse={setIsCollapsed} 
      />

      {/* Main content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'pl-16' : 'pl-64'}`}>
        {/* Top header with JumpToProvider */}
        <div className="bg-gray-50 px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/admin/providers"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back to Providers
            </Link>
            <div>
              <JumpToProvider />
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