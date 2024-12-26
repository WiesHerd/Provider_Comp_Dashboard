'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  currentDepartment?: string;
  selected?: boolean;
}

interface Department {
  id: string;
  name: string;
}

interface AssignProvidersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (providerIds: string[]) => void;
  department: Department;
}

// Mock data - Replace with API call
const mockProviders: Provider[] = [
  { id: '1', name: 'Dr. John Smith', specialty: 'Cardiology', currentDepartment: 'Internal Medicine' },
  { id: '2', name: 'Dr. Sarah Johnson', specialty: 'Cardiology' },
  { id: '3', name: 'Dr. Michael Brown', specialty: 'Cardiology', currentDepartment: 'Emergency' },
  { id: '4', name: 'Dr. Emily Davis', specialty: 'Cardiology' },
  { id: '5', name: 'Dr. David Wilson', specialty: 'Cardiology', currentDepartment: 'ICU' },
];

export default function AssignProvidersModal({
  isOpen,
  onClose,
  onAssign,
  department
}: AssignProvidersModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [providers, setProviders] = useState<Provider[]>(mockProviders);

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedProviders([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter providers based on search query
  const filteredProviders = providers.filter(provider => 
    provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    provider.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev =>
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleAssign = () => {
    onAssign(selectedProviders);
    onClose();
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div>
                  <div className="text-center sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Assign Providers to {department.name}
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Select providers to assign to this department. Providers already assigned to other departments will be transferred.
                      </p>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="mt-4">
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      </div>
                      <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                        placeholder="Search providers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Provider List */}
                  <div className="mt-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {filteredProviders.map((provider) => (
                        <div
                          key={provider.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            selectedProviders.includes(provider.id)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={selectedProviders.includes(provider.id)}
                                onChange={() => toggleProvider(provider.id)}
                              />
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{provider.name}</p>
                                <p className="text-sm text-gray-500">{provider.specialty}</p>
                              </div>
                            </div>
                          </div>
                          {provider.currentDepartment && (
                            <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                              {provider.currentDepartment}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
                    onClick={handleAssign}
                  >
                    Assign {selectedProviders.length} Provider{selectedProviders.length !== 1 ? 's' : ''}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
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
  );
} 