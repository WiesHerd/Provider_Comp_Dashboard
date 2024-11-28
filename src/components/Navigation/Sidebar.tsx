'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

interface SpecialtyGroup {
  name: string;
  providers: {
    id: string;
    name: string;
    employeeId: string;
  }[];
}

const Sidebar = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSpecialties, setExpandedSpecialties] = useState<string[]>([]);

  // Example specialty groups (this would come from your API)
  const specialtyGroups: SpecialtyGroup[] = [
    {
      name: 'Cardiology',
      providers: [
        { id: '1', name: 'Dr. John Smith', employeeId: 'EMP123' },
        { id: '2', name: 'Dr. Sarah Johnson', employeeId: 'EMP124' },
      ]
    },
    // Add more specialties...
  ];

  const toggleSpecialty = (specialty: string) => {
    setExpandedSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  return (
    <div className="w-64 bg-gray-800 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        <h1 className="text-white text-xl font-bold mb-6">wRVU Admin</h1>
        
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

        {/* Specialty Groups */}
        <div className="space-y-2">
          {specialtyGroups.map((group) => (
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
              
              {/* Provider List */}
              {expandedSpecialties.includes(group.name) && (
                <div className="ml-4 mt-1 space-y-1">
                  {group.providers
                    .filter(provider => 
                      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      provider.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => router.push(`/provider/${provider.id}`)}
                        className="block w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-gray-700"
                      >
                        {provider.name}
                        <span className="block text-xs text-gray-500">
                          {provider.employeeId}
                        </span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 