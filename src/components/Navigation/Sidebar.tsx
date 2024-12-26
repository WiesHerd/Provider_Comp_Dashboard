'use client';

import React from 'react';
import { HomeIcon, UsersIcon, ArrowUpTrayIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Providers',
      href: '/admin/providers',
      icon: UsersIcon,
      current: pathname === '/admin/providers'
    },
    {
      name: 'Upload',
      href: '/admin/upload',
      icon: ArrowUpTrayIcon,
      current: pathname === '/admin/upload'
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: ChartBarIcon,
      current: pathname === '/admin/reports'
    }
  ];

  return (
    <div className="flex h-full flex-col bg-[#1a1c23]">
      {/* Logo - Simplified */}
      <div className="flex h-14 items-center px-4">
        <div className="text-white font-medium">Provider Comp</div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`
              flex items-center gap-2 px-3 py-2 my-1 text-sm rounded-md transition-colors
              ${item.current
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Settings - Separated */}
      <div className="px-2 pb-4">
        <Link
          href="/admin/settings"
          className={`
            flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors
            ${pathname === '/admin/settings'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }
          `}
        >
          <Cog6ToothIcon className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}