'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  fte: number;
  baseSalary: number;
  baseConversionFactor: number;
  yearlyTarget: number;
  currentWRVUs: number;
  percentileRank?: number;
}

export default function ProvidersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const router = useRouter();

  // Mock data - Replace with API call
  const providers: Provider[] = [
    {
      id: 'EMP1001',
      name: 'John Smith 1',
      specialty: 'Internal Medicine',
      fte: 1.0,
      baseSalary: 245055,
      baseConversionFactor: 47.9,
      yearlyTarget: 5115,
      currentWRVUs: 2500,
      percentileRank: 45
    },
    // Add more mock providers...
  ];

  const specialties = ['All Specialties', ...new Set(providers.map(p => p.specialty))];

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || provider.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleViewDashboard = (providerId: string) => {
    router.push(`/admin/providers/${providerId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Directory</h1>
          <p className="mt-2 text-sm text-gray-600">
            Select a provider to view their performance dashboard.
          </p>
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <UserCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
            >
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Provider List */}
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Specialty</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">FTE</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Base Salary</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">CF</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Target</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Current wRVUs</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">% to Target</th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredProviders.map((provider) => (
                <tr key={provider.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {provider.name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{provider.specialty}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{provider.id}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{provider.fte}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    ${provider.baseSalary.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    ${provider.baseConversionFactor.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {provider.yearlyTarget.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {provider.currentWRVUs.toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        (provider.currentWRVUs / provider.yearlyTarget) >= 1
                          ? 'bg-green-100 text-green-800'
                          : (provider.currentWRVUs / provider.yearlyTarget) >= 0.9
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round((provider.currentWRVUs / provider.yearlyTarget) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <button
                      onClick={() => handleViewDashboard(provider.id)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-900"
                    >
                      <ChartBarIcon className="h-5 w-5 mr-1" />
                      View Dashboard
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 