'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProviderDashboard from '@/components/Dashboard/ProviderDashboard';
import type { WRVUAdjustment, TargetAdjustment } from '@/types';
import Loading from '@/app/loading';

export default function ProviderPage() {
  const params = useParams();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<WRVUAdjustment[]>([]);
  const [targetAdjustments, setTargetAdjustments] = useState<TargetAdjustment[]>([]);

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
    return <Loading />;
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
      adjustments={adjustments}
      targetAdjustments={targetAdjustments}
      setAdjustments={setAdjustments}
      setTargetAdjustments={setTargetAdjustments}
    />
  );
} 