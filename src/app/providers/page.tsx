"use client";

import React, { useState, useEffect, useCallback } from 'react';

interface Provider {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  department: string;
  fte: number;
  baseSalary: number;
  hasBenchmarks?: boolean;
  hasWRVUs?: boolean;
}

const ProvidersPage: React.FC = () => {
  const [showMissingBenchmarks, setShowMissingBenchmarks] = useState(false);
  const [showMissingWRVUs, setShowMissingWRVUs] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [fteRange, setFteRange] = useState([0, 1]);
  const [salaryRange, setSalaryRange] = useState([0, 1000000]);

  useEffect(() => {
    const fetchWRVUData = async () => {
      try {
        const response = await fetch('/api/wrvu-data');
        if (!response.ok) throw new Error('Failed to fetch wRVU data');
        const wrvuData = await response.json();
        
        const wrvuMap = new Map(wrvuData.map((d: any) => [d.employee_id, d]));
        
        setProviders(prevProviders => 
          prevProviders.map(provider => ({
            ...provider,
            hasWRVUs: wrvuMap.has(provider.employeeId)
          }))
        );
      } catch (error) {
        console.error('Error fetching wRVU data:', error);
      }
    };
    
    fetchWRVUData();
  }, []);

  const filterProviders = useCallback(() => {
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
    
    setFilteredProviders(filtered);
  }, [providers, selectedSpecialty, selectedDepartment, fteRange, salaryRange, showMissingBenchmarks, showMissingWRVUs]);

  useEffect(() => {
    filterProviders();
  }, [filterProviders]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-6 mt-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showMissingBenchmarks}
            onChange={(e) => setShowMissingBenchmarks(e.target.checked)}
            className="form-checkbox"
          />
          <span>Show Missing Benchmarks Only ({providers.filter(p => !p.hasBenchmarks).length})</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showMissingWRVUs}
            onChange={(e) => setShowMissingWRVUs(e.target.checked)}
            className="form-checkbox"
          />
          <span>Show Missing wRVUs Only ({providers.filter(p => !p.hasWRVUs).length})</span>
        </label>
      </div>
    </div>
  );
};

export default ProvidersPage; 