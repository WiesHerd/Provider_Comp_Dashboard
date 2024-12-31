'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import EditMarketDataModal from '@/components/MarketData/EditMarketDataModal';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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

interface Column {
  id: string;
  label: string;
  key: keyof MarketData | ((data: MarketData) => React.ReactNode);
}

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function MarketDataPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [filteredData, setFilteredData] = useState<MarketData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<MarketData | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
      // Select all items in the filtered list
      setSelectedItems(new Set(filteredData.map(item => item.id)));
    } else {
      // Deselect all items
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (selectedItems.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) {
      try {
        const response = await fetch('/api/market-data', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ids: Array.from(selectedItems)
          })
        });

        if (!response.ok) throw new Error('Failed to delete items');

        // Refresh the data
        await fetchMarketData();
        // Clear selection
        setSelectedItems(new Set());
      } catch (error) {
        console.error('Error deleting items:', error);
        alert('Failed to delete items');
      }
    }
  };

  const handleEdit = () => {
    if (selectedItems.size !== 1) return;
    const selectedId = Array.from(selectedItems)[0];
    const selectedData = marketData.find(item => item.id === selectedId);
    if (selectedData) {
      setEditingData(selectedData);
      setIsEditModalOpen(true);
    }
  };

  const handleSave = async (data: MarketData) => {
    try {
      let response;
      if (data.id) {
        // Update existing entry
        response = await fetch(`/api/market-data/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
      } else {
        // New entry was already saved in the modal
        response = new Response(JSON.stringify(data), { status: 200 });
      }

      if (!response.ok) throw new Error('Failed to update market data');

      await fetchMarketData();
      setSelectedItems(new Set());
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating market data:', error);
      alert('Failed to update market data');
    }
  };

  const [columns] = useState<Column[]>([
    { 
      id: 'select', 
      label: '', 
      key: (data: MarketData) => (
        <input
          type="checkbox"
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          checked={selectedItems.has(data.id)}
          onChange={(e) => {
            e.stopPropagation();
            handleSelectItem(data.id);
          }}
        />
      )
    },
    { id: 'specialty', label: 'Specialty', key: 'specialty' },
    { id: 'p25_total', label: '25th TCC', key: (data: MarketData) => `$${formatNumber(data.p25_total)}` },
    { id: 'p50_total', label: '50th TCC', key: (data: MarketData) => `$${formatNumber(data.p50_total)}` },
    { id: 'p75_total', label: '75th TCC', key: (data: MarketData) => `$${formatNumber(data.p75_total)}` },
    { id: 'p90_total', label: '90th TCC', key: (data: MarketData) => `$${formatNumber(data.p90_total)}` },
    { id: 'p25_wrvu', label: '25th wRVU', key: (data: MarketData) => formatNumber(data.p25_wrvu) },
    { id: 'p50_wrvu', label: '50th wRVU', key: (data: MarketData) => formatNumber(data.p50_wrvu) },
    { id: 'p75_wrvu', label: '75th wRVU', key: (data: MarketData) => formatNumber(data.p75_wrvu) },
    { id: 'p90_wrvu', label: '90th wRVU', key: (data: MarketData) => formatNumber(data.p90_wrvu) },
    { id: 'p25_cf', label: '25th CF', key: (data: MarketData) => `$${formatNumber(data.p25_cf, true)}` },
    { id: 'p50_cf', label: '50th CF', key: (data: MarketData) => `$${formatNumber(data.p50_cf, true)}` },
    { id: 'p75_cf', label: '75th CF', key: (data: MarketData) => `$${formatNumber(data.p75_cf, true)}` },
    { id: 'p90_cf', label: '90th CF', key: (data: MarketData) => `$${formatNumber(data.p90_cf, true)}` }
  ]);

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
    <div className="h-full flex flex-col space-y-3 bg-white">
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
              setEditingData(undefined);
              setIsEditModalOpen(true);
            }}
            className="inline-flex items-center gap-x-2 rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <svg className="-ml-0.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
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

      {/* Table Container */}
      <div className="flex flex-col bg-white shadow-lg rounded-lg flex-1 min-h-0 border border-gray-200">
        <div className="overflow-y-scroll flex-1 rounded-t-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
              <tr>
                <th scope="col" className="w-10 px-2 py-3 text-left bg-gray-50">
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
                <th scope="col" className="w-48 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 border-r border-gray-300">
                  Specialty
                </th>
                <th colSpan={4} scope="col" className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-50 border-r border-gray-300">
                  Total Cash Compensation
                </th>
                <th colSpan={4} scope="col" className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-50 border-r border-gray-300">
                  wRVUs
                </th>
                <th colSpan={4} scope="col" className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-50">
                  Conversion Factor
                </th>
              </tr>
              <tr className="bg-gray-50">
                <th scope="col" className="w-10 px-2 py-2"></th>
                <th scope="col" className="w-48 px-3 py-2 border-r border-gray-300"></th>
                <th scope="col" className="w-24 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">25th</th>
                <th scope="col" className="w-24 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">50th</th>
                <th scope="col" className="w-24 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">75th</th>
                <th scope="col" className="w-24 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider border-r border-gray-300">90th</th>
                <th scope="col" className="w-20 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">25th</th>
                <th scope="col" className="w-20 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">50th</th>
                <th scope="col" className="w-20 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">75th</th>
                <th scope="col" className="w-20 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider border-r border-gray-300">90th</th>
                <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">25th</th>
                <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">50th</th>
                <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">75th</th>
                <th scope="col" className="w-16 px-2 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">90th</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((data) => (
                <tr 
                  key={data.id}
                  onClick={() => handleSelectItem(data.id)}
                  className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                    selectedItems.has(data.id) ? 'bg-indigo-50' : ''
                  }`}
                >
                  <td className={classNames(
                    'whitespace-nowrap px-2 py-3 text-sm sticky left-0 bg-white w-10',
                    selectedItems.has(data.id) ? 'bg-indigo-50' : ''
                  )}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={selectedItems.has(data.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectItem(data.id);
                      }}
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white w-48 border-r border-gray-300">
                    {data.specialty}
                  </td>
                  <td className="whitespace-nowrap w-24 px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p25_total)}</td>
                  <td className="whitespace-nowrap w-24 px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p50_total)}</td>
                  <td className="whitespace-nowrap w-24 px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p75_total)}</td>
                  <td className="whitespace-nowrap w-24 px-3 py-3 text-sm text-gray-600 text-right font-medium border-r border-gray-300">${formatNumber(data.p90_total)}</td>
                  <td className="whitespace-nowrap w-20 px-3 py-3 text-sm text-gray-600 text-right font-medium">{formatNumber(data.p25_wrvu)}</td>
                  <td className="whitespace-nowrap w-20 px-3 py-3 text-sm text-gray-600 text-right font-medium">{formatNumber(data.p50_wrvu)}</td>
                  <td className="whitespace-nowrap w-20 px-3 py-3 text-sm text-gray-600 text-right font-medium">{formatNumber(data.p75_wrvu)}</td>
                  <td className="whitespace-nowrap w-20 px-3 py-3 text-sm text-gray-600 text-right font-medium border-r border-gray-300">{formatNumber(data.p90_wrvu)}</td>
                  <td className="whitespace-nowrap w-16 px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p25_cf, true)}</td>
                  <td className="whitespace-nowrap w-16 px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p50_cf, true)}</td>
                  <td className="whitespace-nowrap w-16 px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p75_cf, true)}</td>
                  <td className="whitespace-nowrap w-16 px-3 py-3 text-sm text-gray-600 text-right font-medium">${formatNumber(data.p90_cf, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(startIndex + rowsPerPage, filteredData.length)}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
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
        data={editingData}
      />
    </div>
  );
} 