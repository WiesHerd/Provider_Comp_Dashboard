'use client';

import React, { useState } from 'react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const CustomTooltip = ({ content, children }: TooltipProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className="flex items-center gap-1 cursor-help group"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
        <InformationCircleIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
      </div>
      {show && (
        <div className="absolute z-50 w-72 px-4 py-2 -left-4 top-8 transform -translate-x-1/4">
          <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg p-3">
            <div className="absolute -top-1 left-[25%] w-2 h-2 bg-gray-900 transform rotate-45" />
            {content}
          </div>
        </div>
      )}
    </div>
  );
}; 