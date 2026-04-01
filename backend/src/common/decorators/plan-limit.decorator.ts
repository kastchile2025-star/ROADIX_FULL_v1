import { SetMetadata } from '@nestjs/common';
import { PLAN_LIMIT_KEY, type PlanLimitType } from '../guards/plan-limit.guard.js';

export const PlanLimit = (type: PlanLimitType) =>
  SetMetadata(PLAN_LIMIT_KEY, type);
