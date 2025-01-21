"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FiltersPanel } from '@/components/Filters/FiltersPanel';

interface Provider {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty: string;
  department: string;
  status: string;
  terminationDate?: Date;
  hireDate: Date;
  fte: number;
  baseSalary: number;
  compensationModel: string;
  clinicalFte: number;
  nonClinicalFte: number;
  clinicalSalary: number;
  nonClinicalSalary: number;
  createdAt: Date;
  updatedAt: Date;
  hasBenchmarks?: boolean;
  hasWRVUs?: boolean;
}

interface PaginatedResponse {
  providers: Provider[];
  total: number;
  page: number;
  totalPages: number;
}

const ProvidersPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  
  // Filter states
  const [showMissingBenchmarks, setShowMissingBenchmarks] = useState(false);
  const [showMissingWRVUs, setShowMissingWRVUs] = useState(false);
  const [showNonClinicalFTE, setShowNonClinicalFTE] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('January');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [fteRange, setFteRange] = useState<[number, number]>([0, 1]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 2000000]);

  // Derived states
  const specialties = Array.from(new Set(providers.map(p => p.specialty))).sort();
  const departments = Array.from(new Set(providers.map(p => p.department))).sort();

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const queryParams = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          specialty: selectedSpecialty !== 'All Specialties' ? selectedSpecialty : '',
          department: selectedDepartment !== 'All Departments' ? selectedDepartment : '',
          status: !showInactive ? 'Active' : '',
          minFte: fteRange[0].toString(),
          maxFte: fteRange[1].toString(),
          minSalary: salaryRange[0].toString(),
          maxSalary: salaryRange[1].toString(),
          showMissingBenchmarks: showMissingBenchmarks.toString(),
          showMissingWRVUs: showMissingWRVUs.toString(),
          showNonClinicalFTE: showNonClinicalFTE.toString()
        });

        const response = await fetch(`/api/providers?${queryParams}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch providers: ${response.status}`);
        }
        
        const data: PaginatedResponse = await response.json();
        setProviders(data.providers);
        setFilteredProviders(data.providers);
        setTotalPages(data.totalPages);
        setTotalItems(data.total);
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error('Error fetching providers:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
        
        // Implement retry logic
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => {
            fetchProviders();
          }, Math.min(1000 * Math.pow(2, retryCount), 8000)); // Exponential backoff
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [
    currentPage,
    selectedSpecialty,
    selectedDepartment,
    showInactive,
    fteRange,
    salaryRange,
    showMissingBenchmarks,
    showMissingWRVUs,
    showNonClinicalFTE,
    retryCount
  ]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatFTE = (fte: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(fte);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading providers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading providers</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              {retryCount < maxRetries && (
                <div className="mt-2">
                  <button
                    onClick={() => setRetryCount(prev => prev + 1)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <FiltersPanel
        showMissingBenchmarks={showMissingBenchmarks}
        setShowMissingBenchmarks={setShowMissingBenchmarks}
        showMissingWRVUs={showMissingWRVUs}
        setShowMissingWRVUs={setShowMissingWRVUs}
        showNonClinicalFTE={showNonClinicalFTE}
        setShowNonClinicalFTE={setShowNonClinicalFTE}
        showInactive={showInactive}
        setShowInactive={setShowInactive}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedSpecialty={selectedSpecialty}
        setSelectedSpecialty={setSelectedSpecialty}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        fteRange={fteRange}
        setFteRange={setFteRange}
        salaryRange={salaryRange}
        setSalaryRange={setSalaryRange}
        specialties={specialties}
        departments={departments}
      />

      <div className="mt-6 overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Basic Info</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">FTE</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compensation</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProviders.map((provider) => (
              <tr key={provider.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{provider.firstName} {provider.lastName}</div>
                  <div className="text-sm text-gray-500">{provider.email}</div>
                  <div className="text-sm text-gray-500">ID: {provider.employeeId}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{provider.department}</div>
                  <div className="text-sm text-gray-500">{provider.specialty}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    provider.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Total: {formatFTE(provider.fte)}</div>
                  <div className="text-sm text-gray-500">Clinical: {formatFTE(provider.clinicalFte)}</div>
                  <div className="text-sm text-gray-500">Non-Clinical: {formatFTE(provider.nonClinicalFte)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Base: {formatCurrency(provider.baseSalary)}</div>
                  <div className="text-sm text-gray-500">Clinical: {formatCurrency(provider.clinicalSalary)}</div>
                  <div className="text-sm text-gray-500">Non-Clinical: {formatCurrency(provider.nonClinicalSalary)}</div>
                  <div className="text-sm text-gray-500">Model: {provider.compensationModel}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">Hire: {formatDate(provider.hireDate)}</div>
                  {provider.terminationDate && (
                    <div className="text-sm text-red-500">Term: {formatDate(provider.terminationDate)}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                </svg>
              </button>
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => handlePageChange(idx + 1)}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                    currentPage === idx + 1
                      ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                      : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvidersPage; 