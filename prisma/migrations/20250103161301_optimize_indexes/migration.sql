-- CreateIndex for providers
CREATE INDEX "providers_specialty_idx" ON "providers"("specialty");
CREATE INDEX "providers_department_idx" ON "providers"("department");
CREATE INDEX "providers_status_idx" ON "providers"("status");
CREATE INDEX "providers_hireDate_idx" ON "providers"("hireDate");
CREATE INDEX "providers_terminationDate_idx" ON "providers"("terminationDate");

-- CreateIndex for market data
CREATE INDEX "market_data_specialty_idx" ON "market_data"("specialty");

-- CreateIndex for provider metrics
CREATE INDEX "provider_metrics_year_month_idx" ON "ProviderMetrics"("year", "month");
CREATE INDEX "provider_metrics_providerId_year_month_idx" ON "ProviderMetrics"("providerId", "year", "month");

-- CreateIndex for provider analytics
CREATE INDEX "provider_analytics_year_month_idx" ON "ProviderAnalytics"("year", "month");
CREATE INDEX "provider_analytics_providerId_year_month_idx" ON "ProviderAnalytics"("providerId", "year", "month");

-- CreateIndex for WRVU data
CREATE INDEX "wrvu_data_year_month_idx" ON "WRVUData"("year", "month"); 