# Provider Compensation Dashboard

A comprehensive dashboard for tracking and managing provider compensation, wRVU calculations, and performance metrics.

## Changelog

### Bug Fixes and Improvements Log

#### Target Calculation Fixes
- Fixed issue with `targetWRVUs` and `cumulativeTarget` calculations in ProviderMetrics
  - Root cause: Incorrect multiplication of annual target by FTE
  - Solution: Applied FTE adjustment correctly in monthly target calculation
  - File: `src/app/api/metrics/calculate-all-targets/route.ts`

#### Percentile Calculation Updates
- Fixed `wrvuPercentile` and `compPercentile` calculations
  - Issue: Percentiles were not being calculated against correct market data benchmarks
  - Solution: Updated comparison logic to use appropriate specialty benchmarks
  - Added proper error handling for missing market data

#### Data Persistence Improvements
- Enhanced error handling for database operations
- Added logging for calculation steps to track data flow
- Implemented validation checks before saving metrics

#### Additional Pay Adjustments
- Fixed empty response issues when editing additional pay entries
- Added proper error handling and user feedback
- Improved validation of adjustment values

### Best Practices Implemented
1. Always validate market data availability before calculations
2. Log calculation steps for debugging
3. Verify data integrity before and after updates
4. Maintain proper error handling throughout the application
5. Regular testing of calculation logic with sample data

### Known Issues to Monitor
1. Market data matching for specialties needs exact string matches
2. Cumulative calculations need verification when adjustments are made mid-year
3. Performance optimization needed for large provider datasets

#### Date Handling and Data Upload Issues
- Fixed recurring issues with provider data uploads and date handling
  - Issue 1: Excel dates were being incorrectly parsed, causing hire dates to default to current date
    - Root cause: Excel stores dates as serial numbers (days since 1900-01-01)
    - Solution: Implemented proper Excel date parsing using UTC and correct epoch (December 30, 1899)
    - File: `src/app/api/upload/provider/route.ts`
  
  - Issue 2: Base salaries and FTE values were not being properly extracted from Excel
    - Root cause: Excel's number formatting was interfering with value extraction
    - Solution: Updated XLSX read options to get raw values and improved number cleaning function
    - Added better validation and error handling for numeric fields

  - Issue 3: Prisma type conflicts with null dates
    - Root cause: Prisma schema requires non-null DateTime for hireDate
    - Solution: Proper validation and error handling for required date fields before database operations

### Best Practices for Data Uploads
1. Always validate date fields before processing
2. Use raw values from Excel to avoid formatting issues
3. Implement proper error handling with descriptive messages
4. Log raw and parsed values for debugging
5. Validate data types match Prisma schema requirements