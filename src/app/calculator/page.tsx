export default function CalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Container with consistent max-width and padding */}
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Percentile Calculator</h1>
            <p className="mt-1 text-sm text-gray-600">
              Calculate percentiles for compensation metrics based on market data.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Results
          </button>
        </div>

        {/* Calculator Section */}
        <div className="space-y-6">
          {/* Input Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Specialty Select */}
                <div className="space-y-1.5">
                  <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                    Specialty
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="specialty"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>Select a specialty</option>
                    {/* Options will be populated dynamically */}
                  </select>
                </div>

                {/* Metric Select */}
                <div className="space-y-1.5">
                  <label htmlFor="metric" className="block text-sm font-medium text-gray-700">
                    Metric
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="metric"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    defaultValue=""
                  >
                    <option value="" disabled>Select a metric</option>
                    <option value="tcc">Total Cash Compensation</option>
                    <option value="wrvu">Work RVUs</option>
                    <option value="cf">Conversion Factor</option>
                  </select>
                </div>

                {/* Value Input */}
                <div className="space-y-1.5">
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                    Value
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="text"
                      id="value"
                      className="block w-full rounded-md border-gray-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="Enter value"
                    />
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Calculate Percentile
                </button>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  A wRVUs of <span className="font-semibold">2,234.00</span> for General is at the <span className="font-semibold">12.5th</span> percentile.
                </p>
              </div>

              {/* Market Reference Points */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-4">Market Data Reference</h3>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: '25th', value: '4,451.00' },
                    { label: '50th', value: '5,786.00' },
                    { label: '75th', value: '6,945.00' },
                    { label: '90th', value: '8,328.00' },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">{item.label} Percentile</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 