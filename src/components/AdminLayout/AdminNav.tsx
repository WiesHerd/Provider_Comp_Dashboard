'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { generateSampleData } from '@/utils/seedData';

const AdminNav = () => {
  const pathname = usePathname();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSpecialties, setExpandedSpecialties] = useState<string[]>([]);
  
  // Generate sample data
  const { specialtyGroups } = generateSampleData(50);
  
  // Filter providers based on search
  const filteredGroups = specialtyGroups.map(group => ({
    ...group,
    providers: group.providers.filter(provider => 
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.providers.length > 0);

  const toggleSpecialty = (specialty: string) => {
    setExpandedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  return (
    <aside className="bg-gray-800 text-white w-64 min-h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-bold mb-8">wRVU Admin</h1>
        
        {/* Search Box */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search providers..."
            className="w-full bg-gray-700 text-white rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {/* Main Navigation */}
        <nav className="space-y-2 mb-8">
          <Link
            href="/admin"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              pathname === '/admin' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <HomeIcon className="h-5 w-5 mr-3" />
            <span>Dashboard</span>
          </Link>
        </nav>

        {/* Specialty Groups */}
        <div className="space-y-2">
          {filteredGroups.map((group) => (
            <div key={group.name} className="text-gray-300">
              <button
                onClick={() => toggleSpecialty(group.name)}
                className="flex items-center justify-between w-full px-2 py-2 rounded-md hover:bg-gray-700"
              >
                <span>{group.name}</span>
                {expandedSpecialties.includes(group.name) ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>
              
              {expandedSpecialties.includes(group.name) && (
                <div className="ml-4 mt-1 space-y-1">
                  {group.providers
                    .filter(provider => 
                      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      provider.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(provider => (
                      <Link
                        key={provider.id}
                        href={`/provider/${provider.id}`}
                        className="block w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-700"
                      >
                        {provider.name}
                        <span className="block text-xs text-gray-500">
                          {provider.employeeId}
                        </span>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default AdminNav; 