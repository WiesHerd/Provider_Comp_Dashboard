-- Provider Search Optimization
CREATE INDEX IF NOT EXISTS "providers_name_search_idx" ON "providers"("lastName", "firstName");
CREATE INDEX IF NOT EXISTS "providers_email_search_idx" ON "providers"("email");
CREATE INDEX IF NOT EXISTS "providers_employee_search_idx" ON "providers"("employeeId");

-- Provider Metrics Analytics Optimization
CREATE INDEX IF NOT EXISTS "provider_metrics_performance_idx" ON "ProviderMetrics"("wrvuPercentile", "compPercentile");
CREATE INDEX IF NOT EXISTS "provider_metrics_compensation_idx" ON "ProviderMetrics"("totalCompensation", "baseSalary");
CREATE INDEX IF NOT EXISTS "provider_metrics_wrvu_tracking_idx" ON "ProviderMetrics"("actualWRVUs", "targetWRVUs", "ytdWRVUs");

-- Provider Analytics Performance Optimization
CREATE INDEX IF NOT EXISTS "provider_analytics_performance_idx" ON "ProviderAnalytics"("ytdProgress", "ytdTargetProgress");
CREATE INDEX IF NOT EXISTS "provider_analytics_utilization_idx" ON "ProviderAnalytics"("clinicalUtilization", "incentivePercentage");

-- WRVU Data Analysis Optimization
CREATE INDEX IF NOT EXISTS "wrvu_data_value_tracking_idx" ON "WRVUData"("value", "hours");

-- Market Data Analysis Optimization
CREATE INDEX IF NOT EXISTS "market_data_percentile_analysis_idx" ON "market_data"("p50_total", "p75_total", "p90_total");
CREATE INDEX IF NOT EXISTS "market_data_wrvu_analysis_idx" ON "market_data"("p50_wrvu", "p75_wrvu", "p90_wrvu");

-- Market Data History Optimization
CREATE INDEX IF NOT EXISTS "market_data_history_tracking_idx" ON "MarketDataHistory"("changedAt", "changeType", "fieldName");

-- Compensation Change Analysis
CREATE INDEX IF NOT EXISTS "compensation_changes_analysis_idx" ON "CompensationChange"("previousSalary", "newSalary", "effectiveDate"); 