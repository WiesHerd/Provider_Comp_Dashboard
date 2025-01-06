'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/20/solid';

interface Provider {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

interface JumpToProviderProps {
  className?: string;
}

export default function JumpToProvider({ className = '' }: JumpToProviderProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle clicking outside of dropdown
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Fetch providers when dropdown is opened
    const fetchProviders = async () => {
      if (!isOpen) return;
      
      try {
        console.log('Starting provider fetch...');
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/providers/search');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          throw new Error(errorData.error || `Failed to fetch providers: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Received providers:', data);
        
        if (!Array.isArray(data)) {
          console.error('Invalid data format:', data);
          throw new Error('Invalid data format received from API');
        }
        
        setProviders(data);
        setFilteredProviders(data); // Initialize filtered providers with all providers
        
        if (data.length === 0) {
          console.log('No providers found');
          setError('No providers found in the system. Please ensure there are active providers.');
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        setError(error instanceof Error ? error.message : 'Failed to load providers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProviders();
  }, [isOpen]); // Only fetch when dropdown is opened

  useEffect(() => {
    if (!searchTerm) {
      setFilteredProviders(providers);
      return;
    }

    console.log('Filtering providers with term:', searchTerm);
    console.log('Total providers to filter:', providers.length);
    
    const filtered = providers.filter(provider => {
      const searchString = `${provider.firstName} ${provider.lastName} ${provider.employeeId} ${provider.specialty}`.toLowerCase();
      const terms = searchTerm.toLowerCase().split(' ');
      return terms.every(term => searchString.includes(term));
    });
    
    console.log('Filtered providers count:', filtered.length);
    setFilteredProviders(filtered);
  }, [searchTerm, providers]);

  const handleProviderSelect = (provider: Provider) => {
    console.log('Selected provider:', provider);
    router.push(`/provider/${provider.employeeId}`);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span>Jump to Provider</span>
        <ChevronDownIcon className="w-5 h-5 ml-2 -mr-1" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
          <div className="p-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search providers..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-500">
                Loading providers...
              </div>
            ) : error ? (
              <div className="px-4 py-2 text-sm text-red-500">
                {error}
              </div>
            ) : filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider)}
                  className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 focus:outline-none"
                >
                  <div className="font-medium">
                    {provider.firstName} {provider.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {provider.employeeId} • {provider.specialty}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">
                {searchTerm ? 'No matching providers found' : 'Start typing to search...'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 