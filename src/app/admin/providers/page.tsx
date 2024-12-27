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

  // Add filtering effect
  useEffect(() => {
    let result = [...providers];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(provider => 
        provider.firstName.toLowerCase().includes(query) ||
        provider.lastName.toLowerCase().includes(query) ||
        provider.employeeId.toLowerCase().includes(query) ||
        provider.email.toLowerCase().includes(query)
      );
    }
    
    // Apply specialty filter
    if (selectedSpecialty) {
      result = result.filter(provider => provider.specialty === selectedSpecialty);
    }
    
    // Apply department filter
    if (selectedDepartment) {
      result = result.filter(provider => provider.department === selectedDepartment);
    }
    
    // Apply status filter
    if (selectedStatus) {
      result = result.filter(provider => provider.status === selectedStatus);
    }
    
    setFilteredProviders(result);
  }, [providers, searchQuery, selectedSpecialty, selectedDepartment, selectedStatus]);

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

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-6 px-4">
        {/* Header with border */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Provider Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage provider information, compensation models, and performance metrics.
              </p>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add Provider
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search providers..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="">All Specialties</option>
              {Array.from(new Set(providers.map(p => p.specialty))).sort().map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="">All Departments</option>
              {Array.from(new Set(providers.map(p => p.department))).sort().map(department => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-8 px-2 py-2 text-left bg-gray-50">
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
                  <th scope="col" className="w-20 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="w-36 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="w-36 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th scope="col" className="w-36 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="w-16 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    FTE
                  </th>
                  <th scope="col" className="w-28 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Salary
                  </th>
                  <th scope="col" className="w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedProviders.includes(provider.id) ? 'bg-indigo-50' : ''
                    } ${provider.status === 'Inactive' ? 'text-gray-500' : ''}`}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={classNames(
                          'whitespace-nowrap px-3 py-4 text-sm',
                          column.id === 'select' ? 'sticky left-0 bg-white w-12' : '',
                          column.id === 'name' ? 'text-gray-900' : 'text-gray-500',
                          selectedProviders.includes(provider.id) && column.id === 'select' ? 'bg-indigo-50' : ''
                        )}
                      >
                        {column.id === 'select' ? (
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                        ) : typeof column.key === 'function' ? (
                          column.key(provider)
                        ) : (
                          provider[column.key]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
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
                Showing{' '}
                <span className="font-medium">
                  {Math.min((currentPage - 1) * rowsPerPage + 1, filteredProviders.length)}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * rowsPerPage, filteredProviders.length)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{filteredProviders.length}</span> results
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                </button>
                {[...Array(totalPages)].map((_, index) => {
                  const page = index + 1;
                  // Show first page, last page, current page, and pages around current page
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
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
                    );
                  }
                  // Show ellipsis for skipped pages
                  if (
                    page === currentPage - 3 ||
                    page === currentPage + 3
                  ) {
                    return (
                      <span
                        key={`ellipsis-${page}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
        `}</style>
      </div>
    </div>
  );
} 