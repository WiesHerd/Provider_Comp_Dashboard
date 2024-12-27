'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import EditWRVUModal from '@/components/WRVU/EditWRVUModal';

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
      const response = await fetch('/api/wrvu-data');
      if (!response.ok) {
        throw new Error('Failed to fetch wRVU data');
      }
      const data = await response.json();
      setWRVUData(data);
      setFilteredData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
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
              <h1 className="text-2xl font-semibold text-gray-900">wRVU Data Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and manage provider wRVU data across all months.
              </p>
            </div>
            <div>
              <button
                onClick={handleAddWRVU}
                className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                Add wRVU Data
              </button>
            </div>
          </div>
        </div>

        {/* Selection info and actions */}
        {selectedItems.size > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-x-4">
              <span className="text-sm text-gray-700">
                {selectedItems.size} record{selectedItems.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  const selectedId = Array.from(selectedItems)[0];
                  const selectedData = wrvuData.find(d => d.id === selectedId);
                  if (selectedData) {
                    handleEditWRVU(selectedData);
                  }
                }}
                disabled={selectedItems.size !== 1}
                className="inline-flex items-center gap-x-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-x-2 px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by ID, name, or specialty..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              <div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                >
                  <option value="">All Specialties</option>
                  {Array.from(new Set(wrvuData.map(d => d.specialty))).sort().map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-10 px-2 py-2 text-left bg-gray-50">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={filteredData.length > 0 && selectedItems.size === filteredData.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(new Set(filteredData.map(p => p.id)));
                        } else {
                          setSelectedItems(new Set());
                        }
                      }}
                    />
                  </th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialty
                  </th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jan</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Feb</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Mar</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Apr</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">May</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jun</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jul</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aug</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sep</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Oct</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nov</th>
                  <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Dec</th>
                  <th scope="col" className="w-20 px-2 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">YTD</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((data) => (
                  <tr 
                    key={data.id}
                    className={`hover:bg-gray-50 ${
                      selectedItems.has(data.id) ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <td className="whitespace-nowrap px-2 py-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={selectedItems.has(data.id)}
                        onChange={(e) => {
                          handleSelectItem(data.id);
                        }}
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">{data.employee_id}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">{`${data.first_name} ${data.last_name}`}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-900">{data.specialty}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.jan)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.feb)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.mar)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.apr)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.may)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.jun)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.jul)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.aug)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.sep)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.oct)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.nov)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm text-gray-500 text-right">{formatNumber(data.dec)}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-sm font-medium text-gray-900 text-right bg-gray-50">{formatNumber(calculateYTD(data))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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
                  {Math.min((currentPage - 1) * rowsPerPage + 1, filteredData.length)}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * rowsPerPage, filteredData.length)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{filteredData.length}</span> results
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
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (page === currentPage - 3 || page === currentPage + 3) {
                    return (
                      <span
                        key={page}
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
      </div>

      {/* Edit/Add Modal */}
      <EditWRVUModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingData(null);
        }}
        onSubmit={handleSubmitWRVU}
        data={editingData || undefined}
        mode={modalMode}
      />
    </div>
  );
} 