/**
 * 繁殖记录类型定义
 * 
 * @module types/breeding.types
 */

/**
 * 繁殖状态枚举
 */
export type BreedingStatus = 'planned' | 'completed' | 'failed' | 'aborted';

/**
 * 配种方式枚举
 */
export type BreedingMethod = 'artificial' | 'natural';

/**
 * 妊娠检查结果枚举
 */
export type PregnancyCheckResult = 'positive' | 'negative' | 'uncertain';

/**
 * 繁殖记录接口
 */
export interface BreedingRecord {
  id: string;
  cow_id: string;
  bull_id?: string;
  breeding_date: string;
  breeding_method: BreedingMethod;
  status: BreedingStatus;
  pregnancy_check_date?: string;
  pregnancy_result?: PregnancyCheckResult;
  expected_calving_date?: string;
  actual_calving_date?: string;
  calf_id?: string;
  calf_gender?: 'male' | 'female';
  calf_weight?: number;
  complications?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at?: string;
}

/**
 * 繁殖记录表单数据
 */
export interface BreedingFormData {
  cow_id: string;
  bull_id?: string;
  breeding_date: string;
  breeding_method: BreedingMethod;
  pregnancy_check_date?: string;
  pregnancy_result?: PregnancyCheckResult;
  expected_calving_date?: string;
  notes?: string;
}

/**
 * 繁殖记录查询过滤器
 */
export interface BreedingFilters {
  cow_id?: string;
  status?: BreedingStatus;
  breeding_method?: BreedingMethod;
  start_date?: string;
  end_date?: string;
}

/**
 * 繁殖统计数据
 */
export interface BreedingStats {
  total_breedings: number;
  completed_breedings: number;
  success_rate: number;
  pending_pregnancies: number;
  expected_calvings: number;
}

export const BreedingStatusLabels: Record<BreedingStatus, string> = {
  planned: '计划配种',
  completed: '已完成',
  failed: '配种失败',
  aborted: '终止',
};

export const BreedingMethodLabels: Record<BreedingMethod, string> = {
  artificial: '人工授精',
  natural: '自然交配',
};

export const PregnancyResultLabels: Record<PregnancyCheckResult, string> = {
  positive: '妊娠',
  negative: '未妊娠',
  uncertain: '待确认',
};

