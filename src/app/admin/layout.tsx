'use client';

import React from 'react';
import { 
  CloudArrowUpIcon, 
  UsersIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  AdjustmentsHorizontalIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    name: 'PROVIDER MANAGEMENT',
    items: [
      { name: 'All Providers', href: '/admin/providers', icon: UsersIcon },
      { name: 'Departments', href: '/admin/departments', icon: BuildingOfficeIcon },
    ],
  },
  {
    name: 'DATA MANAGEMENT',
    items: [
      { name: 'Upload Data', href: '/admin/upload', icon: CloudArrowUpIcon },
      { name: 'Manage Templates', href: '/admin/templates', icon: DocumentDuplicateIcon },
    ],
  },
  {
    name: 'SYSTEM',
    items: [
      { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
      { name: 'Configuration', href: '/admin/config', icon: AdjustmentsHorizontalIcon },
      { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex h-16 items-center px-6">
          <h1 className="text-xl font-semibold text-white">wRVU Admin</h1>
        </div>
        <nav className="mt-6 px-3 space-y-6">
          {navigation.map((group) => (
            <div key={group.name}>
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {group.name}
              </h3>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-md
                        ${isActive 
                          ? 'bg-gray-800 text-white' 
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                      `}
                    >
                      <item.icon 
                        className={`
                          mr-3 h-6 w-6 flex-shrink-0
                          ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}
                        `}
                        aria-hidden="true" 
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  );
} 