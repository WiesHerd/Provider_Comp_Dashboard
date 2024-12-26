'use client';

import { 
  CloudArrowUpIcon, 
  UsersIcon, 
  ChartBarIcon,
  DocumentDuplicateIcon,
  BuildingOfficeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const actions = [
  {
    name: 'Upload Data',
    href: '/admin/upload',
    icon: CloudArrowUpIcon,
    description: 'Upload provider and wRVU data using Excel templates'
  },
  {
    name: 'Manage Providers',
    href: '/admin/providers',
    icon: UsersIcon,
    description: 'View and manage provider information'
  },
  {
    name: 'Departments',
    href: '/admin/departments',
    icon: BuildingOfficeIcon,
    description: 'Manage departments and specialties'
  },
  {
    name: 'Templates',
    href: '/admin/templates',
    icon: DocumentDuplicateIcon,
    description: 'Configure upload templates and formats'
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: ChartBarIcon,
    description: 'View and generate performance reports'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Cog6ToothIcon,
    description: 'Configure system settings and preferences'
  },
];

export default function AdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Manage providers, upload data, and configure system settings.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 rounded-lg shadow-sm hover:bg-gray-50"
          >
            <div>
              <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-700 ring-4 ring-white">
                <action.icon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-lg font-medium">
                <span className="absolute inset-0" aria-hidden="true" />
                {action.name}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 