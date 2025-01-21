'use client';

import React from 'react';
import { ChevronUpDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface SortIndicatorProps {
  column: string;
  sortConfig: {
    key: string;
    direction: 'ascending' | 'descending';
  } | null;
}

export const SortIndicator = ({ column, sortConfig }: SortIndicatorProps) => {
  if (!sortConfig || sortConfig.key !== column) {
    return <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />;
  }
  return sortConfig.direction === 'ascending' 
    ? <ChevronUpIcon className="w-4 h-4 text-indigo-600" />
    : <ChevronDownIcon className="w-4 h-4 text-indigo-600" />;
}; 