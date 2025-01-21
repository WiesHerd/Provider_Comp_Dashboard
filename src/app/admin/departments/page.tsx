'use client';

import { useState, useEffect, useMemo } from 'react';
import { BuildingOffice2Icon, ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Provider {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  department: string;
  status: string;
}

interface DepartmentGroup {
  name: string;
  providers: Provider[];
}

export default function DepartmentsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepartments, setExpandedDepartments] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter departments based on search
  const filteredDepartmentGroups = useMemo(() => {
    const groups: { [key: string]: Provider[] } = {};
    providers.forEach(provider => {
      if (!provider.department) return;
      
      // Check if provider or department matches search
      const matchesSearch = 
        searchQuery === '' ||
        provider.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

      if (matchesSearch) {
        if (!groups[provider.department]) {
          groups[provider.department] = [];
        }
        groups[provider.department].push(provider);
      }
    });

    return Object.entries(groups)
      .map(([name, providers]) => ({
        name,
        providers: providers.sort((a, b) => 
          `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
        )
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [providers, searchQuery]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/providers');
        if (!response.ok) throw new Error('Failed to fetch providers');
        const data = await response.json();
        setProviders(data);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const toggleDepartment = (departmentName: string) => {
    setExpandedDepartments(prev => 
      prev.includes(departmentName)
        ? prev.filter(d => d !== departmentName)
        : [...prev, departmentName]
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="py-8 px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Departments</h1>
        <p className="text-gray-500">View providers by department</p>
      </div>

      {/* Search Filter */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-blue-500" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search departments, providers..."
            className="block w-full pl-9 pr-3 py-2.5 bg-white rounded-lg shadow-sm text-xs placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-100 border-0"
          />
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDepartmentGroups.map((department) => (
          <div
            key={department.name}
            className="bg-white rounded-lg shadow-sm"
          >
            <button
              onClick={() => toggleDepartment(department.name)}
              className="w-full p-4 flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <BuildingOffice2Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-gray-900 font-medium truncate">
                  {department.name}
                </h2>
                <p className="text-gray-500 text-sm">
                  {department.providers.length} {department.providers.length === 1 ? 'Provider' : 'Providers'}
                </p>
              </div>
              <ChevronDownIcon 
                className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                  expandedDepartments.includes(department.name) ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedDepartments.includes(department.name) && (
              <div className="border-t border-gray-100">
                <div className="p-2">
                  {department.providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="rounded-md p-2 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <Link
                            href={`/provider/${provider.employeeId}`}
                            className="text-gray-900 text-sm font-medium hover:text-gray-600 block truncate"
                          >
                            {provider.firstName} {provider.lastName}
                          </Link>
                          <p className="text-gray-500 text-sm truncate">
                            {provider.specialty}
                          </p>
                        </div>
                        <div className="text-gray-400 text-sm ml-2">
                          {provider.employeeId}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No Results Message */}
      {filteredDepartmentGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No departments or providers found matching your search.</p>
        </div>
      )}
    </div>
  );
} 