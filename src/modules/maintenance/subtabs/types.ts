import type { Firearm, MaintenanceLog, MaintenanceScheduleItem, OpticZeroRecord } from '@/types';

export interface ServiceTaskEntry {
  firearm: Firearm;
  task: MaintenanceScheduleItem;
  roundsSince: number;
  daysSince: number;
  isRoundOverdue: boolean;
  isDateOverdue: boolean;
  isOverdue: boolean;
  isRoundDueSoon: boolean;
  isDateDueSoon: boolean;
  isDueSoon: boolean;
  isGoodStanding: boolean;
  roundProgress: number;
  daysProgress: number;
}
