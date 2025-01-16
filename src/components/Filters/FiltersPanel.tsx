import React from 'react';

export interface FiltersPanelProps {
  showMissingBenchmarks: boolean;
  setShowMissingBenchmarks: (value: boolean) => void;
  showMissingWRVUs: boolean;
  setShowMissingWRVUs: (value: boolean) => void;
  showNonClinicalFTE: boolean;
  setShowNonClinicalFTE: (value: boolean) => void;
  showInactive: boolean;
  setShowInactive: (value: boolean) => void;
  selectedYear: string;
  setSelectedYear: (value: string) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  selectedSpecialty: string;
  setSelectedSpecialty: (value: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (value: string) => void;
  fteRange: [number, number];
  setFteRange: (value: [number, number]) => void;
  salaryRange: [number, number];
  setSalaryRange: (value: [number, number]) => void;
  specialties: string[];
  departments: string[];
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  showMissingBenchmarks,
  setShowMissingBenchmarks,
  showMissingWRVUs,
  setShowMissingWRVUs,
  showNonClinicalFTE,
  setShowNonClinicalFTE,
  showInactive,
  setShowInactive,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedSpecialty,
  setSelectedSpecialty,
  selectedDepartment,
  setSelectedDepartment,
  fteRange,
  setFteRange,
  salaryRange,
  setSalaryRange,
  specialties,
  departments
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Specialty Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Specialty</label>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="All Specialties">All Specialties</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="All Departments">All Departments</option>
            {departments.map((department) => (
              <option key={department} value={department}>
                {department}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Filters */}
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={showMissingBenchmarks}
              onChange={(e) => setShowMissingBenchmarks(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">Show Missing Benchmarks</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={showMissingWRVUs}
              onChange={(e) => setShowMissingWRVUs(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">Show Missing wRVUs</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={showNonClinicalFTE}
              onChange={(e) => setShowNonClinicalFTE(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">Show Non-Clinical FTE</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">Show Inactive</label>
          </div>
        </div>
      </div>
    </div>
  );
}; 