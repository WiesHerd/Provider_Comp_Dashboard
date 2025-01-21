-- Provider Indexes
CREATE INDEX IF NOT EXISTS "providers_status_specialty_idx" ON "providers"("status", "specialty");
CREATE INDEX IF NOT EXISTS "providers_status_department_idx" ON "providers"("status", "department");
CREATE INDEX IF NOT EXISTS "providers_active_date_range_idx" ON "providers"("hireDate", "terminationDate") WHERE "status" = 'ACTIVE';

-- Market Data Indexes
CREATE INDEX IF NOT EXISTS "market_data_specialty_total_idx" ON "market_data"("specialty", "p50_total", "p75_total");
CREATE INDEX IF NOT EXISTS "market_data_specialty_wrvu_idx" ON "market_data"("specialty", "p50_wrvu", "p75_wrvu");

-- WRVU Data Performance Indexes
CREATE INDEX IF NOT EXISTS "wrvu_data_date_provider_idx" ON "WRVUData"("year", "month", "providerId");
CREATE INDEX IF NOT EXISTS "wrvu_data_provider_date_idx" ON "WRVUData"("providerId", "year", "month");

-- Provider Metrics Compound Indexes
CREATE INDEX IF NOT EXISTS "provider_metrics_date_idx" ON "ProviderMetrics"("year", "month");
CREATE INDEX IF NOT EXISTS "provider_metrics_provider_date_idx" ON "ProviderMetrics"("providerId", "year", "month");

-- Provider Analytics Compound Indexes
CREATE INDEX IF NOT EXISTS "provider_analytics_date_idx" ON "ProviderAnalytics"("year", "month");
CREATE INDEX IF NOT EXISTS "provider_analytics_provider_date_idx" ON "ProviderAnalytics"("providerId", "year", "month");

-- Adjustment Indexes
CREATE INDEX IF NOT EXISTS "wrvu_adjustments_date_idx" ON "WRVUAdjustment"("year", "month");
CREATE INDEX IF NOT EXISTS "target_adjustments_date_idx" ON "TargetAdjustment"("year", "month");
CREATE INDEX IF NOT EXISTS "additional_payments_date_idx" ON "AdditionalPayment"("year", "month");

-- Compensation Change Index
CREATE INDEX IF NOT EXISTS "compensation_changes_date_idx" ON "CompensationChange"("effectiveDate");

-- Market Data History Index
CREATE INDEX IF NOT EXISTS "market_data_history_date_type_idx" ON "MarketDataHistory"("changedAt", "changeType"); 