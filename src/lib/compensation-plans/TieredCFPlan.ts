import { BaseCompensationPlan } from './BaseCompensationPlan';
import { calculateWRVUPercentile } from '@/lib/utils';

export class TieredCFPlan extends BaseCompensationPlan {
  getName(): string {
    return 'Tiered CF';
  }

  calculateMonthlyIncentive(monthWRVUs: number, monthTarget: number): number {
    const variance = monthWRVUs - monthTarget;
    if (variance <= 0) return 0;
    
    // Calculate the percentile for this month's wRVUs
    const { percentile } = calculateWRVUPercentile(
      monthWRVUs,
      1, // Only considering one month
      this.provider.fte,
      this.marketData,
      this.provider.specialty,
      this.provider.clinicalFte
    );

    // Get the tiered CF config
    if (!this.provider.tieredCFConfigId) {
      console.warn('No tiered CF config found for provider');
      return 0;
    }

    // Find the applicable tier based on the percentile
    const config = this.marketData.find(data => data.specialty === this.provider.specialty);
    if (!config) {
      console.warn('No market data found for specialty:', this.provider.specialty);
      return 0;
    }

    // Use the conversion factor from market data based on percentile
    let cf = config.p50_cf; // Default to 50th percentile CF
    if (percentile >= 90) cf = config.p90_cf;
    else if (percentile >= 75) cf = config.p75_cf;
    else if (percentile >= 50) cf = config.p50_cf;
    else if (percentile >= 25) cf = config.p25_cf;

    return variance * cf;
  }
} 