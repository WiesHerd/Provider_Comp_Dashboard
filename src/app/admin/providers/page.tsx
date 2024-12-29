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
  ChevronRightIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import AddProviderModal from '@/components/Providers/AddProviderModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { utils, writeFile } from 'xlsx';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

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

interface DualRangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({ min, max, step, value, onChange }) => {
  return (
    <div className="relative h-10">
      <div className="slider absolute top-1/2 -translate-y-1/2 w-full">
        <div 
          className="track" 
          style={{
            left: `${((value[0] - min) / (max - min)) * 100}%`,
            width: `${((value[1] - value[0]) / (max - min)) * 100}%`
          }}
        ></div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => {
          const newValue = Math.min(parseFloat(e.target.value), value[1] - step);
          onChange([newValue, value[1]]);
        }}
        className="absolute w-full"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[1]}
        onChange={(e) => {
          const newValue = Math.max(parseFloat(e.target.value), value[0] + step);
          onChange([value[0], newValue]);
        }}
        className="absolute w-full"
      />
    </div>
  );
};

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
  const [selectedCompModel, setSelectedCompModel] = useState('');
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [fteRange, setFteRange] = useState<[number, number]>([0, 1]);
  const [baseSalaryRange, setBaseSalaryRange] = useState<[number, number]>([0, 1000000]);
  const [showMissingBenchmarks, setShowMissingBenchmarks] = useState(false);
  const [showMissingWRVUs, setShowMissingWRVUs] = useState(false);
  const [providersWithoutWRVUs, setProvidersWithoutWRVUs] = useState<Provider[]>([]);

  // Add state for market data
  const [marketData, setMarketData] = useState<any[]>([]);
  const [providersWithoutBenchmarks, setProvidersWithoutBenchmarks] = useState<Provider[]>([]);

  // Add state for comp model editing
  const [editingCompModel, setEditingCompModel] = useState<string | null>(null);
  const [isCompModelModalOpen, setIsCompModelModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [newCompModel, setNewCompModel] = useState('');

  const compModelOptions = ['Base Pay', 'Custom', 'Standard', 'Tiered CF'];

  const handleCompModelUpdate = async (providerId: string, newModel: string) => {
    try {
      const response = await fetch(`/api/providers/${providerId}/comp-model`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ compensationModel: newModel }),
      });

      if (!response.ok) {
        throw new Error('Failed to update compensation model');
      }

      // Refresh the providers list
      await fetchProviders();
      setIsCompModelModalOpen(false);
      setSelectedProvider(null);
      setNewCompModel('');
    } catch (error) {
      console.error('Error updating compensation model:', error);
    }
  };

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
    { id: 'status', label: 'Status', key: (provider: Provider) => (
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (provider.status === 'Active') {
              setSelectedProviderForTermination(provider);
              setIsTerminationModalOpen(true);
            } else {
              updateProviderStatus(provider.employeeId, 'Active', null);
            }
          }}
          className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
            provider.status === 'Active'
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
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
        {provider.terminationDate && (
          <span className="text-xs text-gray-500">
            {new Date(provider.terminationDate).toLocaleDateString()}
          </span>
        )}
      </div>
    )},
    { id: 'fte', label: 'FTE', key: (provider: Provider) => provider.fte.toFixed(2) },
    { id: 'baseSalary', label: 'Base Salary', key: (provider: Provider) => formatCurrency(provider.baseSalary) },
    { id: 'compensationModel', label: 'Comp Model', key: (provider: Provider) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedProvider(provider);
          setNewCompModel(provider.compensationModel);
          setIsCompModelModalOpen(true);
        }}
        className="text-left text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 focus:outline-none"
      >
        <span>{provider.compensationModel}</span>
        <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    )},
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

  // Add wRVU data check to providers
  useEffect(() => {
    const fetchWRVUData = async () => {
      try {
        const response = await fetch('/api/wrvu-data');
        if (!response.ok) throw new Error('Failed to fetch wRVU data');
        const wrvuData = await response.json();
        
        // Create a map of provider IDs to wRVU data
        const wrvuMap = new Map(wrvuData.map((d: any) => [d.employee_id, d]));
        
        // Update providers without wRVUs
        const providersWithNoWRVUs = providers.filter(provider => !wrvuMap.has(provider.employeeId));
        setProvidersWithoutWRVUs(providersWithNoWRVUs);
      } catch (error) {
        console.error('Error fetching wRVU data:', error);
      }
    };
    
    if (providers.length > 0) {
      fetchWRVUData();
    }
  }, [providers]);

  useEffect(() => {
    let filtered = [...providers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(provider => 
        `${provider.firstName} ${provider.lastName} ${provider.employeeId} ${provider.specialty} ${provider.status}`
          .toLowerCase()
          .includes(query)
      );
    }

    // Apply specialty filter
    if (selectedSpecialty) {
      filtered = filtered.filter(provider => provider.specialty === selectedSpecialty);
    }

    // Apply department filter
    if (selectedDepartment) {
      filtered = filtered.filter(provider => provider.department === selectedDepartment);
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(provider => provider.status === selectedStatus);
    }

    // Apply comp model filter
    if (selectedCompModel) {
      filtered = filtered.filter(provider => provider.compensationModel === selectedCompModel);
    }

    // Apply FTE range filter
    filtered = filtered.filter(provider => 
      provider.fte >= fteRange[0] && provider.fte <= fteRange[1]
    );

    // Apply base salary range filter
    filtered = filtered.filter(provider => 
      provider.baseSalary >= baseSalaryRange[0] && provider.baseSalary <= baseSalaryRange[1]
    );

    // Apply missing benchmarks filter
    if (showMissingBenchmarks) {
      filtered = filtered.filter(provider => 
        providersWithoutBenchmarks.some(p => p.id === provider.id)
      );
    }

    // Apply missing wRVUs filter
    if (showMissingWRVUs) {
      filtered = filtered.filter(provider => 
        providersWithoutWRVUs.some(p => p.id === provider.id)
      );
    }

    setFilteredProviders(filtered);
  }, [providers, searchQuery, selectedSpecialty, selectedDepartment, selectedStatus, 
      selectedCompModel, fteRange, baseSalaryRange, showMissingBenchmarks, showMissingWRVUs,
      providersWithoutBenchmarks, providersWithoutWRVUs]);

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
      console.log('Fetched providers:', data.providers);
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleStatusChange = async (provider: Provider) => {
    if (provider.status === 'Active') {
      setSelectedProviderForTermination(provider);
      setIsTerminationModalOpen(true);
    } else {
      await updateProviderStatus(provider.employeeId, 'Active', null);
    }
  };

  const handleTermination = async () => {
    if (selectedProviderForTermination && terminationDate) {
      await updateProviderStatus(selectedProviderForTermination.employeeId, 'Inactive', terminationDate);
      setIsTerminationModalOpen(false);
      setSelectedProviderForTermination(null);
      setTerminationDate('');
    }
  };

  const updateProviderStatus = async (employeeId: string, status: string, terminationDate: string | null) => {
    try {
      const response = await fetch(`/api/providers/${employeeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, terminationDate }),
      });

      if (!response.ok) {
        throw new Error('Failed to update provider status');
      }

      // Refresh the providers list
      fetchProviders();
    } catch (error) {
      console.error('Error updating provider status:', error);
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
    setSelectedCompModel('');
    setFteRange([0, 1]);
    setBaseSalaryRange([0, 1000000]);
    setShowMissingBenchmarks(false);
    setShowMissingWRVUs(false);
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

  const handleExportToExcel = () => {
    // Create worksheet data from filtered providers
    const worksheetData = filteredProviders.map(provider => ({
      'Name': `${provider.firstName} ${provider.lastName}`,
      'ID': provider.employeeId,
      'Specialty': provider.specialty,
      'Department': provider.department,
      'Status': provider.status,
      'FTE': provider.fte,
      'Base Salary': provider.baseSalary,
      'Conversion Factor': marketData.find(data => data.specialty === provider.specialty)?.p50_cf || '-',
      'Comp Model': provider.compensationModel
    }));

    // Create workbook and worksheet
    const worksheet = utils.json_to_sheet(worksheetData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Providers');

    // Generate file name with current date
    const date = new Date().toISOString().split('T')[0];
    const fileName = `providers_export_${date}.xlsx`;

    // Save file
    writeFile(workbook, fileName);
  };

  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
  const [selectedProviderForTermination, setSelectedProviderForTermination] = useState<Provider | null>(null);
  const [terminationDate, setTerminationDate] = useState('');

  // Add state for filter visibility
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Update the filters section JSX
  {/* Filters Toggle Button */}
  <div className="bg-white rounded-lg shadow">
    <div className="p-4 flex items-center justify-between">
      <button
        onClick={() => setIsFiltersVisible(!isFiltersVisible)}
        className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
      >
        <FunnelIcon className="h-5 w-5" />
        <span className="font-medium">Filters</span>
        {activeFilterCount > 0 && (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-sm">
            {activeFilterCount}
          </span>
        )}
        <ChevronDownIcon
          className={`h-5 w-5 transition-transform ${isFiltersVisible ? 'rotate-180' : ''}`}
        />
      </button>
      {activeFilterCount > 0 && (
        <button
          onClick={() => {
            setSelectedSpecialty('');
            setSelectedCompModel('');
            setFteRange([0, 1]);
            setBaseSalaryRange([0, 1000000]);
            setShowMissingBenchmarks(false);
            setShowMissingWRVUs(false);
          }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
        >
          <XMarkIcon className="h-5 w-5" />
          <span className="text-sm">Clear Filters</span>
        </button>
      )}
    </div>

    {/* Collapsible Filter Content */}
    <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
      isFiltersVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
    }`}>
      <div className="p-6 space-y-8 border-t">
        {/* First Row - Range Sliders */}
        <div className="grid grid-cols-2 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              FTE Range
            </label>
            <div className="px-2">
              <DualRangeSlider
                min={0}
                max={1}
                step={0.1}
                value={fteRange}
                onChange={setFteRange}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{fteRange[0].toFixed(1)}</span>
              <span>{fteRange[1].toFixed(1)}</span>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Salary Range
            </label>
            <div className="px-2">
              <DualRangeSlider
                min={0}
                max={1000000}
                step={10000}
                value={baseSalaryRange}
                onChange={setBaseSalaryRange}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{formatCurrency(baseSalaryRange[0])}</span>
              <span>{formatCurrency(baseSalaryRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Second Row - Search, Specialty, and Comp Model */}
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <label className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 pl-10"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <label className="block text-sm font-medium text-gray-700">
              Specialty
            </label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
            >
              <option value="">All specialties</option>
              {Array.from(new Set(providers.map(p => p.specialty))).sort().map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <label className="block text-sm font-medium text-gray-700">
              Comp Model
            </label>
            <select
              value={selectedCompModel}
              onChange={(e) => setSelectedCompModel(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
            >
              <option value="">All models</option>
              {compModelOptions.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Third Row - Toggles */}
        <div className="flex items-center space-x-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showMissingBenchmarks}
                onChange={(e) => setShowMissingBenchmarks(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
            <span className="ml-3 text-sm text-gray-700">
              Show Missing Benchmarks Only ({providersWithoutBenchmarks.length})
            </span>
          </div>

          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showMissingWRVUs}
                onChange={(e) => setShowMissingWRVUs(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
            <span className="ml-3 text-sm text-gray-700">
              Show Missing wRVUs Only ({providersWithoutWRVUs.length})
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>

  // Update useEffect to count active filters
  useEffect(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedSpecialty) count++;
    if (selectedCompModel) count++;
    if (fteRange[0] > 0 || fteRange[1] < 1) count++;
    if (baseSalaryRange[0] > 0 || baseSalaryRange[1] < 1000000) count++;
    if (showMissingBenchmarks) count++;
    if (showMissingWRVUs) count++;
    setActiveFilterCount(count);
  }, [searchQuery, selectedSpecialty, selectedCompModel, 
      fteRange, baseSalaryRange, showMissingBenchmarks, showMissingWRVUs]);

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
                    <button
                      onClick={handleExportToExcel}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors shadow-sm"
                    >
                      Export to Excel
                    </button>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      Add Provider
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 flex items-center justify-between">
                  <button
                    onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                  >
                    <FunnelIcon className="h-5 w-5" />
                    <span className="font-medium">Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-sm">
                        {activeFilterCount}
                      </span>
                    )}
                    <ChevronDownIcon
                      className={`h-5 w-5 transition-transform ${isFiltersVisible ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleResetFilters}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                    >
                      <XMarkIcon className="h-5 w-5" />
                      <span className="text-sm">Clear Filters</span>
                    </button>
                  )}
                </div>

                {/* Collapsible Filter Content */}
                <div className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  isFiltersVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="p-6 space-y-8 border-t">
                    {/* First Row - Range Sliders */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          FTE Range
                        </label>
                        <div className="px-2">
                          <DualRangeSlider
                            min={0}
                            max={1}
                            step={0.1}
                            value={fteRange}
                            onChange={setFteRange}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{fteRange[0].toFixed(1)}</span>
                          <span>{fteRange[1].toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Base Salary Range
                        </label>
                        <div className="px-2">
                          <DualRangeSlider
                            min={0}
                            max={1000000}
                            step={10000}
                            value={baseSalaryRange}
                            onChange={setBaseSalaryRange}
                          />
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{formatCurrency(baseSalaryRange[0])}</span>
                          <span>{formatCurrency(baseSalaryRange[1])}</span>
                        </div>
                      </div>
                    </div>

                    {/* Second Row - Search, Specialty, and Comp Model */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700">
                          Search
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search providers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10 pl-10"
                          />
                          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                      </div>

                      <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700">
                          Specialty
                        </label>
                        <select
                          value={selectedSpecialty}
                          onChange={(e) => setSelectedSpecialty(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        >
                          <option value="">All specialties</option>
                          {Array.from(new Set(providers.map(p => p.specialty))).sort().map(specialty => (
                            <option key={specialty} value={specialty}>{specialty}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700">
                          Comp Model
                        </label>
                        <select
                          value={selectedCompModel}
                          onChange={(e) => setSelectedCompModel(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                        >
                          <option value="">All models</option>
                          {compModelOptions.map((model) => (
                            <option key={model} value={model}>{model}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Third Row - Toggles */}
                    <div className="flex items-center space-x-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showMissingBenchmarks}
                            onChange={(e) => setShowMissingBenchmarks(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                        <span className="ml-3 text-sm text-gray-700">
                          Show Missing Benchmarks Only ({providersWithoutBenchmarks.length})
                        </span>
                      </div>

                      <div className="flex items-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showMissingWRVUs}
                            onChange={(e) => setShowMissingWRVUs(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                        <span className="ml-3 text-sm text-gray-700">
                          Show Missing wRVUs Only ({providersWithoutWRVUs.length})
                        </span>
                      </div>
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
                          alert('Please select only one provider to view dashboard');
                        }
                      }}
                    >
                      <ChartBarIcon className="h-4 w-4 mr-1.5" />
                      View Dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="flex flex-col bg-white shadow-lg rounded-lg flex-1 min-h-0 border border-gray-200">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
                        <SortableContext
                          items={columns.map(col => col.id)}
                          strategy={horizontalListSortingStrategy}
                        >
                          <tr>
                            {columns.map((column) => (
                              <SortableHeader
                                key={column.id}
                                column={column}
                                selectedProviders={selectedProviders}
                                setSelectedProviders={setSelectedProviders}
                                paginatedProviders={paginatedProviders}
                              />
                            ))}
                          </tr>
                        </SortableContext>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedProviders.map((provider) => (
                          <tr
                            key={provider.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => router.push(`/provider/${provider.employeeId}`)}
                          >
                            {columns.map((column) => (
                              <td
                                key={column.id}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                              >
                                {typeof column.key === 'function'
                                  ? column.key(provider)
                                  : provider[column.key]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DndContext>
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

              {/* Termination Modal */}
              <Transition appear show={isTerminationModalOpen} as={Fragment}>
                <Dialog
                  as="div"
                  className="relative z-50"
                  onClose={() => setIsTerminationModalOpen(false)}
                >
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                  </Transition.Child>

                  <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                      <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                      >
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                          <Dialog.Title
                            as="h3"
                            className="text-lg font-medium leading-6 text-gray-900 mb-4"
                          >
                            Provider Termination
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500 mb-4">
                              Please enter the termination date for {selectedProviderForTermination?.firstName} {selectedProviderForTermination?.lastName}
                            </p>
                            <input
                              type="date"
                              value={terminationDate}
                              onChange={(e) => setTerminationDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>

                          <div className="mt-6 flex justify-end gap-3">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              onClick={() => setIsTerminationModalOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              onClick={handleTermination}
                              disabled={!terminationDate}
                            >
                              Terminate
                            </button>
                          </div>
                        </Dialog.Panel>
                      </Transition.Child>
                    </div>
                  </div>
                </Dialog>
              </Transition>

              {/* Comp Model Edit Modal */}
              <Transition appear show={isCompModelModalOpen} as={Fragment}>
                <Dialog
                  as="div"
                  className="relative z-50"
                  onClose={() => setIsCompModelModalOpen(false)}
                >
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                  </Transition.Child>

                  <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                      <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                      >
                        <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                          <Dialog.Title
                            as="h3"
                            className="text-lg font-medium leading-6 text-gray-900 mb-4"
                          >
                            Update Compensation Model
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500 mb-4">
                              Select a new compensation model for {selectedProvider?.firstName} {selectedProvider?.lastName}
                            </p>
                            <select
                              value={newCompModel}
                              onChange={(e) => setNewCompModel(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              {compModelOptions.map((model) => (
                                <option key={model} value={model}>
                                  {model}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mt-6 flex justify-end gap-3">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              onClick={() => setIsCompModelModalOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              onClick={() => {
                                if (selectedProvider && newCompModel) {
                                  handleCompModelUpdate(selectedProvider.employeeId, newCompModel);
                                }
                              }}
                            >
                              Update
                            </button>
                          </div>
                        </Dialog.Panel>
                      </Transition.Child>
                    </div>
                  </div>
                </Dialog>
              </Transition>

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