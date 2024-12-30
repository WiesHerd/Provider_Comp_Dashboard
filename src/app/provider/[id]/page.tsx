import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface PageProps {
  params: {
    id: string;
  };
}

async function getProvider(id: string) {
  const provider = await prisma.provider.findUnique({
    where: { id },
    include: {
      wrvuData: true,
      compensationChanges: true,
      wrvuAdjustments: true,
      targetAdjustments: true,
      additionalPayments: true
    }
  });

  if (!provider) {
    notFound();
  }

  return provider;
}

export default async function ProviderPage({ params }: PageProps) {
  const provider = await getProvider(params.id);

  return (
    <div className="space-y-4">
      {/* Basic Info */}
      <div className="flex gap-4 items-center text-sm text-gray-600">
        <div>ID: {provider.employeeId}</div>
        <div>Comp Type: {provider.compensationModel}</div>
      </div>

      {/* FTE Information */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="mb-2 font-medium">FTE Breakdown</div>
        <div className="space-y-3">
          {/* Clinical FTE */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Clinical FTE</span>
              <span className="font-medium">{provider.clinicalFte?.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500" 
                style={{ width: `${(provider.clinicalFte / provider.fte) * 100}%` }}
              />
            </div>
          </div>

          {/* Non-Clinical FTE */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Non-Clinical FTE</span>
              <span className="font-medium">{provider.nonClinicalFte?.toFixed(2)}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500" 
                style={{ width: `${(provider.nonClinicalFte / provider.fte) * 100}%` }}
              />
            </div>
          </div>

          {/* Total FTE */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span>Total FTE</span>
              <span className="font-medium">{provider.fte?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 