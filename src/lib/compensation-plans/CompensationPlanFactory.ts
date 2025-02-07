import { Provider, MarketData } from '@/types/dashboard';
import { BaseCompensationPlan } from './BaseCompensationPlan';
import { BasePayPlan } from './BasePayPlan';
import { StandardPlan } from './StandardPlan';
import { TieredCFPlan } from './TieredCFPlan';

export class CompensationPlanFactory {
  static createPlan(
    provider: Provider, 
    marketData: MarketData[], 
    holdbackPercentage: number = 20
  ): BaseCompensationPlan {
    switch (provider.compensationModel) {
      case 'Base Pay':
        return new BasePayPlan(provider, marketData, holdbackPercentage);
      case 'Standard':
        return new StandardPlan(provider, marketData, holdbackPercentage);
      case 'Tiered CF':
        return new TieredCFPlan(provider, marketData, holdbackPercentage);
      default:
        throw new Error(`Unknown compensation model: ${provider.compensationModel}`);
    }
  }
} 