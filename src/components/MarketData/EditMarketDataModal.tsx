'use client';

import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

interface EditMarketDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MarketData) => Promise<void>;
  data?: MarketData;
}

const defaultData: MarketData = {
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
  p90_cf: 0,
};

export default function EditMarketDataModal({ isOpen, onClose, onSave, data }: EditMarketDataModalProps) {
  const [formData, setFormData] = useState<MarketData>(defaultData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setFormData(data);
    } else {
      setFormData(defaultData);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/market-data', {
        method: data ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save market data');
      }

      const savedData = await response.json();
      await onSave(savedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof MarketData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'specialty' ? value : parseFloat(value) || 0
    }));
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-3xl rounded-xl bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
            <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
              {data ? 'Edit Market Data' : 'Add Market Data'}
            </Dialog.Title>
            <button
              type="button"
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                  Specialty
                </label>
                <input
                  type="text"
                  name="specialty"
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => handleChange('specialty', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Total Cash Compensation</h3>
                  <div className="space-y-2">
                    {['25th', '50th', '75th', '90th'].map((percentile) => (
                      <div key={`total-${percentile}`}>
                        <label htmlFor={`p${percentile.split('th')[0]}_total`} className="block text-xs text-gray-500">
                          {percentile} Percentile
                        </label>
                        <input
                          type="number"
                          name={`p${percentile.split('th')[0]}_total`}
                          id={`p${percentile.split('th')[0]}_total`}
                          value={formData[`p${percentile.split('th')[0]}_total` as keyof MarketData]}
                          onChange={(e) => handleChange(`p${percentile.split('th')[0]}_total` as keyof MarketData, e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">wRVUs</h3>
                  <div className="space-y-2">
                    {['25th', '50th', '75th', '90th'].map((percentile) => (
                      <div key={`wrvu-${percentile}`}>
                        <label htmlFor={`p${percentile.split('th')[0]}_wrvu`} className="block text-xs text-gray-500">
                          {percentile} Percentile
                        </label>
                        <input
                          type="number"
                          name={`p${percentile.split('th')[0]}_wrvu`}
                          id={`p${percentile.split('th')[0]}_wrvu`}
                          value={formData[`p${percentile.split('th')[0]}_wrvu` as keyof MarketData]}
                          onChange={(e) => handleChange(`p${percentile.split('th')[0]}_wrvu` as keyof MarketData, e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Conversion Factor</h3>
                  <div className="space-y-2">
                    {['25th', '50th', '75th', '90th'].map((percentile) => (
                      <div key={`cf-${percentile}`}>
                        <label htmlFor={`p${percentile.split('th')[0]}_cf`} className="block text-xs text-gray-500">
                          {percentile} Percentile
                        </label>
                        <input
                          type="number"
                          name={`p${percentile.split('th')[0]}_cf`}
                          id={`p${percentile.split('th')[0]}_cf`}
                          value={formData[`p${percentile.split('th')[0]}_cf` as keyof MarketData]}
                          onChange={(e) => handleChange(`p${percentile.split('th')[0]}_cf` as keyof MarketData, e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          required
                          step="0.1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-x-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 