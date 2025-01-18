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
  PresentationChartLineIcon
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
        icon: HomeIcon
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
        {/* Navigation */}
        <nav className="h-full py-4 flex flex-col">
          {navigation.map((group) => (
            <div key={group.category} className={`space-y-1 px-2 ${
              group.category === 'COMPENSATION SYSTEM' ? 'mb-8' : 'mb-6'
            }`}>
              {!isCollapsed && (
                <h3 className={`px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${
                  group.category === 'COMPENSATION SYSTEM' ? 'mb-4' : 'mb-2'
                }`}>
                  {group.category}
                </h3>
              )}
              
              {group.items.map((item) => {
                const isActive = item.href === '/admin' 
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2.5 text-sm font-medium
                      transition-all duration-200 ease-in-out
                      group relative
                      ${isActive 
                        ? 'bg-indigo-600/90 text-white' 
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon 
                      className={`
                        ${isCollapsed ? 'mx-auto' : 'mr-3'} 
                        h-5 w-5 transition-all duration-200
                        ${isActive 
                          ? 'text-white' 
                          : 'text-gray-400 group-hover:text-white'
                        }
                      `}
                      aria-hidden="true"
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="
                        absolute left-full ml-3 px-2 py-1
                        bg-gray-900/90 text-white text-xs
                        rounded-md opacity-0 group-hover:opacity-100
                        transition-opacity backdrop-blur-sm
                        pointer-events-none whitespace-nowrap z-50
                      ">
                        {item.name}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Collapse button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute bottom-4 -right-3 p-1 bg-[#1a1c23] rounded-full border border-gray-600 text-gray-400 hover:text-white"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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