import { BaseCompensationPlan } from './BaseCompensationPlan';

export class BasePayPlan extends BaseCompensationPlan {
  getName(): string {
    return 'Base Pay';
  }

  calculateMonthlyIncentive(): number {
    return 0; // Base pay has no incentives
  }

  calculateHoldback(): number {
    return 0; // Base pay has no holdback
  }
} 