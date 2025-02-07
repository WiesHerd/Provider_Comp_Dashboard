import { BaseCompensationPlan } from './BaseCompensationPlan';

export class StandardPlan extends BaseCompensationPlan {
  private readonly defaultHoldbackPercentage = 20;

  getName(): string {
    return 'Standard';
  }

  calculateMonthlyIncentive(monthWRVUs: number, monthTarget: number): number {
    const variance = monthWRVUs - monthTarget;
    if (variance <= 0) return 0;
    
    const cf = this.getConversionFactor();
    return variance * cf;
  }

  calculateHoldback(incentive: number): number {
    if (incentive <= 0) return 0;
    return -(incentive * (this.defaultHoldbackPercentage / 100));
  }
} 