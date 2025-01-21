'use client';

import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ErrorDialog from '@/components/common/ErrorDialog';

interface MarketData {
  id?: string;
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
  history?: {
    changeType: string;
    fieldName: string;
    oldValue: string;
    newValue: string;
    changedAt: string;
  }[];
}

interface EditMarketDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MarketData) => void;
  data?: MarketData;
}

// Pre-defined specialties list
const specialties = [
  'Adolescent Medicine',
  'Allergy and Immunology',
  'Anesthesiology',
  'Bone Marrow Transplant',
  'Cardiology',
  'Cardiothoracic Surgery',
  'Critical Care Medicine',
  'Critical Care Medicine Cardiology',
  'Dermatology',
  'Developmental-Behavioral Medicine',
  'Emergency Medicine',
  'Endocrinology',
  'Family Medicine',
  'Gastroenterology',
  'General Surgery',
  'Geriatric Medicine',
  'Hematology/Oncology',
  'Hospital Medicine',
  'Infectious Disease',
  'Internal Medicine',
  'Interventional Cardiology',
  'Neonatology',
  'Nephrology',
  'Neurology',
  'Neurosurgery',
  'Obstetrics and Gynecology',
  'Ophthalmology',
  'Orthopedic Surgery',
  'Otolaryngology',
  'Pain Management',
  'Pathology',
  'Pediatrics',
  'Physical Medicine and Rehabilitation',
  'Plastic Surgery',
  'Psychiatry',
  'Pulmonology',
  'Radiation Oncology',
  'Radiology',
  'Rheumatology',
  'Sleep Medicine',
  'Sports Medicine',
  'Transplant Surgery',
  'Trauma Surgery',
  'Urology',
  'Vascular Surgery'
].sort();

