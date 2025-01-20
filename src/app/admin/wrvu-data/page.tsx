'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ClockIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import EditWRVUModal from '@/components/WRVU/EditWRVUModal';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { WRVUData } from '@/types/wrvu';
import { WRVUFormData, WRVUDataWithHistory } from '@/components/WRVU/EditWRVUModal';
import Pagination from '@/components/common/Pagination';
import { Dialog, Transition } from '@headlessui/react';

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
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

const isRecentlyEdited = (data: WRVUDataWithHistory) => {
  if (!data?.history || !Array.isArray(data.history) || data.history.length === 0) {
    return false;
  }
  
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  return data.history.some(entry => {
    if (!entry.changedAt) return false;
    const entryDate = new Date(entry.changedAt);
    // Only consider dates that are in the past and within last 24 hours
    return entryDate <= now && entryDate >= twentyFourHoursAgo;
  });
};

export default function WRVUDataPage() {
  const [data, setData] = useState<WRVUDataWithHistory[]>([]);
  const [filteredData, setFilteredData] = useState<WRVUDataWithHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<WRVUDataWithHistory | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchWRVUData();
  }, []);

  useEffect(() => {
    // Filter data based on search query and specialty
    const filtered = data.filter(data => {
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
  }, [searchQuery, selectedSpecialty, data]);

  const fetchWRVUData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const year = 2024; // Default to 2024 to match uploaded data
      const response = await fetch(`/api/wrvu-data?year=${year}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Received wRVU data:', data);
      setData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch wRVU data';
      setError(errorMessage);
      console.error('Failed to fetch wRVU data:', err);
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
      setData([]);
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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(paginatedData.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error('Please select at least one record to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} record(s)?`)) {
      return;
    }

    try {
      setIsLoading(true);
      // Get the selected data items
      const selectedIds = Array.from(selectedItems);

      console.log('Attempting to delete wRVU IDs:', selectedIds);
      
      const response = await fetch('/api/wrvu-data', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      const responseData = await response.json();
      console.log('Delete response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to delete records');
      }

      await fetchWRVUData();
      setSelectedItems(new Set());
      toast.success('Records deleted successfully');
    } catch (error) {
      console.error('Error deleting records:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete records. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWRVU = () => {
    setModalMode('add');
    setEditingData(null);
    setIsModalOpen(true);
  };

  const handleEditWRVU = (data: WRVUDataWithHistory) => {
    console.log('Editing wRVU data:', data);
    setEditingData(data);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSubmitWRVU = async (formData: WRVUFormData) => {
    try {
      setIsLoading(true);

      console.log('Submitting wRVU data:', formData);

      const response = await fetch('/api/wrvu-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          employee_id: formData.employee_id,
          year: formData.year,
          jan: Number(formData.jan) || 0,
          feb: Number(formData.feb) || 0,
          mar: Number(formData.mar) || 0,
          apr: Number(formData.apr) || 0,
          may: Number(formData.may) || 0,
          jun: Number(formData.jun) || 0,
          jul: Number(formData.jul) || 0,
          aug: Number(formData.aug) || 0,
          sep: Number(formData.sep) || 0,
          oct: Number(formData.oct) || 0,
          nov: Number(formData.nov) || 0,
          dec: Number(formData.dec) || 0
        })
      });

      const responseData = await response.json().catch(() => ({ error: 'Invalid response from server' }));

      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || 'Failed to save wRVU data');
      }

      await fetchWRVUData();
      setIsModalOpen(false);
      toast.success('wRVU data saved successfully');
    } catch (error) {
      console.error('Error saving wRVU data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save wRVU data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (selectedItems.size === 0) return;
    
    if (!confirm(`Are you sure you want to clear history for ${selectedItems.size} record(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/wrvu-data/clear-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedItems) }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      await fetchWRVUData();
      setSelectedItems(new Set());
      toast.success('History cleared successfully');
    } catch (error) {
      console.error('Error clearing history:', error);
      toast.error('Failed to clear history. Please try again.');
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
  const calculateYTD = (data: WRVUDataWithHistory): number => {
    const values = [
      data.jan || 0,
      data.feb || 0,
      data.mar || 0,
      data.apr || 0,
      data.may || 0,
      data.jun || 0,
      data.jul || 0,
      data.aug || 0,
      data.sep || 0,
      data.oct || 0,
      data.nov || 0,
      data.dec || 0
    ];
    return values.reduce((sum, val) => sum + val, 0);
  };

  const hasEdits = useMemo(() => {
    console.log('Checking hasEdits for data:', data);
    const result = data.some(data => isRecentlyEdited(data));
    console.log('hasEdits result:', result);
    return result;
  }, [data]);

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
    <>
      <div className="h-full flex flex-col space-y-3 bg-white">
        {/* Header with border */}
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">wRVU Data Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Add and manage provider wRVU data for performance tracking.
              </p>
            </div>
            <button
              onClick={handleAddWRVU}
              className="inline-flex items-center gap-x-2 rounded-full bg-[#6366F1] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#5558EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1]"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              Add wRVU Data
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white px-5 py-3 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search by name, ID, or specialty"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 pl-3 pr-10 py-3 text-base hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
            <div className="w-[280px]">
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full rounded-lg border-2 border-gray-200 pl-3 pr-10 py-3 text-base hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">All Specialties</option>
                {Array.from(new Set(data.map(d => d.specialty)))
                  .filter(Boolean)
                  .sort()
                  .map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))
                }
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
                  const selectedData = data.find(d => d.id === selectedId);
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
              <button
                onClick={handleClearHistory}
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <ClockIcon className="h-4 w-4 mr-2" />
                Clear History
              </button>
            </div>
          </div>
        )}

        {/* Table Section */}
        <div className="flex flex-col bg-white shadow-lg rounded-lg flex-1 min-h-0 border border-gray-200">
          <div className="overflow-y-scroll flex-1 rounded-t-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="relative px-6 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      checked={selectedItems.size === filteredData.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Employee ID
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Specialty
                  </th>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                    <th
                      key={month}
                      scope="col"
                      className={classNames(
                        "px-3 py-3.5 text-left text-sm font-semibold text-gray-900",
                        index === 0 && "border-l border-gray-200 border-t-0"
                      )}
                      style={index === 0 ? { borderRight: 'none' } : undefined}
                    >
                      {month}
                    </th>
                  ))}
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    YTD
                  </th>
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
                    <td className="relative px-6 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                        checked={selectedItems.has(data.id)}
                        onChange={() => handleSelectItem(data.id)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-sm text-gray-900">{data.employee_id}</td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>{`${data.first_name} ${data.last_name}`}</span>
                        {isRecentlyEdited(data) && (
                          <div className="group relative inline-block">
                            <ClockIcon
                              className="h-5 w-5 text-blue-500 hover:text-blue-600 cursor-pointer ml-1"
                            />
                            <div className="hidden group-hover:block absolute z-10 w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
                              <div className="px-4 py-3 border-b border-gray-700">
                                <h4 className="font-medium text-gray-100">Recent Changes</h4>
                              </div>
                              <div className="p-4 space-y-4">
                                {data.history?.slice(0, 3).map((entry) => (
                                  <div key={entry.id} className="flex flex-col">
                                    <div className="text-sm text-gray-400 mb-1">
                                      {format(new Date(entry.changedAt), 'MMM d, h:mm a')}
                                    </div>
                                    <div className="text-base text-gray-100">
                                      {entry.fieldName === 'jan' ? 'January' :
                                       entry.fieldName === 'feb' ? 'February' :
                                       entry.fieldName === 'mar' ? 'March' :
                                       entry.fieldName === 'apr' ? 'April' :
                                       entry.fieldName === 'may' ? 'May' :
                                       entry.fieldName === 'jun' ? 'June' :
                                       entry.fieldName === 'jul' ? 'July' :
                                       entry.fieldName === 'aug' ? 'August' :
                                       entry.fieldName === 'sep' ? 'September' :
                                       entry.fieldName === 'oct' ? 'October' :
                                       entry.fieldName === 'nov' ? 'November' :
                                       entry.fieldName === 'dec' ? 'December' :
                                       entry.fieldName}:{' '}
                                      <span className="text-red-400 line-through mr-2">{parseFloat(entry.oldValue || '0').toFixed(2)}</span>
                                      <span className="text-green-400">{parseFloat(entry.newValue).toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                                {data.history && data.history.length > 3 && (
                                  <div className="pt-2 mt-2 text-sm text-gray-400 border-t border-gray-700">
                                    + {data.history.length - 3} more changes
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-sm text-gray-900">{data.specialty}</td>
                    {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map((month, index) => (
                      <td 
                        key={month} 
                        className={classNames(
                          "whitespace-nowrap px-3 py-3.5 text-sm text-right text-gray-900",
                          index === 0 && "border-l border-gray-200"
                        )}
                      >
                        {formatNumber(Number(data[month as keyof WRVUDataWithHistory]))}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-3.5 text-sm text-right font-medium text-gray-900">
                      {formatNumber(calculateYTD(data))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        {/* Edit/Add Modal */}
        {isModalOpen && (
          <EditWRVUModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingData(null);
            }}
            onSubmit={handleSubmitWRVU}
            editingData={editingData}
            mode={modalMode}
          />
        )}
      </div>

      {/* Error Dialog */}
      <Transition.Root show={errorDialogOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setErrorDialogOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                    </div>
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Provider Required
                      </Dialog.Title>
                      <div className="mt-2">
                        <div className="text-sm text-gray-600">
                          <p className="mb-4">Before adding wRVU data, we need to set up the provider in our system.</p>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <p className="font-medium text-gray-900">Next steps:</p>
                            <ol className="list-decimal ml-4 space-y-1">
                              <li>Navigate to the Providers page</li>
                              <li>Add the provider's information</li>
                              <li>Return here to add their wRVU data</li>
                            </ol>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:w-auto"
                      onClick={() => {
                        setErrorDialogOpen(false);
                        router.push('/admin/providers');
                      }}
                    >
                      Add Provider Now
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3.5 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      onClick={() => setErrorDialogOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
} 