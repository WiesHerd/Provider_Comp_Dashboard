'use client';

import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  PencilSquareIcon,
  TrashIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import AddProviderModal from '@/components/Providers/AddProviderModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
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
  terminationDate?: string;
  hireDate: string;
  fte: number;
  baseSalary: number;
  compensationModel: string;
  createdAt: string;
  updatedAt: string;
}

interface Column {
  id: string;
  label: string;
  key: keyof Provider | ((provider: Provider) => React.ReactNode);
}

interface SortableHeaderProps {
  column: Column;
  selectedProviders: string[];
  setSelectedProviders: (ids: string[]) => void;
  paginatedProviders: Provider[];
}

const SortableHeader = ({
  column,
  selectedProviders,
  setSelectedProviders,
  paginatedProviders
}: SortableHeaderProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handle select all checkbox if this is the checkbox column
  const handleSelectAll = () => {
    if (column.id === 'select') {
      if (selectedProviders.length === paginatedProviders.length) {
        setSelectedProviders([]);
      } else {
        setSelectedProviders(paginatedProviders.map(p => p.id));
      }
    }
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-move"
      onClick={handleSelectAll}
    >
      {column.id === 'select' ? (
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          checked={selectedProviders.length === paginatedProviders.length}
          onChange={handleSelectAll}
        />
      ) : (
        <>
          {column.label}
          <span className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100">⋮⋮</span>
        </>
      )}
    </th>
  );
};

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

