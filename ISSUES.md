# Application Issues and Solutions Log

## Provider Dashboard Routing Issue
**Date:** [Current Date]
**Status:** ✅ Resolved

### Issue Description
When clicking on a provider name in the admin providers table (`/admin/providers`), the application would show an error message: "An unexpected error occurred while fetching provider data". This occurred because of a mismatch in routing parameters between the admin table navigation and the provider dashboard's API endpoint expectations.

### Root Cause
1. The admin providers table was using the internal database ID for navigation:
   ```typescript
   href={`/admin/providers/${provider.id}`}
   ```
2. However, the provider dashboard page and its API endpoint (`/api/providers/employee/[employeeId]`) were expecting the `employeeId` parameter.

### Solution
Updated the Link component in `src/app/admin/providers/components/ProvidersTable.tsx` to use the `employeeId` instead of the internal `id`:

```typescript
<Link 
  href={`/provider/${provider.employeeId}`}
  className="text-blue-600 hover:text-blue-900"
>
  {provider.firstName} {provider.lastName}
</Link>
```

### Technical Details
- **File Modified:** `src/app/admin/providers/components/ProvidersTable.tsx`
- **Component:** ProvidersTable
- **API Endpoint:** `/api/providers/employee/[employeeId]`
- **Route Pattern:** `/provider/[employeeId]`

### Prevention
To prevent similar issues in the future:
1. Maintain consistent ID usage across the application (either `employeeId` or internal `id`)
2. Add TypeScript interfaces to enforce correct parameter usage
3. Consider adding route parameter validation
4. Add error boundaries to catch and display routing-related errors more gracefully

### Related Components
- Provider Dashboard Page (`src/app/provider/[providerId]/page.tsx`)
- Provider API Route (`src/app/api/providers/employee/[employeeId]/route.ts`)
- Admin Providers Table (`src/app/admin/providers/components/ProvidersTable.tsx`)

## Provider Compensation Calculation Issue
**Date:** 2025-02-02
**Status:** ✅ Resolved

### Issue Description
The provider compensation comparison report was not correctly displaying total YTD compensation because it was missing earned incentives from WRVU production. For Linda Garcia (EMP1023), this resulted in showing only $183,299 (YTD Base) + Additional Pay, while missing approximately $160,250 in earned incentives (after holdback).

### Root Cause
In the compensation comparison API endpoint (`/api/reports/compensation-comparison`), the YTD compensation calculation was incomplete:
```typescript
// Old code - missing incentives
const totalYTDComp = baseYTDComp + ytdAdditionalPay;
```

### Solution
1. Added calculation for YTD incentives from the metrics table:
```typescript
const ytdIncentives = provider.metrics.reduce((total: number, metric: any) => {
  const incentiveAmount = metric.incentivesEarned || 0;
  const holdbackAmount = metric.holdbackAmount || 0;
  return total + (incentiveAmount - holdbackAmount);
}, 0);
```

2. Updated total YTD compensation to include all three components:
```typescript
const totalYTDComp = baseYTDComp + ytdAdditionalPay + ytdIncentives;
```

### Technical Details
- **File Modified:** `src/app/api/reports/compensation-comparison/route.ts`
- **Component:** GET function in compensation comparison API
- **Function Location:** Inside the `calculateProviderMetrics` helper function within the main GET handler
- **Database Models Used:** 
  - Provider (with metrics relation)
  - ProviderMetrics (with fields: incentivesEarned, holdbackAmount)
  - AdditionalPay

**Implementation Context:**
```typescript
// Inside calculateProviderMetrics helper function
const calculateProviderMetrics = (provider: any, marketData: any) => {
  // Calculate YTD base (unchanged)
  const baseYTDComp = (provider.baseSalary || 0) * (month / 12);
  
  // Calculate YTD additional pay (unchanged)
  const ytdAdditionalPay = provider.AdditionalPay.reduce((total: number, pay: any) => 
    total + (pay.amount || 0), 0);
  
  // New: Calculate YTD incentives including holdback
  const ytdIncentives = provider.metrics
    .filter((metric: any) => metric.year === currentYear && metric.month <= selectedMonth)
    .reduce((total: number, metric: any) => {
      const incentiveAmount = metric.incentivesEarned || 0;
      const holdbackAmount = metric.holdbackAmount || 0;
      return total + (incentiveAmount - holdbackAmount);
    }, 0);

  // New: Total YTD calculation with all components
  const totalYTDComp = baseYTDComp + ytdAdditionalPay + ytdIncentives;

  return {
    ...provider,
    metrics: {
      ytdBase: baseYTDComp,
      ytdIncentives,
      ytdAdditionalPay,
      totalYTDCompensation: totalYTDComp,
      // ... other metrics
    }
  };
};
```

**Required Types:**
```typescript
interface ProviderMetric {
  year: number;
  month: number;
  incentivesEarned: number;
  holdbackAmount: number;
}

interface Provider {
  id: string;
  baseSalary: number;
  metrics: ProviderMetric[];
  AdditionalPay: Array<{ amount: number }>;
}
```

**Edge Cases Handled:**
1. Missing metrics records: Defaults to 0 for calculations
2. Null/undefined values: Uses nullish coalescing
3. Time period filtering: Only includes metrics for current year up to selected month
4. Empty arrays: Reduce operations start with 0 as initial value

### Verification
The fix was verified by checking Linda Garcia's compensation data:
- YTD Base: $274,948
- YTD Additional Pay: $36,500
- YTD Incentives (after holdback): $160,250.66
- Total YTD: $471,698.66

### Prevention
1. When calculating total compensation, ensure all components are included:
   - Base salary (prorated for YTD)
   - Incentives (net of holdback)
   - Additional pay
2. Add comprehensive test cases for compensation calculations
3. Add validation checks for expected compensation ranges
4. Implement logging for compensation component breakdowns

### Related Components
- Compensation Comparison Page (`src/app/admin/reports/compensation/page.tsx`)
- Comparison Table Component (`src/app/admin/reports/compensation/components/ComparisonTable.tsx`)
- Provider Metrics Model (`prisma/schema.prisma`) 