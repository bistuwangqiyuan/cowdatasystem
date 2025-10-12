/**
 * Milk Record Types and Interfaces
 * 
 * 产奶记录相关的类型定义和接口。
 * 
 * @module types/milk.types
 */

/**
 * 挤奶时段类型
 */
export type MilkingSession = 'morning' | 'afternoon' | 'evening';

/**
 * 产奶记录完整信息接口
 */
export interface MilkRecord {
  id: string;
  cow_id: string;
  recorded_datetime: string;
  session: MilkingSession;
  amount: number;
  fat_rate: number | null;
  protein_rate: number | null;
  somatic_cell_count: number | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

/**
 * 产奶记录表单数据接口
 */
export interface MilkRecordFormData {
  cow_id: string;
  recorded_datetime: string;
  session: MilkingSession;
  amount: number;
  fat_rate?: number;
  protein_rate?: number;
  somatic_cell_count?: number;
}

/**
 * 产奶统计数据
 */
export interface MilkStats {
  total_records: number;
  total_amount: number;
  avg_amount: number;
  max_amount: number;
  min_amount: number;
  avg_fat_rate: number;
  avg_protein_rate: number;
}

/**
 * 挤奶时段中文名称映射
 */
export const MILKING_SESSION_NAMES: Record<MilkingSession, string> = {
  morning: '早班',
  afternoon: '午班',
  evening: '晚班',
};

/**
 * 挤奶时段颜色映射
 */
export const MILKING_SESSION_COLORS: Record<MilkingSession, string> = {
  morning: 'bg-yellow-100 text-yellow-800',
  afternoon: 'bg-blue-100 text-blue-800',
  evening: 'bg-purple-100 text-purple-800',
};

/**
 * 判断产奶量是否异常（过低或过高）
 */
export function isMilkAmountAbnormal(amount: number): boolean {
  return amount < 10 || amount > 100;
}

/**
 * 判断脂肪率是否正常
 */
export function isFatRateNormal(rate: number): boolean {
  return rate >= 3.0 && rate <= 5.0;
}

/**
 * 判断蛋白质率是否正常
 */
export function isProteinRateNormal(rate: number): boolean {
  return rate >= 2.8 && rate <= 3.5;
}

