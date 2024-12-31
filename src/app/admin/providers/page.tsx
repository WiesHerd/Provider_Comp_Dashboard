'use client';

import { useState, useEffect, useMemo } from 'react';
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
  XMarkIcon,
  PlusIcon,
  BuildingOffice2Icon
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
import { Switch } from '@headlessui/react';

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
  clinicalFte: number;
  nonClinicalFte: number;
  baseSalary: number;
  clinicalSalary: number;
  nonClinicalSalary: number;
  compensationModel: string;
  createdAt: string;
  updatedAt: string;
  benchmarks?: any;
  wrvus?: any;
  select?: boolean;
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

const formatSalary = (value: number) => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatFTE = (value: number) => {
  return value.toFixed(2);
};

export default function ProvidersPage() {
  // State declarations
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedCompModel, setSelectedCompModel] = useState('');
  const [fteRange, setFTERange] = useState<[number, number]>([0, 1]);
  const [baseSalaryRange, setBaseSalaryRange] = useState<[number, number]>([0, 1000000]);
  const [showMissingBenchmarks, setShowMissingBenchmarks] = useState(false);
  const [showMissingWRVUs, setShowMissingWRVUs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [wRVUData, setWRVUData] = useState<any[]>([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [isTerminationModalOpen, setIsTerminationModalOpen] = useState(false);
  const [selectedProviderForTermination, setSelectedProviderForTermination] = useState<Provider | null>(null);
  const [terminationDate, setTerminationDate] = useState('');
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isCompModelModalOpen, setIsCompModelModalOpen] = useState(false);
  const [newCompModel, setNewCompModel] = useState('');
  const [providersWithoutBenchmarks, setProvidersWithoutBenchmarks] = useState<Provider[]>([]);
  const [providersWithoutWRVUs, setProvidersWithoutWRVUs] = useState<Provider[]>([]);
  const [providersWithNonClinicalFTE, setProvidersWithNonClinicalFTE] = useState<Provider[]>([]);
  const [showNonClinicalOnly, setShowNonClinicalOnly] = useState(false);
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [columns, setColumns] = useState<Column[]>([
    { 
      id: 'select',
      label: '',
      key: (provider: Provider) => provider.id
    },
    { 
      id: 'employeeId',
      label: 'EMPLOYEE ID',
      key: 'employeeId'
    },
    { 
      id: 'name',
      label: 'NAME',
      key: (provider: Provider) => (
        <Link
          href={`/provider/${provider.employeeId}`}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {provider.firstName} {provider.lastName}
        </Link>
      ),
    },
    {
      id: 'email',
      label: 'EMAIL',
      key: 'email',
    },
    {
      id: 'specialty',
      label: 'SPECIALTY',
      key: 'specialty',
    },
    {
      id: 'department',
      label: 'DEPARTMENT',
      key: 'department',
    },
    {
      id: 'status',
      label: 'STATUS',
      key: (provider: Provider) => (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            const newStatus = provider.status === 'Active' ? 'Inactive' : 'Active';
            if (newStatus === 'Inactive') {
              setSelectedProviderForTermination(provider);
              setIsTerminationModalOpen(true);
              return;
            }
            try {
              const response = await fetch(`/api/providers/${provider.employeeId}/status`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
              });
              if (response.ok) {
                setProviders(providers.map(p => 
                  p.id === provider.id ? { ...p, status: newStatus } : p
                ));
              } else {
                console.error('Failed to update status:', await response.text());
              }
            } catch (error) {
              console.error('Failed to update status:', error);
            }
          }}
          className={classNames(
            'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
            provider.status === 'Active'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {provider.status === 'Active' ? (
            <CheckCircleIcon className="mr-1 h-4 w-4 text-green-400" />
          ) : (
            <XCircleIcon className="mr-1 h-4 w-4 text-gray-400" />
          )}
          {provider.status}
        </button>
      ),
    },
    {
      id: 'fte',
      label: 'TOTAL FTE',
      key: (provider: Provider) => (
        <div className="text-right">{provider.fte.toFixed(2)}</div>
      ),
    },
    {
      id: 'clinicalFte',
      label: 'CLINICAL FTE',
      key: (provider: Provider) => (
        <div className="text-right">{(provider.clinicalFte || 0).toFixed(2)}</div>
      ),
    },
    {
      id: 'nonClinicalFte',
      label: 'NON-CLINICAL FTE',
      key: (provider: Provider) => (
        <div className="text-right">{(provider.nonClinicalFte || 0).toFixed(2)}</div>
      ),
    },
    {
      id: 'baseSalary',
      label: 'BASE SALARY',
      key: (provider: Provider) => (
        <div className="text-right">
          ${provider.baseSalary.toLocaleString()}
        </div>
      ),
    },
    {
      id: 'clinicalSalary',
      label: 'CLINICAL SALARY',
      key: (provider: Provider) => (
        <div className="text-right">
          ${(provider.clinicalSalary || 0).toLocaleString()}
        </div>
      ),
    },
    {
      id: 'nonClinicalSalary',
      label: 'NON-CLINICAL SALARY',
      key: (provider: Provider) => (
        <div className="text-right">
          ${(provider.nonClinicalSalary || 0).toLocaleString()}
        </div>
      ),
    },
    {
      id: 'compensationModel',
      label: 'COMP MODEL',
      key: 'compensationModel',
    },
    {
      id: 'hireDate',
      label: 'HIRE DATE',
      key: (provider: Provider) => new Date(provider.hireDate).toLocaleDateString(),
    },
    {
      id: 'terminationDate',
      label: 'TERM DATE',
      key: (provider: Provider) => provider.terminationDate ? new Date(provider.terminationDate).toLocaleDateString() : '-',
    }
  ]);

  const compModelOptions = ['Base Pay', 'Custom', 'Standard', 'Tiered CF'];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Create specialties array from providers data
  const specialties = useMemo(() => {
    if (!providers) return [];
    return Array.from(new Set(providers.map(p => p.specialty))).sort();
  }, [providers]);

  // Update the useEffect to track providers without benchmarks and wRVUs
  useEffect(() => {
    if (providers && marketData && wRVUData) {
      // Get all unique specialties from market data
      const marketSpecialties = new Set(marketData.map(m => m.specialty));

      // Filter providers whose specialty doesn't exist in market data
      const withoutBenchmarks = providers.filter(p => {
        return !marketSpecialties.has(p.specialty);
      });
      setProvidersWithoutBenchmarks(withoutBenchmarks);

      // Get all employee IDs from wRVU data
      const wRVUEmployeeIds = new Set(wRVUData.map(w => w.employee_id));

      // Filter providers who don't have any wRVU data
      const withoutWRVUs = providers.filter(provider => {
        // Check if this provider's employeeId exists in wRVU data
        return !wRVUEmployeeIds.has(provider.employeeId);
      });
      setProvidersWithoutWRVUs(withoutWRVUs);

      // Filter providers with non-clinical FTE
      const withNonClinicalFTE = providers.filter(provider => provider.nonClinicalFte > 0);
      setProvidersWithNonClinicalFTE(withNonClinicalFTE);
    }
  }, [providers, marketData, wRVUData]);

  // Single filteredProviders declaration
  const filteredProviders = useMemo(() => {
    if (!providers || providers.length === 0) return [];
    
    return providers.filter(provider => {
      if (searchQuery && !`${provider.firstName} ${provider.lastName} ${provider.employeeId}`.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (selectedSpecialty && provider.specialty !== selectedSpecialty) {
        return false;
      }

      if (selectedCompModel && provider.compensationModel !== selectedCompModel) {
        return false;
      }

      if (provider.fte < fteRange[0] || provider.fte > fteRange[1]) {
        return false;
      }

      if (provider.baseSalary < baseSalaryRange[0] || provider.baseSalary > baseSalaryRange[1]) {
        return false;
      }

      if (showMissingBenchmarks) {
        const marketSpecialties = new Set(marketData.map(m => m.specialty));
        if (marketSpecialties.has(provider.specialty)) return false;
      }

      if (showMissingWRVUs) {
        const wRVUEmployeeIds = new Set(wRVUData.map(w => w.employeeId));
        if (wRVUEmployeeIds.has(provider.employeeId)) return false;
      }

      if (showNonClinicalOnly && provider.nonClinicalFte === 0) {
        return false;
      }

      if (showInactiveOnly && provider.status !== 'Inactive') {
        return false;
      }

      return true;
    });
  }, [
    providers,
    searchQuery,
    selectedSpecialty,
    selectedCompModel,
    fteRange,
    baseSalaryRange,
    showMissingBenchmarks,
    showMissingWRVUs,
    showNonClinicalOnly,
    showInactiveOnly,
    marketData,
    wRVUData
  ]);

  // Pagination
  const paginatedProviders = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredProviders.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProviders, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredProviders.length / rowsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Update useEffect for active filter count
  useEffect(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedSpecialty) count++;
    if (selectedCompModel) count++;
    if (fteRange[0] > 0 || fteRange[1] < 1) count++;
    if (baseSalaryRange[0] > 0 || baseSalaryRange[1] < 1000000) count++;
    if (showMissingBenchmarks) count++;
    if (showMissingWRVUs) count++;
    if (showNonClinicalOnly) count++;
    if (showInactiveOnly) count++;
    setActiveFilterCount(count);
  }, [searchQuery, selectedSpecialty, selectedCompModel, fteRange, baseSalaryRange, showMissingBenchmarks, showMissingWRVUs, showNonClinicalOnly, showInactiveOnly]);

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

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/providers');
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      const data = await response.json();
      setProviders(data); // API returns array directly
    } catch (err) {
      console.error('Error fetching providers:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) throw new Error('Failed to fetch market data');
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
    }
  };

  const fetchWRVUData = async () => {
    try {
      const response = await fetch('/api/wrvu-data');
      if (!response.ok) throw new Error('Failed to fetch wRVU data');
      const data = await response.json();
      setWRVUData(data);
    } catch (error) {
      console.error('Error fetching wRVU data:', error);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchProviders();
      fetchMarketData();
      fetchWRVUData();
    }
  }, [mounted]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add console log to debug
  useEffect(() => {
    console.log('Current providers:', providers);
  }, [providers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSpecialty('');
    setSelectedCompModel('');
    setFTERange([0, 1]);
    setBaseSalaryRange([0, 1000000]);
    setShowMissingBenchmarks(false);
    setShowMissingWRVUs(false);
    setShowNonClinicalOnly(false);
    setShowInactiveOnly(false);
  };

  const handleExportToExcel = () => {
    // Create worksheet data from filtered providers
    const worksheetData = filteredProviders.map(provider => ({
      'Employee ID': provider.employeeId,
      'Name': `${provider.firstName} ${provider.lastName}`,
      'Email': provider.email,
      'Specialty': provider.specialty,
      'Department': provider.department,
      'Status': provider.status,
      'Total FTE': provider.fte,
      'Clinical FTE': provider.clinicalFte,
      'Non-Clinical FTE': provider.nonClinicalFte,
      'Hire Date': provider.hireDate ? new Date(provider.hireDate).toLocaleDateString() : '',
      'Termination Date': provider.terminationDate ? new Date(provider.terminationDate).toLocaleDateString() : '',
      'Base Salary': provider.baseSalary,
      'Compensation Model': provider.compensationModel,
      'Clinical Salary': provider.clinicalSalary,
      'Non-Clinical Salary': provider.nonClinicalSalary
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

  const handleCompModelUpdate = async (employeeId: string, newModel: string) => {
    try {
      const response = await fetch(`/api/providers/${employeeId}/comp-model`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ compensationModel: newModel }),
      });

      if (!response.ok) {
        throw new Error('Failed to update compensation model');
      }

      await fetchProviders(); // Refresh the list
      setIsCompModelModalOpen(false);
      setNewCompModel('');
    } catch (error) {
      console.error('Error updating compensation model:', error);
      alert('Failed to update compensation model. Please try again.');
    }
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

  const handleStatusChange = async (provider: Provider) => {
    try {
      if (provider.status === 'Active') {
        // If currently active, show termination modal
        setSelectedProviderForTermination(provider);
        setIsTerminationModalOpen(true);
      } else {
        // If currently inactive, reactivate immediately
        const response = await fetch(`/api/providers/${provider.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            status: 'Active', 
            terminationDate: null 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update provider status');
        }

        // Refresh the providers list
        await fetchProviders();
      }
    } catch (error) {
      console.error('Error updating provider status:', error);
    }
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
                    <button
                      onClick={handleExportToExcel}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors shadow-sm"
                    >
                      Export to Excel
                    </button>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="inline-flex items-center gap-x-2 rounded-full bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#5558EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]"
                    >
                      <PlusIcon className="h-5 w-5" aria-hidden="true" />
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
                  <div className="p-6 space-y-4 border-t">
                    {/* Toggle Switches Row */}
                    <div className="grid grid-cols-4 gap-4">
                      <Switch.Group as="div" className="flex items-center">
                        <Switch
                          checked={showMissingBenchmarks}
                          onChange={setShowMissingBenchmarks}
                          className={classNames(
                            showMissingBenchmarks ? 'bg-blue-600' : 'bg-gray-200',
                            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={classNames(
                              showMissingBenchmarks ? 'translate-x-5' : 'translate-x-0',
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                            )}
                          />
                        </Switch>
                        <Switch.Label as="span" className="ml-3 text-sm">
                          <span className="font-medium text-gray-900">Missing Benchmarks</span>{' '}
                          <span className="text-gray-500">({providersWithoutBenchmarks.length})</span>
                        </Switch.Label>
                      </Switch.Group>

                      <Switch.Group as="div" className="flex items-center">
                        <Switch
                          checked={showMissingWRVUs}
                          onChange={setShowMissingWRVUs}
                          className={classNames(
                            showMissingWRVUs ? 'bg-blue-600' : 'bg-gray-200',
                            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={classNames(
                              showMissingWRVUs ? 'translate-x-5' : 'translate-x-0',
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                            )}
                          />
                        </Switch>
                        <Switch.Label as="span" className="ml-3 text-sm">
                          <span className="font-medium text-gray-900">Missing wRVUs</span>{' '}
                          <span className="text-gray-500">({providersWithoutWRVUs.length})</span>
                        </Switch.Label>
                      </Switch.Group>

                      <Switch.Group as="div" className="flex items-center">
                        <Switch
                          checked={showNonClinicalOnly}
                          onChange={setShowNonClinicalOnly}
                          className={classNames(
                            showNonClinicalOnly ? 'bg-blue-600' : 'bg-gray-200',
                            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={classNames(
                              showNonClinicalOnly ? 'translate-x-5' : 'translate-x-0',
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                            )}
                          />
                        </Switch>
                        <Switch.Label as="span" className="ml-3 text-sm">
                          <span className="font-medium text-gray-900">Non-Clinical FTE</span>{' '}
                          <span className="text-gray-500">({providersWithNonClinicalFTE.length})</span>
                        </Switch.Label>
                      </Switch.Group>

                      <Switch.Group as="div" className="flex items-center">
                        <Switch
                          checked={showInactiveOnly}
                          onChange={setShowInactiveOnly}
                          className={classNames(
                            showInactiveOnly ? 'bg-blue-600' : 'bg-gray-200',
                            'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2'
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className={classNames(
                              showInactiveOnly ? 'translate-x-5' : 'translate-x-0',
                              'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                            )}
                          />
                        </Switch>
                        <Switch.Label as="span" className="ml-3 text-sm">
                          <span className="font-medium text-gray-900">Inactive</span>{' '}
                          <span className="text-gray-500">({providers.filter(p => p.status === 'Inactive').length})</span>
                        </Switch.Label>
                      </Switch.Group>
                    </div>

                    {/* Filters Grid */}
                    <div className="grid grid-cols-4 gap-4">
                      {/* FTE Range */}
                      <div className="p-3 border border-gray-200 rounded-lg bg-white">
                        <label className="block text-sm font-medium text-gray-700 mb-2">FTE Range</label>
                        <DualRangeSlider
                          min={0}
                          max={1}
                          step={0.1}
                          value={fteRange}
                          onChange={setFTERange}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{fteRange[0].toFixed(1)}</span>
                          <span>{fteRange[1].toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Base Salary Range */}
                      <div className="p-3 border border-gray-200 rounded-lg bg-white">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Base Salary Range</label>
                        <DualRangeSlider
                          min={0}
                          max={1000000}
                          step={10000}
                          value={baseSalaryRange}
                          onChange={setBaseSalaryRange}
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>${baseSalaryRange[0].toLocaleString()}</span>
                          <span>${baseSalaryRange[1].toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Specialty */}
                      <div className="p-3 border border-gray-200 rounded-lg bg-white">
                        <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                          Specialty
                        </label>
                        <div className="relative">
                          <select
                            id="specialty"
                            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm focus:border-blue-500 focus:ring-blue-500 appearance-none bg-white"
                            value={selectedSpecialty}
                            onChange={(e) => setSelectedSpecialty(e.target.value)}
                          >
                            <option value="">All specialties</option>
                            {specialties.map((specialty) => (
                              <option key={specialty} value={specialty}>
                                {specialty}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="p-3 border border-gray-200 rounded-lg bg-white">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                          Search
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            id="search"
                            className="block w-full rounded-md border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Search providers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedProviders.length > 0 && (
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const provider = providers.find(p => p.id === selectedProviders[0]);
                        if (provider) {
                          router.push(`/provider/${provider.employeeId}`);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <ChartBarIcon className="h-4 w-4 mr-2" />
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        const provider = providers.find(p => p.id === selectedProviders[0]);
                        if (provider) {
                          setEditingProvider(provider);
                          setIsEditModalOpen(true);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <PencilSquareIcon className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        const provider = providers.find(p => p.id === selectedProviders[0]);
                        if (provider) {
                          setSelectedProviderForTermination(provider);
                          setIsTerminationModalOpen(true);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  {/* Top Scrollbar */}
                  <div className="overflow-x-auto mb-2" style={{ width: '100%' }} onScroll={(e) => {
                    const bottomScroll = document.getElementById('bottom-scroll');
                    if (bottomScroll) {
                      bottomScroll.scrollLeft = e.currentTarget.scrollLeft;
                    }
                  }}>
                    <div style={{ width: '150%', height: '1px' }} />
                  </div>

                  {/* Bottom Scrollable Table */}
                  <div className="overflow-x-auto" id="bottom-scroll" onScroll={(e) => {
                    const topScroll = e.currentTarget.previousElementSibling;
                    if (topScroll) {
                      topScroll.scrollLeft = e.currentTarget.scrollLeft;
                    }
                  }}>
                    <table className="min-w-full divide-y divide-gray-200" style={{ width: '150%' }}>
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="relative w-12 px-4 sm:w-16 sm:px-6">
                            <input
                              type="checkbox"
                              className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                              checked={selectedProviders.length > 0 && selectedProviders.length === paginatedProviders.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedProviders(paginatedProviders.map(p => p.id));
                                } else {
                                  setSelectedProviders([]);
                                }
                              }}
                            />
                          </th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee ID</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Email</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Specialty</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Department</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                          <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Total FTE</th>
                          <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Clinical FTE</th>
                          <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Non-Clinical FTE</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Hire Date</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Termination Date</th>
                          <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Base Salary</th>
                          <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Compensation Model</th>
                          <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Clinical Salary</th>
                          <th scope="col" className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Non-Clinical Salary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {paginatedProviders.map((provider) => (
                          <tr 
                            key={provider.id}
                            className={classNames(
                              selectedProviders.includes(provider.id) ? 'bg-gray-50' : 'bg-white',
                              'hover:bg-gray-50'
                            )}
                          >
                            <td className="relative w-12 px-4 sm:w-16 sm:px-6">
                              <input
                                type="checkbox"
                                className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                value={provider.id}
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
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{provider.employeeId}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm">
                              <Link
                                href={`/provider/${provider.employeeId}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {provider.firstName} {provider.lastName}
                              </Link>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-500">{provider.email}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{provider.specialty}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{provider.department}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newStatus = provider.status === 'Active' ? 'Inactive' : 'Active';
                                  if (newStatus === 'Inactive') {
                                    setSelectedProviderForTermination(provider);
                                    setIsTerminationModalOpen(true);
                                    return;
                                  }
                                  try {
                                    const response = await fetch(`/api/providers/${provider.employeeId}/status`, {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({ status: newStatus }),
                                    });
                                    if (response.ok) {
                                      setProviders(providers.map(p => 
                                        p.id === provider.id ? { ...p, status: newStatus } : p
                                      ));
                                    } else {
                                      console.error('Failed to update status:', await response.text());
                                    }
                                  } catch (error) {
                                    console.error('Failed to update status:', error);
                                  }
                                }}
                                className={classNames(
                                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                                  provider.status === 'Active'
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                              >
                                {provider.status === 'Active' ? (
                                  <CheckCircleIcon className="mr-1 h-4 w-4 text-green-400" />
                                ) : (
                                  <XCircleIcon className="mr-1 h-4 w-4 text-gray-400" />
                                )}
                                {provider.status}
                              </button>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-right text-gray-900">{provider.fte.toFixed(2)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-right text-gray-900">{provider.clinicalFte.toFixed(2)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-right text-gray-900">{provider.nonClinicalFte.toFixed(2)}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{new Date(provider.hireDate).toLocaleDateString()}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{provider.terminationDate ? new Date(provider.terminationDate).toLocaleDateString() : '-'}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-right text-gray-900">${provider.baseSalary.toLocaleString()}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-gray-900">{provider.compensationModel}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-right text-gray-900">${provider.clinicalSalary.toLocaleString()}</td>
                            <td className="whitespace-nowrap px-3 py-3 text-sm text-right text-gray-900">${provider.nonClinicalSalary.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DndContext>
              </div>

              {/* Pagination */}
              <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between rounded-b-lg">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * rowsPerPage, filteredProviders.length)}
                      </span>{' '}
                      of <span className="font-medium">{filteredProviders.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                      {Array.from({ length: Math.min(4, totalPages) }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={classNames(
                            page === currentPage
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                            'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                          )}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
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

              {/* Termination Modal */}
              <Transition appear show={isTerminationModalOpen} as={Fragment}>
                <Dialog
                  as="div"
                  className="relative z-10"
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
                            className="text-lg font-medium leading-6 text-gray-900"
                          >
                            Set Termination Date
                          </Dialog.Title>
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">
                              Please select a termination date for {selectedProviderForTermination?.firstName} {selectedProviderForTermination?.lastName}
                            </p>
                            <div className="mt-4">
                              <input
                                type="date"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                value={terminationDate}
                                onChange={(e) => setTerminationDate(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end space-x-2">
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                              onClick={async () => {
                                if (!selectedProviderForTermination) return;
                                try {
                                  const response = await fetch(`/api/providers/${selectedProviderForTermination.employeeId}/status`, {
                                    method: 'PATCH',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      status: 'Inactive',
                                      terminationDate: terminationDate,
                                    }),
                                  });
                                  if (response.ok) {
                                    setProviders(providers.map(p => 
                                      p.id === selectedProviderForTermination.id 
                                        ? { ...p, status: 'Inactive', terminationDate } 
                                        : p
                                    ));
                                    setIsTerminationModalOpen(false);
                                    setTerminationDate('');
                                  } else {
                                    console.error('Failed to update status:', await response.text());
                                  }
                                } catch (error) {
                                  console.error('Failed to update status:', error);
                                }
                              }}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                              onClick={() => {
                                setIsTerminationModalOpen(false);
                                setTerminationDate('');
                              }}
                            >
                              Cancel
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
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-10"
                            >
                              <option value="">Select a model</option>
                              <option value="Base Pay">Base Pay</option>
                              <option value="Custom">Custom</option>
                              <option value="Standard">Standard</option>
                              <option value="Tiered CF">Tiered CF</option>
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