'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import EditMarketDataModal from '@/components/MarketData/EditMarketDataModal';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import ErrorDialog from '@/components/common/ErrorDialog';
import SuccessNotification from '@/components/common/SuccessNotification';

interface MarketData {
  id: string;
  specialty: string;
  p25_total: number;
  p50_total: number;
  p75_total: number;
  p90_total: number;
  p25_wrvu: number;
  p50_wrvu: number;
  p75_wrvu: number;
  p90_wrvu: number;
  p25_cf: number;
  p50_cf: number;
  p75_cf: number;
  p90_cf: number;
  updatedAt: string;
  history?: {
    changeType: string;
    fieldName: string;
    oldValue: string;
    newValue: string;
    changedAt: string;
  }[];
  lastEditedAt?: Date | null;
}

// Add a helper function for safe number formatting
const formatNumber = (value: number | null | undefined, isDecimal: boolean = false) => {
  if (value === null || value === undefined) return '-';
  
  if (isDecimal) {
    // For Conversion Factor values
    return value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }
  
  // For TCC values and wRVU values, just use commas
  return value.toLocaleString();
};

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Add this function near the top with other utility functions
const isRecentlyEdited = (updatedAt: string, history?: any[]) => {
  return Boolean(history && Array.isArray(history) && history.length > 0);
};

