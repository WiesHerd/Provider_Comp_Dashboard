'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProviderDashboard from '@/components/Dashboard/ProviderDashboard';

export default function ProviderPage() {
  const params = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProvider() {
      try {
        const response = await fetch(`/api/providers/employee/${params?.providerId}`);
        const data = await response.json();
        if (response.ok) {
          setProvider(data);
        }
      } catch (error) {
        console.error('Error fetching provider:', error);
      } finally {
        setLoading(false);
      }
    }

    if (params?.providerId) {
      fetchProvider();
    }
  }, [params?.providerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Provider Not Found</h2>
          <p className="mt-2 text-gray-600">The provider you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <ProviderDashboard 
      provider={provider}
    />
  );
} 