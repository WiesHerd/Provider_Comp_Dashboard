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
  ChartBarSquareIcon,
  PresentationChartLineIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Group navigation items by category
const navigation = [
  {
    category: 'COMPENSATION SYSTEM',
    items: [
      { 
        name: 'Main Menu', 
        href: '/admin', 
        icon: BanknotesIcon
      }
    ]
  },
  {
    category: 'DATA MANAGEMENT',
    items: [
      { 
        name: 'Providers', 
        href: '/admin/providers', 
        icon: UsersIcon
      },
      {
        name: 'Market Data',
        href: '/admin/market-data',
        icon: ChartBarSquareIcon
      },
      {
        name: 'wRVU Data',
        href: '/admin/wrvu-data',
        icon: PresentationChartLineIcon
      }
    ]
  },
  {
    category: 'TOOLS',
    items: [
      { 
        name: 'Upload', 
        href: '/admin/upload', 
        icon: CloudArrowUpIcon
      },
      { 
        name: 'Reports', 
        href: '/admin/reports/select', 
        icon: ChartBarIcon
      }
    ]
  },
  {
    category: 'SYSTEM',
    items: [
      { 
        name: 'Settings', 
        href: '/admin/settings', 
        icon: Cog6ToothIcon
      }
    ]
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 bg-[#1a1c23] transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } shadow-xl`}>
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-6">
            {navigation.map((section) => (
              <div key={section.category}>
                {!isCollapsed && (
                  <div className="flex items-center px-3 mb-2">
                    {section.icon && <section.icon className="h-4 w-4 text-gray-400 mr-2" />}
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {section.category}
                    </h3>
                  </div>
                )}
                <div className="mt-2 space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.href === '/admin' 
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`
                          flex items-center px-3 py-2 text-sm rounded-md
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
                </div>
              </div>
            ))}
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