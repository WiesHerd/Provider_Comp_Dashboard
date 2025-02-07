import { Suspense } from 'react';
import TierConfigDetailsClient from './TierConfigDetailsClient';

export default async function TierConfigDetailsPage({
  params
}: {
  params: { id: string }
}) {
  const id = await params.id;

  return (
    <Suspense fallback={<div className="h-full w-full flex items-center justify-center">
      <div className="animate-pulse text-gray-500">Loading...</div>
    </div>}>
      <TierConfigDetailsClient id={id} />
    </Suspense>
  );
}