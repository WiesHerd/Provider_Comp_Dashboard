'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function ProviderNavBanner() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`bg-white shadow-sm border-b border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'h-[64px]' : 'h-[24px]'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className={`transition-all duration-300 ease-in-out ${isExpanded ? '' : '-translate-y-2'}`}>
          <div className="flex items-center justify-between py-3">
            <Link
              href="/admin/providers"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              ← Back to Providers
            </Link>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors z-10"
          aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
        >
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>
    </div>
  );
} 