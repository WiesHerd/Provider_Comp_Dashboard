import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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
}

interface EditMarketDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: MarketData) => void;
  data?: MarketData;
}

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
  // Add more specialties as needed
];

export default function EditMarketDataModal({ isOpen, onClose, onSave, data }: EditMarketDataModalProps) {
  const [formData, setFormData] = useState<MarketData>({
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

  useEffect(() => {
    if (data) {
      console.log('=== Edit Modal Debug ===');
      console.log('Raw market data received:', JSON.stringify(data, null, 2));
      
      const formattedData: MarketData = {
        specialty: data.specialty,
        p25_total: Number(data.p25_total),
        p50_total: Number(data.p50_total),
        p75_total: Number(data.p75_total),
        p90_total: Number(data.p90_total),
        p25_wrvu: Number(data.p25_wrvu),
        p50_wrvu: Number(data.p50_wrvu),
        p75_wrvu: Number(data.p75_wrvu),
        p90_wrvu: Number(data.p90_wrvu),
        p25_cf: Number(data.p25_cf),
        p50_cf: Number(data.p50_cf),
        p75_cf: Number(data.p75_cf),
        p90_cf: Number(data.p90_cf)
      };

      console.log('Formatted form data:', JSON.stringify(formattedData, null, 2));
      console.log('90th percentile values:', {
        total: formattedData.p90_total,
        wrvu: formattedData.p90_wrvu,
        cf: formattedData.p90_cf
      });
      
      setFormData(formattedData);
    } else {
      setFormData({
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
  }, [data]);

  const handleInputChange = (field: keyof MarketData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'specialty' ? value : parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const processedData = {
        id: data?.id,
        ...formData
      };

      const endpoint = data?.id ? `/api/market-data/${data.id}` : '/api/market-data';
      const method = data?.id ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${data?.id ? 'update' : 'create'} market data`);
      }

      const responseData = await response.json();
      onSave(responseData);
    } catch (error) {
      console.error('Error saving market data:', error);
      alert('Failed to save market data');
    }
  };

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
                      {/* Specialty Selection */}
                      <div className="mb-6">
                        <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
                          Specialty
                        </label>
                        <input
                          type="text"
                          id="specialty"
                          list="specialties"
                          value={formData.specialty}
                          onChange={(e) => handleInputChange('specialty', e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder="Select or enter specialty"
                          required
                        />
                        <datalist id="specialties">
                          {specialties.map((specialty) => (
                            <option key={specialty} value={specialty} />
                          ))}
                        </datalist>
                      </div>

                      {/* Total Cash Compensation */}
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
                                    type="number"
                                    value={formData[field] || ''}
                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                    className="block w-full pl-7 pr-3 py-1.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-right"
                                    required
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* wRVUs */}
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
                                  type="number"
                                  value={formData[field] || ''}
                                  onChange={(e) => handleInputChange(field, e.target.value)}
                                  className="block w-full px-3 py-1.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-right"
                                  required
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Conversion Factor */}
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
                                    type="number"
                                    value={formData[field] || ''}
                                    onChange={(e) => handleInputChange(field, e.target.value)}
                                    className="block w-full pl-7 pr-3 py-1.5 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-right"
                                    required
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Save
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