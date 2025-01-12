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

const ProvidersPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  
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
      try {
        const response = await fetch('/api/providers');
        if (!response.ok) throw new Error('Failed to fetch providers');
        const data = await response.json();
        setProviders(data);
        setFilteredProviders(data);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const filterProviders = useCallback(() => {
    if (!providers) return;
    
    let filtered = [...providers];
    
    if (selectedSpecialty !== 'All Specialties') {
      filtered = filtered.filter(p => p.specialty === selectedSpecialty);
    }
    
    if (selectedDepartment !== 'All Departments') {
      filtered = filtered.filter(p => p.department === selectedDepartment);
    }
    
    filtered = filtered.filter(p => 
      p.fte >= fteRange[0] && p.fte <= fteRange[1]
    );
    
    filtered = filtered.filter(p => 
      p.baseSalary >= salaryRange[0] && p.baseSalary <= salaryRange[1]
    );
    
    if (showMissingBenchmarks) {
      filtered = filtered.filter(p => !p.hasBenchmarks);
    }
    
    if (showMissingWRVUs) {
      filtered = filtered.filter(p => !p.hasWRVUs);
    }

    if (!showInactive) {
      filtered = filtered.filter(p => p.status === 'Active');
    }

    if (!showNonClinicalFTE) {
      filtered = filtered.filter(p => p.clinicalFte > 0);
    }
    
    setFilteredProviders(filtered);
  }, [
    providers,
    selectedSpecialty,
    selectedDepartment,
    fteRange,
    salaryRange,
    showMissingBenchmarks,
    showMissingWRVUs,
    showInactive,
    showNonClinicalFTE
  ]);

  useEffect(() => {
    filterProviders();
  }, [filterProviders]);

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
    </div>
  );
};

export default ProvidersPage; 