export default function MarketDataPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [filteredData, setFilteredData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedData, setSelectedData] = useState<MarketData | undefined>(undefined);
  const [deleteError, setDeleteError] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });
  const [successNotification, setSuccessNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
  }>({
    show: false,
    title: '',
    message: ''
  });

  const hasEdits = useMemo(() => {
    return marketData.some(data => 
      data.lastEditedAt != null || 
      (data.history && data.history.length > 0)
    );
  }, [marketData]);

  useEffect(() => {
    fetchMarketData();
  }, []);

  useEffect(() => {
    // Filter data based on search query
    const filtered = marketData.filter(data => 
      data.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredData(filtered);
  }, [searchQuery, marketData]);

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) {
        throw new Error('Failed to fetch market data');
      }
      const data = await response.json();
      setMarketData(data);
      setFilteredData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelected = new Set(filteredData.map(item => item.id));
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectRow = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (e.target.checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDelete = async (data?: MarketData) => {
    // If data is provided, it's a single delete, otherwise it's a bulk delete
    const itemsToDelete = data 
      ? [{ id: data.id, specialty: data.specialty }]
      : Array.from(selectedItems).map(id => ({
          id,
          specialty: marketData.find(item => item.id === id)?.specialty || ''
        }));

    if (itemsToDelete.length === 0) return;

    const specialtiesList = itemsToDelete.map(item => item.specialty).join(', ');
    const confirmMessage = itemsToDelete.length === 1
      ? `Are you sure you want to delete market data for ${specialtiesList}?`
      : `Are you sure you want to delete market data for ${itemsToDelete.length} specialties (${specialtiesList})?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch('/api/market-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: itemsToDelete.map(item => item.id)
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete market data');
      }

      // Refresh the data
      await fetchMarketData();
      // Reset selection
      setSelectedItems(new Set());

      // Show success notification
      const timestamp = new Date().toLocaleString();
      const specialtiesList = itemsToDelete.map(item => item.specialty).join(', ');
      setSuccessNotification({
        show: true,
        title: 'Market Data Deleted',
        message: `Successfully deleted market data for ${specialtiesList} on ${timestamp}`
      });

    } catch (error) {
      console.error('Error deleting market data:', error);
      setDeleteError({
        show: true,
        message: error instanceof Error ? error.message : 'Failed to delete market data. Please try again.'
      });
    }
  };

  const handleCloseDeleteError = () => {
    setDeleteError({ show: false, message: '' });
  };

  const handleEdit = (item: MarketData) => {
    console.log('=== Market Data Page Debug ===');
    console.log('Full item being edited:', JSON.stringify(item, null, 2));
    console.log('90th percentile values from table:', {
      total: item.p90_total,
      wrvu: item.p90_wrvu,
      cf: item.p90_cf
    });
    console.log('Item type:', typeof item);
    console.log('Item keys:', Object.keys(item));
    console.log('=== End Debug ===');
    
    setSelectedData(item);
    setIsEditModalOpen(true);
  };

  const handleSave = async (data: MarketData) => {
    try {
      // Refresh the data after save
      await fetchMarketData();
      // Reset all state
      setSelectedItems(new Set());
      setIsEditModalOpen(false);
      setSelectedData(undefined);
      setSearchQuery('');
      setCurrentPage(1);

      // Show success notification with audit details
      const action = data.id ? 'updated' : 'added';
      const timestamp = new Date().toLocaleString();
      setSuccessNotification({
        show: true,
        title: `Market Data ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `${data.specialty} market data was successfully ${action} on ${timestamp}`
      });

    } catch (error) {
      console.error('Error updating market data:', error);
      // Error will be handled by the modal component
    }
  };

  const handleCloseSuccessNotification = () => {
    setSuccessNotification({ show: false, title: '', message: '' });
  };

  const clearHistory = async (ids: string[]) => {
    try {
      const response = await fetch('/api/market-data/clear-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      // Refresh the data
      await fetchMarketData();
      
      // Show success notification
      const timestamp = new Date().toLocaleString();
      setSuccessNotification({
        show: true,
        title: 'History Cleared',
        message: `Successfully cleared edit history for ${ids.length} item(s) on ${timestamp}`
      });
    } catch (error) {
      setDeleteError({
        show: true,
        message: error instanceof Error ? error.message : 'Failed to clear history. Please try again.'
      });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3 bg-white overflow-hidden">
      {/* Header with border */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Market Data Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage specialty-specific market data for compensation benchmarking.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedData(undefined);
              setIsEditModalOpen(true);
            }}
            className="inline-flex items-center gap-x-2 rounded-full bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#5558EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]"
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Add Market Data
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
              placeholder="Search specialties..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons - Show when items are selected */}
      {selectedItems.size > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const selectedId = Array.from(selectedItems)[0];
                const selectedItem = marketData.find(item => item.id === selectedId);
                if (selectedItem && selectedItems.size === 1) {
                  setSelectedData(selectedItem);
                  setIsEditModalOpen(true);
                }
              }}
              className={classNames(
                "inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500",
                selectedItems.size !== 1 && "opacity-50 cursor-not-allowed"
              )}
              disabled={selectedItems.size !== 1}
            >
              <PencilSquareIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={() => handleDelete()}
              className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Selected ({selectedItems.size})
            </button>
            <button
              onClick={() => clearHistory(Array.from(selectedItems))}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <ClockIcon className="h-4 w-4 mr-2" />
              Clear History
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex-1 min-h-0 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="w-12 px-4 sm:w-16 sm:px-6"></th>
                    {hasEdits && <th scope="col" className="w-8 px-2"></th>}
                    <th scope="col" className="px-3"></th>
                    <th scope="col" colSpan={4} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-l border-gray-200">Total Cash Compensation</th>
                    <th scope="col" colSpan={4} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-l border-gray-200">wRVUs</th>
                    <th scope="col" colSpan={4} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-l border-gray-200">Conversion Factor</th>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <th scope="col" className="relative w-12 px-4 sm:w-16 sm:px-6">
                      <input
                        type="checkbox"
                        className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                        checked={selectedItems.size > 0 && selectedItems.size === paginatedData.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    {hasEdits && (
                      <th scope="col" className="w-8 px-2 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                        Edit
                      </th>
                    )}
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-r border-gray-200">
                      Specialty
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">25th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">50th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">75th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-r border-gray-200">90th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">25th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">50th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">75th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap border-r border-gray-200">90th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">25th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">50th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">75th</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">90th</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
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
                          className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedItems.has(data.id)}
                          onChange={(e) => handleSelectRow(e, data.id)}
                        />
                      </td>
                      {hasEdits && (
                        <td className="w-8 px-2 py-3 text-center">
                          {data.history && data.history.length > 0 && (
                            <ClockIcon className="h-4 w-4 text-blue-500 inline-block" aria-hidden="true" />
                          )}
                        </td>
                      )}
                      <td className="px-3 py-3 text-sm text-gray-900 border-r border-gray-200">
                        {data.specialty}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p25_total)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p50_total)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p75_total)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium border-r border-gray-200">${formatNumber(data.p90_total)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">{formatNumber(data.p25_wrvu)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">{formatNumber(data.p50_wrvu)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">{formatNumber(data.p75_wrvu)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium border-r border-gray-200">{formatNumber(data.p90_wrvu)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p25_cf, true)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p50_cf, true)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p75_cf, true)}</td>
                      <td className="px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p90_cf, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Fixed Pagination */}
        <div className="border-t border-gray-200 bg-white px-6 py-4 flex items-center justify-between rounded-b-lg sticky left-0">
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
      </div>

      <EditMarketDataModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        data={selectedData}
      />

      <ErrorDialog
        isOpen={deleteError.show}
        onClose={handleCloseDeleteError}
        title="Delete Error"
        message={deleteError.message}
      />

      <SuccessNotification
        show={successNotification.show}
        onClose={handleCloseSuccessNotification}
        title={successNotification.title}
        message={successNotification.message}
      />
    </div>
  );
} 