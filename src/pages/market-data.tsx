import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout/AdminLayout';
import MarketDataTable from '@/components/MarketData/MarketDataTable';
import EditMarketDataModal from '@/components/MarketData/EditMarketDataModal';

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

export default function MarketDataPage() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<MarketData | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/market-data');
      if (!response.ok) throw new Error('Failed to fetch market data');
      const data = await response.json();
      setMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (data: MarketData) => {
    setSelectedData(data);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this market data?')) return;

    try {
      const response = await fetch(`/api/market-data/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete market data');
      
      setMarketData(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting market data:', error);
      alert('Failed to delete market data');
    }
  };

  const handleSave = async (data: MarketData) => {
    await fetchMarketData();
    setIsModalOpen(false);
    setSelectedData(undefined);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        <div className="sm:flex sm:items-center mb-6">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Market Data Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              View and manage specialty-specific market data for compensation benchmarking.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                setSelectedData(undefined);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              Add Market Data
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="mt-4">
            <MarketDataTable
              data={marketData}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}

        <EditMarketDataModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedData(undefined);
          }}
          onSave={handleSave}
          data={selectedData}
        />
      </div>
    </AdminLayout>
  );
} 