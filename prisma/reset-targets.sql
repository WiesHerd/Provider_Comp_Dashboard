-- Reset target columns in ProviderMetrics table
UPDATE ProviderMetrics
SET targetWRVUs = 0,
    cumulativeTarget = 0; 