export default function EditMarketDataModal({ isOpen, onClose, onSave, data }: EditMarketDataModalProps) {
  const [formData, setFormData] = useState<MarketData>({
    id: '',
    specialty: '',
    p25_total: 0,
    p50_total: 0,
    p75_total: 0,
    p90_total: 0,
    p25_wrvu: 0,
    p50_wrvu: 0,
    p75_wrvu: 0,
    p90_wrvu: 0,
    p25_cf: 0,
    p50_cf: 0,
    p75_cf: 0,
    p90_cf: 0
  });

  const [error, setError] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else {
      setFormData({
        id: '',
        specialty: '',
        p25_total: 0,
        p50_total: 0,
        p75_total: 0,
        p90_total: 0,
        p25_wrvu: 0,
        p50_wrvu: 0,
        p75_wrvu: 0,
        p90_wrvu: 0,
        p25_cf: 0,
        p50_cf: 0,
        p75_cf: 0,
        p90_cf: 0
      });
    }
  }, [data, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    // Allow empty values
    if (value === '') {
      setFormData(prev => ({
        ...prev,
        [field]: ''
      }));
      return;
    }

    // Only allow numbers and one decimal point
    // This regex allows numbers like: 45.23, 100.50, etc.
    if (!/^\d*\.?\d*$/.test(value)) {
      return;
    }

    // Store the raw value during typing
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Only apply rounding when we have a complete number
    if (!/\.$/.test(value)) { // Don't round if the value ends with a decimal point
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        let roundedValue = numValue;
        if (field.includes('_cf')) {
          roundedValue = Math.round(numValue * 100) / 100; // 2 decimal places for CF
        } else if (field.includes('_total')) {
          roundedValue = Math.round(numValue); // Whole numbers for total cash
        } else {
          roundedValue = Math.round(numValue * 10) / 10; // 1 decimal place for wRVUs
        }

        // Only update if the rounded value is different and we're not in the middle of typing
        if (roundedValue !== numValue && !value.includes('.')) {
          setFormData(prev => ({
            ...prev,
            [field]: roundedValue.toString()
          }));
        }
      }
    }

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.specialty.trim()) {
      errors.specialty = 'Specialty is required';
    }

    // Validate that values are in ascending order for each category
    const categories = [
      { name: 'total', label: 'Total Cash Compensation' },
      { name: 'wrvu', label: 'wRVUs' },
      { name: 'cf', label: 'Conversion Factor' }
    ];

    categories.forEach(({ name, label }) => {
      const values = [
        formData[`p25_${name}` as keyof MarketData],
        formData[`p50_${name}` as keyof MarketData],
        formData[`p75_${name}` as keyof MarketData],
        formData[`p90_${name}` as keyof MarketData]
      ];

      for (let i = 0; i < values.length - 1; i++) {
        if (values[i] > values[i + 1]) {
          errors[`p${i === 2 ? 90 : (i + 2) * 25}_${name}`] = 
            `${label} values must be in ascending order`;
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Prepare the data to send
      const dataToSend = {
        ...formData,
        // Convert string inputs to numbers
        p25_total: Number(formData.p25_total),
        p50_total: Number(formData.p50_total),
        p75_total: Number(formData.p75_total),
        p90_total: Number(formData.p90_total),
        p25_wrvu: Number(formData.p25_wrvu),
        p50_wrvu: Number(formData.p50_wrvu),
        p75_wrvu: Number(formData.p75_wrvu),
        p90_wrvu: Number(formData.p90_wrvu),
        p25_cf: Number(formData.p25_cf),
        p50_cf: Number(formData.p50_cf),
        p75_cf: Number(formData.p75_cf),
        p90_cf: Number(formData.p90_cf),
      };

      const url = formData.id ? `/api/market-data/${formData.id}` : '/api/market-data';
      const response = await fetch(url, {
        method: formData.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to save market data');
      }

      onSave(responseData);
      onClose();
    } catch (error) {
      console.error('Error saving market data:', error);
      setError({
        show: true,
        message: error instanceof Error ? error.message : 'Failed to save market data'
      });
    }
  };

  const handleCloseError = () => {
    setError({ show: false, message: '' });
  };

  return (
    <>
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
                <Dialog.Panel className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
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
                    <div className="w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                        {data ? 'Edit Market Data' : 'Add Market Data'}
                      </Dialog.Title>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Specialty
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              list="specialties"
                              value={formData.specialty}
                              onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                              className={`block w-full px-3 py-1.5 rounded-md border border-gray-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                                validationErrors.specialty ? 'border-red-300' : ''
                              }`}
                              placeholder="Select or enter specialty"
                              disabled={!!data}
                            />
                            <datalist id="specialties">
                              {specialties.map((specialty) => (
                                <option key={specialty} value={specialty} />
                              ))}
                            </datalist>
                          </div>
                          {validationErrors.specialty && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.specialty}</p>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Total Cash Compensation</h4>
                          <div className="grid grid-cols-4 gap-4">
                            {['25th', '50th', '75th', '90th'].map((percentile, index) => {
                              const field = `p${index === 3 ? 90 : (index + 1) * 25}_total` as keyof MarketData;
                              return (
                                <div key={`total-${percentile}`} className="w-full">
                                  <div className="text-xs font-medium text-gray-700 mb-1 text-center">
                                    {percentile}
                                  </div>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      pattern="\d*\.?\d*"
                                      value={formData[field] || ''}
                                      onChange={(e) => handleInputChange(field, e.target.value)}
                                      className={`block w-full pl-7 pr-3 py-1.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-right ${
                                        validationErrors[field] ? 'border-red-300' : ''
                                      }`}
                                    />
                                  </div>
                                  {validationErrors[field] && (
                                    <p className="mt-1 text-xs text-red-600">{validationErrors[field]}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">wRVUs</h4>
                          <div className="grid grid-cols-4 gap-4">
                            {['25th', '50th', '75th', '90th'].map((percentile, index) => {
                              const field = `p${index === 3 ? 90 : (index + 1) * 25}_wrvu` as keyof MarketData;
                              return (
                                <div key={`wrvu-${percentile}`} className="w-full">
                                  <div className="text-xs font-medium text-gray-700 mb-1 text-center">
                                    {percentile}
                                  </div>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="\d*\.?\d*"
                                    value={formData[field] || ''}
                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                    className={`block w-full px-3 py-1.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-right ${
                                      validationErrors[field] ? 'border-red-300' : ''
                                    }`}
                                  />
                                  {validationErrors[field] && (
                                    <p className="mt-1 text-xs text-red-600">{validationErrors[field]}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Conversion Factor</h4>
                          <div className="grid grid-cols-4 gap-4">
                            {['25th', '50th', '75th', '90th'].map((percentile, index) => {
                              const field = `p${index === 3 ? 90 : (index + 1) * 25}_cf` as keyof MarketData;
                              return (
                                <div key={`cf-${percentile}`} className="w-full">
                                  <div className="text-xs font-medium text-gray-700 mb-1 text-center">
                                    {percentile}
                                  </div>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      pattern="\d*\.?\d*"
                                      value={formData[field] || ''}
                                      onChange={(e) => handleInputChange(field, e.target.value)}
                                      className={`block w-full pl-7 pr-3 py-1.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-right ${
                                        validationErrors[field] ? 'border-red-300' : ''
                                      }`}
                                    />
                                  </div>
                                  {validationErrors[field] && (
                                    <p className="mt-1 text-xs text-red-600">{validationErrors[field]}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                          >
                            Save
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

      <ErrorDialog
        isOpen={error.show}
        onClose={handleCloseError}
        title="Save Error"
        message={error.message}
      />
    </>
  );
} 

