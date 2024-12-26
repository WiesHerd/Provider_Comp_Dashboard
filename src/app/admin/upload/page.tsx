'use client';

import { Card } from '@/components/ui/card';
import ProviderUpload from '@/components/Upload/ProviderUpload';
import MarketDataUpload from '@/components/Upload/MarketDataUpload';
import WRVUUpload from '@/components/Upload/WRVUUpload';

export default function UploadPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Data Upload</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Provider Data</h2>
            <p className="text-sm text-gray-600">
              Upload provider information including employee ID, name, and specialty.
            </p>
          </div>
          <div className="flex-grow">
            <ProviderUpload />
          </div>
        </Card>

        <Card className="p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Market Data</h2>
            <p className="text-sm text-gray-600">
              Upload market data for provider specialties. Loaded annually from survey data.
            </p>
          </div>
          <div className="flex-grow">
            <MarketDataUpload />
          </div>
        </Card>

        <Card className="p-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">wRVU Data</h2>
            <p className="text-sm text-gray-600">
              Upload monthly wRVU data for providers.
              <br />
              &nbsp;
            </p>
          </div>
          <div className="flex-grow">
            <WRVUUpload />
          </div>
        </Card>
      </div>
    </div>
  );
} 