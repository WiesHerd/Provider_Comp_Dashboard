'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import EditWRVUModal from '@/components/WRVU/EditWRVUModal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface WRVUData {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  year: number;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Add helper function to check if a value has history
const hasHistory = (data: any, month: number) => {
  return data.history && data.history[month];
};

// Add helper function to format history tooltip content
const formatHistoryTooltip = (history: any) => {
  const oldValue = parseFloat(history.oldValue || '0').toFixed(2);
  const newValue = parseFloat(history.newValue || '0').toFixed(2);
  const date = format(new Date(history.changedAt), 'MMM d, yyyy h:mm a');
  return `Changed from ${oldValue} to ${newValue} on ${date}`;
};

export default function WRVUDataPage() {
  const [wrvuData, setWRVUData] = useState<WRVUData[]>([]);
  const [filteredData, setFilteredData] = useState<WRVUData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<WRVUData | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');

  useEffect(() => {
    fetchWRVUData();
  }, []);

  useEffect(() => {
    // Filter data based on search query and specialty
    const filtered = wrvuData.filter(data => {
      const searchTerm = searchQuery.toLowerCase().trim();
      const fullName = `${data.first_name} ${data.last_name}`.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        data.employee_id.toLowerCase().includes(searchTerm) ||
        fullName.includes(searchTerm) ||
        data.specialty.toLowerCase().includes(searchTerm);
      
      const matchesSpecialty = !selectedSpecialty || data.specialty === selectedSpecialty;
      
      return matchesSearch && matchesSpecialty;
    });
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedSpecialty, wrvuData]);

  const fetchWRVUData = async () => {
    try {
      console.log('Fetching wRVU data...');
      const response = await fetch('/api/wrvu-data');
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to fetch wRVU data: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Received wRVU data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Received non-array data:', data);
        throw new Error('Invalid data format received');
      }
      
      setWRVUData(data);
      setFilteredData(data);
      console.log('State updated with', data.length, 'records');
    } catch (err) {
      console.error('Error in fetchWRVUData:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear ALL wRVU data and providers? This cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/clear/wrvu', {
        method: 'POST'
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear data');
      }

      // Reset all state
      setWRVUData([]);
      setFilteredData([]);
      setSelectedItems(new Set());
      setCurrentPage(1);
      
      toast.success('Successfully cleared all data');
      
      // Force a page refresh to ensure everything is reset
      router.refresh();
    } catch (err) {
      console.error('Error clearing data:', err);
      toast.error('Failed to clear data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} record(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/wrvu-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete records');
      }

      await fetchWRVUData();
      setSelectedItems(new Set());
      alert('Records deleted successfully');
    } catch (error) {
      console.error('Error deleting records:', error);
      alert('Failed to delete records. Please try again.');
    }
  };

  const handleAddWRVU = () => {
    setModalMode('add');
    setEditingData(null);
    setIsModalOpen(true);
  };

  const handleEditWRVU = (data: WRVUData) => {
    setModalMode('edit');
    setEditingData(data);
    setIsModalOpen(true);
  };

  const handleSubmitWRVU = async (data: WRVUData) => {
    try {
      const response = await fetch('/api/wrvu-data', {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save wRVU data');
      }

      await fetchWRVUData();
      setIsModalOpen(false);
      setEditingData(null);
    } catch (error) {
      console.error('Error saving wRVU data:', error);
      alert('Failed to save wRVU data. Please try again.');
    }
  };

  // Calculate pagination values
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + rowsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Add helper function to calculate YTD
  const calculateYTD = (data: WRVUData) => {
    return [
      data.jan, data.feb, data.mar, data.apr, data.may, data.jun,
      data.jul, data.aug, data.sep, data.oct, data.nov, data.dec
    ].reduce((sum, val) => sum + (val || 0), 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-600">Loading wRVU data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Data</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              fetchWRVUData();
            }}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3 bg-white">
      {/* Header with border */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">wRVU Data Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage provider wRVU data across all months.
            </p>
          </div>
          <button
            onClick={() => router.push('/admin/wrvu-data/upload')}
            className="inline-flex items-center gap-x-2 rounded-full bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#5558EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Add wRVU Data
          </button>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white px-5 py-3 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative w-96">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder="Search by name, ID, or specialty"
            />
          </div>
          <div className="w-72">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
              <option value="">All Specialties</option>
              {Array.from(new Set(wrvuData.map(d => d.specialty))).sort().map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {selectedItems.size > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const selectedId = Array.from(selectedItems)[0];
                const selectedData = wrvuData.find(d => d.id === selectedId);
                if (selectedData) {
                  handleEditWRVU(selectedData);
                }
              }}
              disabled={selectedItems.size !== 1}
              className={classNames(
                "inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500",
                selectedItems.size !== 1 && "opacity-50 cursor-not-allowed"
              )}
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Selected ({selectedItems.size})
            </button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="flex flex-col bg-white shadow-lg rounded-lg flex-1 min-h-0 border border-gray-200">
        <div className="overflow-y-scroll flex-1 rounded-t-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr key="main-header-row">
                <th scope="col" className="relative w-12 px-4 sm:w-16 sm:px-6">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    checked={selectedItems.size > 0 && selectedItems.size === paginatedData.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(new Set(paginatedData.map(item => item.id)));
                      } else {
                        setSelectedItems(new Set());
                      }
                    }}
                  />
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Employee ID</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Specialty</th>
                <th scope="col" colSpan={12} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-l border-gray-200">Monthly wRVUs</th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50">YTD</th>
              </tr>
              <tr key="month-header-row">
                <th key="checkbox-header-month" scope="col"></th>
                <th key="employee-id-header-month" scope="col"></th>
                <th key="name-header-month" scope="col"></th>
                <th key="specialty-header-month" scope="col"></th>
                <th key="jan-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Jan</th>
                <th key="feb-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Feb</th>
                <th key="mar-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Mar</th>
                <th key="apr-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Apr</th>
                <th key="may-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">May</th>
                <th key="jun-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Jun</th>
                <th key="jul-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Jul</th>
                <th key="aug-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Aug</th>
                <th key="sep-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Sep</th>
                <th key="oct-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Oct</th>
                <th key="nov-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Nov</th>
                <th key="dec-header" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Dec</th>
                <th key="ytd-header-month" scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap bg-gray-50"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedData.map((data) => (
                <tr 
                  key={data.id}
                  className={classNames(
                    selectedItems.has(data.id) ? 'bg-gray-50' : 'bg-white',
                    'hover:bg-gray-50'
                  )}
                >
                  <td className="relative w-12 px-4 sm:w-16 sm:px-6">
                    <input
                      type="checkbox"
                      className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      value={data.id}
                      checked={selectedItems.has(data.id)}
                      onChange={() => handleSelectItem(data.id)}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{data.employee_id}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{`${data.first_name} ${data.last_name}`}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">{data.specialty}</td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
                    const monthKey = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][month - 1];
                    const value = data[monthKey as keyof typeof data];
                    
                    return (
                      <td key={month} className="whitespace-nowrap px-3 py-2 text-sm text-right text-gray-900">
                        {formatNumber(typeof value === 'number' ? value : 0)}
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap px-3 py-2 text-sm text-right font-medium text-gray-900 bg-gray-50">
                    {formatNumber(calculateYTD(data))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed Pagination */}
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
                {Math.min(currentPage * rowsPerPage, filteredData.length)}
              </span>{' '}
              of <span className="font-medium">{filteredData.length}</span> results
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

      {/* Edit/Add Modal */}
      <EditWRVUModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitWRVU}
        data={editingData || undefined}
        mode={modalMode}
      />
    </div>
  );
} 