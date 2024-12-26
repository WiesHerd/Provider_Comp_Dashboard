'use client';

import React, { useState } from 'react';
import { 
  UsersIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  CloudArrowUpIcon,
  HomeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { 
    name: 'Providers', 
    href: '/admin/providers', 
    icon: UsersIcon
  },
  {
    name: 'Market Data',
    href: '/admin/market-data',
    icon: CurrencyDollarIcon
  },
  { 
    name: 'Upload', 
    href: '/admin/upload', 
    icon: CloudArrowUpIcon
  },
  { 
    name: 'Reports', 
    href: '/admin/reports', 
    icon: ChartBarIcon
  },
  { 
    name: 'Settings', 
    href: '/admin/settings', 
    icon: Cog6ToothIcon
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 bg-[#1a1c23] transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} shadow-xl`}>
        {/* Header */}
        <div className="flex h-14 items-center px-4">
          <Link href="/admin" className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors">
            <div className="bg-indigo-500 p-1.5 rounded-lg">
              <HomeIcon className="h-5 w-5 flex-shrink-0" />
            </div>
            {!isCollapsed && (
              <span className="font-medium">Provider Comp</span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="mt-4 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center px-3 py-2 my-1 text-sm rounded-md
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-indigo-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
                `}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon 
                  className={`
                    ${isCollapsed ? 'mr-0' : 'mr-3'} h-5 w-5 flex-shrink-0
                  `}
                  aria-hidden="true" 
                />
                {!isCollapsed && (
                  <span>{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* Collapse toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute bottom-4 -right-3 p-1.5 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors shadow-lg"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="h-4 w-4" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'pl-16' : 'pl-64'}`}>
        <main className="py-6 px-8">
          {children}
        </main>
      </div>
    </div>
  );
} 