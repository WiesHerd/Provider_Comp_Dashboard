'use client';

import { useParams } from 'next/navigation';
import { generateSampleData } from '@/utils/seedData';
import ProviderDashboard from '@/components/Dashboard/ProviderDashboard';

export default function ProviderPage() {
  const params = useParams();
  const { providers } = generateSampleData(800);
  
  // Get the current provider based on URL param
  const currentProvider = providers.find(p => p.id === params?.providerId);

  if (!currentProvider) {
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
      provider={currentProvider}
    />
  );
} 