import { Provider, MarketData } from '@/types/dashboard';

export interface CompensationResult {
  incentive: number;
  holdback: number;
  total: number;
}

export abstract class BaseCompensationPlan {
  protected provider: Provider;
  protected marketData: MarketData[];
  protected holdbackPercentage: number;

  constructor(provider: Provider, marketData: MarketData[], holdbackPercentage: number = 20) {
    this.provider = provider;
    this.marketData = marketData;
    this.holdbackPercentage = holdbackPercentage;
  }

  abstract calculateMonthlyIncentive(monthWRVUs: number, monthTarget: number): number;
  abstract getName(): string;

  calculateHoldback(incentive: number): number {
    if (incentive <= 0) return 0;
    return -(incentive * (this.holdbackPercentage / 100));
  }

  setHoldbackPercentage(percentage: number): void {
    this.holdbackPercentage = percentage;
  }

  protected getMarketDataForSpecialty(): MarketData | undefined {
    return this.marketData.find(data => data.specialty === this.provider.specialty);
  }

  protected getConversionFactor(): number {
    const marketData = this.getMarketDataForSpecialty();
    return marketData ? marketData.p50_cf : 0;
  }

  calculateCompensation(monthWRVUs: number, monthTarget: number): CompensationResult {
    const incentive = this.calculateMonthlyIncentive(monthWRVUs, monthTarget);
    const holdback = this.calculateHoldback(incentive);
    
    return {
      incentive,
      holdback,
      total: this.provider.baseSalary / 12 + incentive + holdback
    };
  }
} 