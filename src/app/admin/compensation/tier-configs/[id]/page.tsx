import { Suspense } from 'react';
import TierConfigDetailsClient from './TierConfigDetailsClient';

export default function TierConfigPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={
      <div className="h-full w-full flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    }>
      <TierConfigDetailsClient id={params.id} />
    </Suspense>
  );
} 