'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudArrowUpIcon, 
  UsersIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  AdjustmentsHorizontalIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Data Management', children: [
    { name: 'Upload Data', href: '/admin/upload', icon: CloudArrowUpIcon },
    { name: 'Manage Templates', href: '/admin/templates', icon: DocumentDuplicateIcon },
  ]},
  { name: 'Provider Management', children: [
    { name: 'All Providers', href: '/admin/providers', icon: UsersIcon },
    { name: 'Departments', href: '/admin/departments', icon: BuildingOfficeIcon },
  ]},
  { name: 'System', children: [
    { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
    { name: 'Configuration', href: '/admin/config', icon: AdjustmentsHorizontalIcon },
  ]},
];

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 bg-gray-900 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-semibold text-white">wRVU Admin</h1>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            {isSidebarCollapsed ? (
              <ChevronRightIcon className="h-6 w-6" />
            ) : (
              <ChevronLeftIcon className="h-6 w-6" />
            )}
          </button>
        </div>
        <nav className="mt-6 px-2 space-y-6">
          {navigation.map((group) => (
            <div key={group.name}>
              {!isSidebarCollapsed && (
                <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {group.name}
                </h3>
              )}
              <div className="mt-2 space-y-1">
                {group.children.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      text-gray-300 hover:bg-gray-800 hover:text-white
                    `}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon 
                      className="mr-3 h-6 w-6 flex-shrink-0 text-gray-400 group-hover:text-white"
                      aria-hidden="true" 
                    />
                    {!isSidebarCollapsed && item.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top navigation */}
        <div className="bg-white shadow">
          <div className="max-w-[95%] mx-auto px-4">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <Link
                  href="/admin/providers"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 bg-white hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-1" />
                  Back to Provider Directory
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main>
          <div className="max-w-[95%] mx-auto py-6 px-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 