const formatNumber = (value: number | null | undefined, isDecimal: boolean = false) => {
  if (value === null || value === undefined) return '-';
  
  if (isDecimal) {
    // For Conversion Factor values
    return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  
  // For other values, just use commas
  return value.toLocaleString();
};

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  
  // Add filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fteRange, setFteRange] = useState<[number, number]>([0, 1]);
  const [baseSalaryRange, setBaseSalaryRange] = useState<[number, number]>([0, 1000000]);
  const [showMissingBenchmarks, setShowMissingBenchmarks] = useState(false);

  // Add state for market data
  const [marketData, setMarketData] = useState<any[]>([]);
  const [providersWithoutBenchmarks, setProvidersWithoutBenchmarks] = useState<Provider[]>([]);

  const [columns, setColumns] = useState<Column[]>([
    { 
      id: 'select', 
      label: '', 
      key: (provider: Provider) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          checked={selectedProviders.includes(provider.id)}
          onChange={(e) => {
            e.stopPropagation();
            if (e.target.checked) {
              setSelectedProviders([...selectedProviders, provider.id]);
            } else {
              setSelectedProviders(selectedProviders.filter(id => id !== provider.id));
            }
          }}
        />
      )
    },
    { id: 'status', label: 'Status', key: (provider: Provider) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleStatusChange(provider.id, provider.status);
        }}
        className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium
          ${provider.status === 'Active'
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
          }`}
      >
        {provider.status === 'Active' ? (
          <>
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircleIcon className="w-4 h-4 mr-1" />
            Inactive
          </>
        )}
      </button>
    )},
    { id: 'name', label: 'Name', key: (provider: Provider) => (
      <Link 
        href={`/provider/${provider.employeeId}`}
        className="text-blue-600 hover:text-blue-800 hover:underline"
      >
        {`${provider.firstName} ${provider.lastName}`}
      </Link>
    )},
    { id: 'employeeId', label: 'ID', key: 'employeeId' },
    { id: 'specialty', label: 'Specialty', key: 'specialty' },
    { id: 'department', label: 'Department', key: 'department' },
    { id: 'fte', label: 'FTE', key: (provider: Provider) => provider.fte.toFixed(2) },
    { id: 'baseSalary', label: 'Base Salary', key: (provider: Provider) => formatCurrency(provider.baseSalary) },
    { id: 'conversionFactor', label: 'Conv. Factor', key: (provider: Provider) => {
      const marketDataMatch = marketData.find(data => data.specialty === provider.specialty);
      return marketDataMatch ? formatCurrency(marketDataMatch.p50_cf) : '-';
    }},
    { id: 'compensationModel', label: 'Comp Model', key: 'compensationModel' },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchProviders();
  }, []);

  // Add function to fetch market data
  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      const data = await response.json();
      setMarketData(data);
    } catch (err) {
      console.error('Error fetching market data:', err);
    }
  };

  // Update useEffect to fetch both providers and market data
  useEffect(() => {
    fetchProviders();
    fetchMarketData();
  }, []);

  // Update useEffect for filtering to include market data lookup
  useEffect(() => {
    // Filter data based on search query and other filters
    let filtered = providers.filter(provider => {
      // Split search query into words
      const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
      
      const matchesSearch = searchTerms.length === 0 || searchTerms.every(term => 
        provider.firstName.toLowerCase().includes(term) ||
        provider.lastName.toLowerCase().includes(term) ||
        `${provider.firstName} ${provider.lastName}`.toLowerCase().includes(term) ||
        provider.specialty.toLowerCase().includes(term) ||
        provider.employeeId.toLowerCase().includes(term)
      );

      const matchesSpecialty = !selectedSpecialty || provider.specialty === selectedSpecialty;
      const matchesDepartment = !selectedDepartment || provider.department === selectedDepartment;
      const matchesStatus = !selectedStatus || provider.status === selectedStatus;
      const matchesFTE = provider.fte >= fteRange[0] && provider.fte <= fteRange[1];
      const matchesSalary = provider.baseSalary >= baseSalaryRange[0] && provider.baseSalary <= baseSalaryRange[1];

      // Check if provider has matching benchmark in market data
      const hasMatchingBenchmark = marketData.some(data => data.specialty === provider.specialty);
      const matchesMissingBenchmarks = !showMissingBenchmarks || !hasMatchingBenchmark;

      return matchesSearch && matchesSpecialty && matchesDepartment && 
             matchesStatus && matchesFTE && matchesSalary && matchesMissingBenchmarks;
    });

    // Update providers without benchmarks
    const withoutBenchmarks = providers.filter(provider => 
      !marketData.some(data => data.specialty === provider.specialty)
    );
    setProvidersWithoutBenchmarks(withoutBenchmarks);

    setFilteredProviders(filtered);
  }, [providers, searchQuery, selectedSpecialty, selectedDepartment, selectedStatus, 
      fteRange, baseSalaryRange, showMissingBenchmarks, marketData]);

  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredProviders.length / rowsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      const data = await response.json();
      setProviders(data.providers);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatusChange = async (providerId: string, currentStatus: string) => {
    try {
      console.log('Updating status for provider:', providerId);
      console.log('Current status:', currentStatus);
      
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      console.log('New status:', newStatus);
      
      const url = `/api/providers/${providerId}/status`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || `Failed to update status: ${response.statusText}`);
      }

      // Update the provider's status in the local state
      setProviders(prevProviders =>
        prevProviders.map(provider =>
          provider.id === providerId
            ? { ...provider, status: newStatus }
            : provider
        )
      );

      // Show success message
      alert('Provider status updated successfully');
    } catch (error) {
      console.error('Error updating provider status:', error);
      // Show error message to user
      alert(error instanceof Error ? error.message : 'Failed to update provider status. Please try again.');
    }
  };

  const handleAddProvider = async (data: any) => {
    try {
      const response = await fetch('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to add provider');
      }

      await fetchProviders(); // Refresh the list
    } catch (error) {
      console.error('Error adding provider:', error);
      throw error;
    }
  };

  const handleEditProvider = async (data: any) => {
    try {
      const response = await fetch(`/api/providers/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update provider');
      }

      await fetchProviders(); // Refresh the list
      setEditingProvider(null);
    } catch (error) {
      console.error('Error updating provider:', error);
      throw error;
    }
  };

  const handleDeleteProviders = async () => {
    if (!selectedProviders.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedProviders.length} provider(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/providers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedProviders }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete providers');
      }

      await fetchProviders(); // Refresh the list
      setSelectedProviders([]); // Clear selection
      alert('Providers deleted successfully');
    } catch (error) {
      console.error('Error deleting providers:', error);
      alert('Failed to delete providers. Please try again.');
    }
  };

  // Add this function to handle filter reset
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSpecialty('');
    setSelectedDepartment('');
    setSelectedStatus('');
    setFteRange([0, 1]);
    setBaseSalaryRange([0, 1000000]);
    setShowMissingBenchmarks(false);
  };

  // Add this function to generate page numbers
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 5;
    const halfMaxPages = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      // If total pages is less than max pages to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - halfMaxPages);
      let endPage = Math.min(totalPages - 1, currentPage + halfMaxPages);

      // Adjust if current page is near the start
      if (currentPage <= halfMaxPages + 1) {
        endPage = maxPagesToShow - 1;
      }
      // Adjust if current page is near the end
      else if (currentPage >= totalPages - halfMaxPages) {
        startPage = totalPages - (maxPagesToShow - 2);
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push('...');
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }

      // Always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  return (
    <>
      {!mounted ? null : (
        <div className="h-full flex flex-col space-y-3 bg-white">
          {loading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-screen">
              <div className="text-red-500">Error: {error}</div>
            </div>
          ) : (
            <>
              {/* Header with border */}
              <div className="bg-white rounded-lg shadow p-5">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Provider Management</h1>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage provider information, compensation models, and performance metrics.
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search providers or specialties..."
                        className="w-[300px] px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Add Provider
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-5 space-y-6">
                  {/* Filter Groups */}
                  <div className="space-y-4">
                    {/* First Row - Dropdowns */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Specialty</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={selectedSpecialty}
                          onChange={(e) => setSelectedSpecialty(e.target.value)}
                        >
                          <option value="">All Specialties</option>
                          {Array.from(new Set(providers.map(p => p.specialty))).sort().map(specialty => (
                            <option key={specialty} value={specialty}>{specialty}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Department</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={selectedDepartment}
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                        >
                          <option value="">All Departments</option>
                          {Array.from(new Set(providers.map(p => p.department))).sort().map(department => (
                            <option key={department} value={department}>{department}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <select
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={selectedStatus}
                          onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                          <option value="">All Status</option>
                          {Array.from(new Set(providers.map(p => p.status))).sort().map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Second Row - Range Sliders */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                          <span>FTE Range</span>
                        </div>
                        <div className="relative h-10">
                          <div className="slider absolute top-1/2 -translate-y-1/2 w-full">
                            <div 
                              className="track" 
                              style={{
                                left: `${(fteRange[0]) * 100}%`,
                                width: `${(fteRange[1] - fteRange[0]) * 100}%`
                              }}
                            ></div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={fteRange[0]}
                            onChange={(e) => {
                              const value = Math.min(parseFloat(e.target.value), fteRange[1] - 0.1);
                              setFteRange([value, fteRange[1]]);
                            }}
                            className="absolute w-full"
                          />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={fteRange[1]}
                            onChange={(e) => {
                              const value = Math.max(parseFloat(e.target.value), fteRange[0] + 0.1);
                              setFteRange([fteRange[0], value]);
                            }}
                            className="absolute w-full"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span className="text-sm font-medium text-gray-700">0.0</span>
                          <span className="text-sm font-medium text-gray-700">0.5</span>
                          <span className="text-sm font-medium text-gray-700">1.0</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium text-gray-700">
                          <span>Base Salary Range</span>
                        </div>
                        <div className="relative h-10">
                          <div className="slider absolute top-1/2 -translate-y-1/2 w-full">
                            <div 
                              className="track" 
                              style={{
                                left: `${(baseSalaryRange[0] / 1000000) * 100}%`,
                                width: `${((baseSalaryRange[1] - baseSalaryRange[0]) / 1000000) * 100}%`
                              }}
                            ></div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1000000"
                            step="10000"
                            value={baseSalaryRange[0]}
                            onChange={(e) => {
                              const value = Math.min(parseInt(e.target.value), baseSalaryRange[1] - 10000);
                              setBaseSalaryRange([value, baseSalaryRange[1]]);
                            }}
                            className="absolute w-full"
                          />
                          <input
                            type="range"
                            min="0"
                            max="1000000"
                            step="10000"
                            value={baseSalaryRange[1]}
                            onChange={(e) => {
                              const value = Math.max(parseInt(e.target.value), baseSalaryRange[0] + 10000);
                              setBaseSalaryRange([baseSalaryRange[0], value]);
                            }}
                            className="absolute w-full"
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span className="text-sm font-medium text-gray-700">$0</span>
                          <span className="text-sm font-medium text-gray-700">$500,000</span>
                          <span className="text-sm font-medium text-gray-700">$1,000,000</span>
                        </div>
                      </div>
                    </div>

                    {/* Third Row - Toggle and Reset */}
                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={showMissingBenchmarks}
                          onChange={(e) => setShowMissingBenchmarks(e.target.checked)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          Show Missing Benchmarks Only ({providersWithoutBenchmarks.length})
                        </span>
                      </label>
                      <button
                        onClick={handleResetFilters}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Reset Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar - Only visible when rows are selected */}
              {selectedProviders.length > 0 && (
                <div className="flex items-center gap-4 pt-4 border-t">
                  <span className="text-sm text-gray-600">
                    {selectedProviders.length} provider{selectedProviders.length > 1 ? 's' : ''} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => {
                        if (selectedProviders.length === 1) {
                          const provider = providers.find(p => p.id === selectedProviders[0]);
                          setEditingProvider(provider);
                          setIsEditModalOpen(true);
                        } else {
                          alert('Please select only one provider to edit');
                        }
                      }}
                    >
                      <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                      Edit
                    </button>
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                      onClick={handleDeleteProviders}
                    >
                      <TrashIcon className="h-4 w-4 mr-1.5" />
                      Delete
                    </button>
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        if (selectedProviders.length === 1) {
                          const provider = providers.find(p => p.id === selectedProviders[0]);
                          if (provider) {
                            window.location.href = `/provider/${provider.employeeId}`;
                          }
                        } else {
                          alert('Please select only one provider to view metrics');
                        }
                      }}
                    >
                      <ChartBarIcon className="h-4 w-4 mr-1.5" />
                      View Metrics
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="flex flex-col bg-white shadow-lg rounded-lg flex-1 min-h-0 border border-gray-200">
                <div className="overflow-y-scroll flex-1 rounded-t-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
                      <tr>
                        <th scope="col" className="w-10 px-2 py-3 text-left bg-gray-50">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            checked={paginatedProviders.length > 0 && selectedProviders.length === paginatedProviders.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProviders(paginatedProviders.map(p => p.id));
                              } else {
                                setSelectedProviders([]);
                              }
                            }}
                          />
                        </th>
                        <th scope="col" className="w-20 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-300">
                          Status
                        </th>
                        <th scope="col" className="w-36 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          ID
                        </th>
                        <th scope="col" className="w-36 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Specialty
                        </th>
                        <th scope="col" className="w-36 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider border-r border-gray-300">
                          Department
                        </th>
                        <th scope="col" className="w-16 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          FTE
                        </th>
                        <th scope="col" className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Base Salary
                        </th>
                        <th scope="col" className="w-28 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Conv. Factor
                        </th>
                        <th scope="col" className="w-24 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Comp Model
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedProviders.map((provider) => (
                        <tr 
                          key={provider.id}
                          onClick={() => {
                            if (selectedProviders.includes(provider.id)) {
                              setSelectedProviders(selectedProviders.filter(id => id !== provider.id));
                            } else {
                              setSelectedProviders([...selectedProviders, provider.id]);
                            }
                          }}
                          className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                            selectedProviders.includes(provider.id) ? 'bg-indigo-50' : ''
                          } ${provider.status === 'Inactive' ? 'text-gray-500' : ''}`}
                        >
                          <td className={classNames(
                            'whitespace-nowrap px-2 py-3 text-sm sticky left-0 bg-white w-10',
                            selectedProviders.includes(provider.id) ? 'bg-indigo-50' : ''
                          )}>
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              checked={selectedProviders.includes(provider.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedProviders([...selectedProviders, provider.id]);
                                } else {
                                  setSelectedProviders(selectedProviders.filter(id => id !== provider.id));
                                }
                              }}
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm border-r border-gray-300">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(provider.id, provider.status);
                              }}
                              className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium
                                ${provider.status === 'Active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                }`}
                            >
                              {provider.status === 'Active' ? (
                                <>
                                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                                  Active
                                </>
                              ) : (
                                <>
                                  <XCircleIcon className="w-4 h-4 mr-1" />
                                  Inactive
                                </>
                              )}
                            </button>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm">
                            <Link 
                              href={`/provider/${provider.employeeId}`}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {`${provider.firstName} ${provider.lastName}`}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">{provider.employeeId}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">{provider.specialty}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600 border-r border-gray-300">{provider.department}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">{provider.fte.toFixed(2)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">{formatCurrency(provider.baseSalary)}</td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">
                            {(() => {
                              const marketDataMatch = marketData.find(data => data.specialty === provider.specialty);
                              return marketDataMatch ? formatCurrency(marketDataMatch.p50_cf) : '-';
                            })()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-600">{provider.compensationModel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Fixed Pagination */}
                <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                  <div className="flex items-center">
                    <p className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredProviders.length)} of{' '}
                      <span className="font-medium">{filteredProviders.length}</span> results
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    {getPageNumbers().map((pageNumber, index) => (
                      <button
                        key={index}
                        onClick={() => typeof pageNumber === 'number' ? handlePageChange(pageNumber) : null}
                        disabled={pageNumber === '...'}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                          pageNumber === currentPage
                            ? 'z-10 bg-indigo-600 text-white'
                            : 'text-gray-700 bg-white hover:bg-gray-50'
                        } border border-gray-300 ${pageNumber === '...' ? 'cursor-default' : ''}`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add Provider Modal */}
              <AddProviderModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddProvider}
              />

              {/* Edit Provider Modal */}
              <AddProviderModal
                isOpen={isEditModalOpen}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setEditingProvider(null);
                }}
                onSubmit={handleEditProvider}
                provider={editingProvider}
                mode="edit"
              />

              {/* Add these styles to your global CSS file (e.g., globals.css) */}
              <style jsx global>{`
                #tableContainer {
                  overflow-x: scroll;
                  scrollbar-width: none;
                  -ms-overflow-style: none;
                }

                #tableContainer::-webkit-scrollbar {
                  display: none;
                }

                /* Style the fixed horizontal scrollbar */
                .sticky.bottom-0 .overflow-x-scroll {
                  scrollbar-width: thin;
                  scrollbar-color: #888 #f1f1f1;
                }

                .sticky.bottom-0 .overflow-x-scroll::-webkit-scrollbar {
                  height: 12px;
                  display: block;
                }

                .sticky.bottom-0 .overflow-x-scroll::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 6px;
                }

                .sticky.bottom-0 .overflow-x-scroll::-webkit-scrollbar-thumb {
                  background: #888;
                  border-radius: 6px;
                }

                .sticky.bottom-0 .overflow-x-scroll::-webkit-scrollbar-thumb:hover {
                  background: #666;
                }

                /* Set minimum widths for columns to ensure proper scrolling */
                th, td {
                  min-width: 120px;
                  white-space: nowrap;
                }

                th:first-child, td:first-child {
                  position: sticky;
                  left: 0;
                  z-index: 1;
                  background: inherit;
                  width: 48px;
                  min-width: 48px;
                  padding-left: 16px;
                  padding-right: 16px;
                }

                /* Dual Range Slider Styles */
                .relative input[type="range"] {
                  pointer-events: none;
                  position: absolute;
                  -webkit-appearance: none;
                  appearance: none;
                  width: 100%;
                  height: 100%;
                  border: none;
                  outline: none;
                  background: none;
                  z-index: 3;
                }
                
                .relative input[type="range"]::-webkit-slider-thumb {
                  pointer-events: all;
                  position: relative;
                  appearance: none;
                  -webkit-appearance: none;
                  width: 16px;
                  height: 16px;
                  border: 2px solid #6366F1;
                  border-radius: 50%;
                  background-color: white;
                  cursor: pointer;
                  margin-top: -6px;
                  z-index: 4;
                }
                
                .relative div[class*="slider"] {
                  position: absolute;
                  left: 0;
                  right: 0;
                  top: 50%;
                  transform: translateY(-50%);
                  height: 4px;
                  border-radius: 2px;
                  background: #E5E7EB;
                }
                
                .relative div[class*="slider"] .track {
                  position: absolute;
                  height: 100%;
                  border-radius: 2px;
                  background: #6366F1;
                }
                
                .relative input[type="range"]::-webkit-slider-runnable-track {
                  -webkit-appearance: none;
                  width: 100%;
                  height: 4px;
                  background: transparent;
                  border: none;
                  border-radius: 2px;
                }
                
                .relative input[type="range"]::-moz-range-track {
                  width: 100%;
                  height: 4px;
                  background: transparent;
                  border: none;
                  border-radius: 2px;
                }
                
                .relative input[type="range"]::-ms-track {
                  width: 100%;
                  height: 4px;
                  background: transparent;
                  border: none;
                  border-radius: 2px;
                  color: transparent;
                }

                /* Hide default focus styles */
                .relative input[type="range"]:focus {
                  outline: none;
                }
              `}</style>
            </>
          )}
        </div>
      )}
    </>
  );
} 