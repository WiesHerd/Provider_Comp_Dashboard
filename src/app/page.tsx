'use client'

import React from 'react';
import DashboardLayout from '@/components/Layout/DashboardLayout';
import ProviderDashboard from '@/components/Dashboard/ProviderDashboard';
import { generateSampleData } from '@/utils/seedData';
import { useParams } from 'next/navigation';

export default function Home() {
  const params = useParams();
  const { providers } = generateSampleData(50);
  
  // Get the current provider based on URL param or default to first provider
  const currentProvider = params?.providerId 
    ? providers.find(p => p.id === params.providerId)
    : providers[0];

  return (
    <DashboardLayout>
      <ProviderDashboard 
        provider={currentProvider} 
        metrics={currentProvider.metrics}
      />
    </DashboardLayout>
  );
}