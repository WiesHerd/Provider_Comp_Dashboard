'use client';

import { Dialog, Transition, Combobox } from '@headlessui/react';
import { Fragment, useState, useEffect, useMemo } from 'react';
import { XMarkIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Loading from '@/app/loading';

export interface Provider {
  id: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
}

export interface WRVUHistory {
  id: string;
  wrvuDataId: string;
  changeType: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string;
  changedAt: Date;
}

export interface WRVUDataWithHistory {
  id: string;
  providerId: string;
  employee_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  year: number;
  jan?: number;
  feb?: number;
  mar?: number;
  apr?: number;
  may?: number;
  jun?: number;
  jul?: number;
  aug?: number;
  sep?: number;
  oct?: number;
  nov?: number;
  dec?: number;
  history?: WRVUHistory[];
}

export interface WRVUFormData {
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

interface EditWRVUModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WRVUFormData) => Promise<void>;
  editingData?: WRVUDataWithHistory | null;
  mode: 'add' | 'edit';
}

export default function EditWRVUModal({ isOpen, onClose, onSubmit, editingData, mode }: EditWRVUModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [formData, setFormData] = useState<WRVUFormData>({
    employee_id: '',
    first_name: '',
    last_name: '',
    specialty: '',
    year: new Date().getFullYear(),
    jan: 0,
    feb: 0,
    mar: 0,
    apr: 0,
    may: 0,
    jun: 0,
    jul: 0,
    aug: 0,
    sep: 0,
    oct: 0,
    nov: 0,
    dec: 0
  });

  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes or editing data changes
  useEffect(() => {
    if (isOpen && editingData) {
      // If editing existing data, populate the form
      setSelectedProvider({
        id: editingData.providerId,
        employee_id: editingData.employee_id,
        first_name: editingData.first_name,
        last_name: editingData.last_name,
        specialty: editingData.specialty
      });
      setYear(editingData.year);
      setFormData({
        employee_id: editingData.employee_id,
        first_name: editingData.first_name,
        last_name: editingData.last_name,
        specialty: editingData.specialty,
        year: editingData.year,
        jan: editingData.jan || 0,
        feb: editingData.feb || 0,
        mar: editingData.mar || 0,
        apr: editingData.apr || 0,
        may: editingData.may || 0,
        jun: editingData.jun || 0,
        jul: editingData.jul || 0,
        aug: editingData.aug || 0,
        sep: editingData.sep || 0,
        oct: editingData.oct || 0,
        nov: editingData.nov || 0,
        dec: editingData.dec || 0
      });
    } else {
      // Reset form for new data
      setSelectedProvider(null);
      setYear(new Date().getFullYear());
      setFormData({
        employee_id: '',
        first_name: '',
        last_name: '',
        specialty: '',
        year: new Date().getFullYear(),
        jan: 0,
        feb: 0,
        mar: 0,
        apr: 0,
        may: 0,
        jun: 0,
        jul: 0,
        aug: 0,
        sep: 0,
        oct: 0,
        nov: 0,
        dec: 0
      });
    }
  }, [isOpen, editingData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProvider) {
      console.error('No provider selected');
      return;
    }

    console.log('Submitting wRVU data:', { selectedProvider, formData });

    const payload: WRVUFormData = {
      ...formData,
      employee_id: selectedProvider.employee_id,
      first_name: selectedProvider.first_name,
      last_name: selectedProvider.last_name,
      specialty: selectedProvider.specialty,
      year
    };

    console.log('Sending payload:', payload);
    await onSubmit(payload);
  };

  const [providers, setProviders] = useState<Provider[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    // Only fetch providers when modal opens in add mode
    if (isOpen && mode === 'add') {
      fetchProviders();
    }
  }, [isOpen, mode]);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/providers');
      if (!response.ok) throw new Error('Failed to fetch providers');
      const providers = await response.json();
      
      // Validate that we received an array of providers
      if (!Array.isArray(providers)) {
        throw new Error('Invalid provider data format');
      }

      // Map the API response to match our Provider interface
      const mappedProviders = providers.map(p => ({
        id: p.id,
        employee_id: p.employeeId,
        first_name: p.firstName,
        last_name: p.lastName,
        specialty: p.specialty
      }));

      setProviders(mappedProviders);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to load providers. Please try again.');
      setProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProviders = useMemo(() => {
    return query === ''
      ? providers
      : providers.filter((provider) => {
          const searchStr = `${provider.employee_id} ${provider.first_name} ${provider.last_name} ${provider.specialty}`.toLowerCase();
          return searchStr.includes(query.toLowerCase());
        });
  }, [providers, query]);

  const handleProviderSelect = (provider: Provider | null) => {
    if (!provider) return;
    
    setSelectedProvider(provider);
    setFormData(prev => ({
      ...prev,
      employee_id: provider.employee_id,
      first_name: provider.first_name,
      last_name: provider.last_name,
      specialty: provider.specialty
    }));
  };

  const handleMonthChange = (month: keyof WRVUFormData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [month]: numValue
    }));
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      {mode === 'add' ? 'Add wRVU Data' : 'Edit wRVU Data'}
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        {mode === 'add' ? (
                          <div className="col-span-2">
                            <Combobox value={selectedProvider} onChange={handleProviderSelect} nullable>
                              <div className="relative">
                                <div className="relative w-full">
                                  <Combobox.Input
                                    className="w-full rounded-lg border-2 border-gray-200 pl-3 pr-10 py-3 text-base hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    displayValue={(provider: Provider | null) => 
                                      provider ? `${provider.employee_id} - ${provider.first_name} ${provider.last_name}` : ''
                                    }
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search for a provider..."
                                  />
                                  <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                  </Combobox.Button>
                                </div>
                                <Transition
                                  as={Fragment}
                                  leave="transition ease-in duration-100"
                                  leaveFrom="opacity-100"
                                  leaveTo="opacity-0"
                                  afterLeave={() => setQuery('')}
                                >
                                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                    {filteredProviders.length === 0 ? (
                                      <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                                        {query === '' ? 'Start typing to search providers...' : 'No providers found.'}
                                      </div>
                                    ) : (
                                      filteredProviders.map((provider) => (
                                        <Combobox.Option
                                          key={provider.id}
                                          className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                              active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                            }`
                                          }
                                          value={provider}
                                        >
                                          {({ selected, active }) => (
                                            <>
                                              <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                                {provider.employee_id} - {provider.first_name} {provider.last_name} ({provider.specialty})
                                              </span>
                                              {selected ? (
                                                <span
                                                  className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                                    active ? 'text-white' : 'text-indigo-600'
                                                  }`}
                                                >
                                                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                                </span>
                                              ) : null}
                                            </>
                                          )}
                                        </Combobox.Option>
                                      ))
                                    )}
                                  </Combobox.Options>
                                </Transition>
                              </div>
                            </Combobox>
                          </div>
                        ) : (
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                            <input
                              type="text"
                              value={selectedProvider?.employee_id || ''}
                              disabled
                              className="mt-1 block w-full rounded-lg border-2 border-gray-200 pl-3 pr-10 py-3 text-base bg-gray-50"
                            />
                          </div>
                        )}
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">First Name</label>
                          <input
                            type="text"
                            value={selectedProvider?.first_name || ''}
                            disabled
                            className="mt-1 block w-full rounded-lg border-2 border-gray-200 pl-3 pr-10 py-3 text-base bg-gray-50"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Last Name</label>
                          <input
                            type="text"
                            value={selectedProvider?.last_name || ''}
                            disabled
                            className="mt-1 block w-full rounded-lg border-2 border-gray-200 pl-3 pr-10 py-3 text-base bg-gray-50"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Specialty</label>
                          <input
                            type="text"
                            value={selectedProvider?.specialty || ''}
                            disabled
                            className="mt-1 block w-full rounded-lg border-2 border-gray-200 pl-3 pr-10 py-3 text-base bg-gray-50"
                          />
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Year</label>
                        <input
                          type="number"
                          required
                          min="2000"
                          max="2100"
                          className="mt-1 block w-full rounded-lg border-2 border-gray-200 pl-3 pr-10 py-3 text-base"
                          value={year}
                          onChange={(e) => setYear(parseInt(e.target.value))}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        {[
                          { month: 'jan', label: 'January' },
                          { month: 'feb', label: 'February' },
                          { month: 'mar', label: 'March' },
                          { month: 'apr', label: 'April' },
                          { month: 'may', label: 'May' },
                          { month: 'jun', label: 'June' },
                          { month: 'jul', label: 'July' },
                          { month: 'aug', label: 'August' },
                          { month: 'sep', label: 'September' },
                          { month: 'oct', label: 'October' },
                          { month: 'nov', label: 'November' },
                          { month: 'dec', label: 'December' }
                        ].map(({ month, label }) => (
                          <div key={month}>
                            <label htmlFor={month} className="block text-sm font-medium text-gray-700">
                              {label}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              id={month}
                              name={month}
                              value={formData[month as keyof WRVUFormData] || '0'}
                              onChange={(e) => handleMonthChange(month as keyof WRVUFormData, e.target.value)}
                              className="mt-1 block w-full rounded-lg border-2 border-gray-200 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                        >
                          {mode === 'add' ? 'Add wRVU Data' : 'Save Changes'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 