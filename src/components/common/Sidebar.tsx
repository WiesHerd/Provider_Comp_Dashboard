'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  UsersIcon, 
  ChartBarIcon, 
  CloudArrowUpIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarSquareIcon,
  PresentationChartLineIcon,
  CalculatorIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export default function Sidebar({ isCollapsed, onCollapse }: SidebarProps) {
  const pathname = usePathname() || '';

  return (
    <div className={`fixed inset-y-0 left-0 bg-[#1a1c23] transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } shadow-xl`}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 p-4">
          <div className="flex-shrink-0">
            <Image
              src="/images/icon.svg"
              alt="Clarity Pay 360"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-semibold text-white">Clarity Pay 360</span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 space-y-8 mt-8">
          {/* DATA MANAGEMENT */}
          <div>
            {!isCollapsed && (
              <h3 className="px-2 mb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                DATA MANAGEMENT
              </h3>
            )}
            <div className="space-y-1">
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors ${
                  pathname === '/admin' ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <HomeIcon className="h-5 w-5" />
                {!isCollapsed && <span>Main Menu</span>}
              </Link>
              <Link
                href="/admin/providers"
                className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/providers') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <UsersIcon className="h-5 w-5" />
                {!isCollapsed && <span>Providers</span>}
              </Link>
              <Link
                href="/admin/market-data"
                className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/market-data') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <ChartBarSquareIcon className="h-5 w-5" />
                {!isCollapsed && <span>Market Data</span>}
              </Link>
              <Link
                href="/admin/wrvu-data"
                className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/wrvu-data') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <PresentationChartLineIcon className="h-5 w-5" />
                {!isCollapsed && <span>wRVU Data</span>}
              </Link>
            </div>
          </div>

          {/* TOOLS */}
          <div>
            {!isCollapsed && (
              <h3 className="px-2 mb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                TOOLS
              </h3>
            )}
            <div className="space-y-1">
              <Link
                href="/admin/upload"
                className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/upload') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <CloudArrowUpIcon className="h-5 w-5" />
                {!isCollapsed && <span>Upload</span>}
              </Link>
              <Link
                href="/admin/reports/select"
                className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/reports') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <ChartBarIcon className="h-5 w-5" />
                {!isCollapsed && <span>Reports</span>}
              </Link>
              <Link
                href="/admin/tools/percentile-calculator"
                className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/tools/percentile-calculator') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <CalculatorIcon className="h-5 w-5" />
                {!isCollapsed && <span>Percentile Calculator</span>}
              </Link>
            </div>
          </div>

          {/* SYSTEM */}
          <div>
            {!isCollapsed && (
              <h3 className="px-2 mb-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
                SYSTEM
              </h3>
            )}
            <div className="space-y-1">
              <Link
                href="/admin/settings"
                className={`flex items-center gap-3 px-2 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin/settings') ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Cog6ToothIcon className="h-5 w-5" />
                {!isCollapsed && <span>Settings</span>}
              </Link>
            </div>
          </div>
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => onCollapse(!isCollapsed)}
          className="absolute bottom-4 -right-3 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shadow-lg"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
} 