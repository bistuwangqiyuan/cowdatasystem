/**
 * Health Record Types and Interfaces
 * 
 * 健康记录相关的类型定义和接口。
 * 
 * @module types/health.types
 */

/**
 * 健康状态类型
 */
export type HealthStatus = 'good' | 'fair' | 'poor';

/**
 * 健康记录完整信息接口
 */
export interface HealthRecord {
  id: string;
  cow_id: string;
  recorded_date: string;
  temperature: number | null;
  mental_status: HealthStatus | null;
  appetite: HealthStatus | null;
  fecal_condition: string | null;
  symptoms: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

/**
 * 健康记录表单数据接口
 */
export interface HealthRecordFormData {
  cow_id: string;
  recorded_date: string;
  temperature?: number;
  mental_status?: HealthStatus;
  appetite?: HealthStatus;
  fecal_condition?: string;
  symptoms?: string;
}

/**
 * 健康状态中文名称映射
 */
export const HEALTH_STATUS_NAMES: Record<HealthStatus, string> = {
  good: '良好',
  fair: '一般',
  poor: '差',
};

/**
 * 健康状态颜色映射
 */
export const HEALTH_STATUS_COLORS: Record<HealthStatus, string> = {
  good: 'bg-green-100 text-green-800',
  fair: 'bg-yellow-100 text-yellow-800',
  poor: 'bg-red-100 text-red-800',
};

/**
 * 判断体温是否异常
 */
export function isTemperatureAbnormal(temp: number): boolean {
  return temp < 37.5 || temp >= 39.5;
}

/**
 * 获取体温状态描述
 */
export function getTemperatureStatus(temp: number): {
  status: 'normal' | 'high' | 'low';
  message: string;
} {
  if (temp >= 39.5) {
    return { status: 'high', message: '体温偏高' };
  } else if (temp < 37.5) {
    return { status: 'low', message: '体温偏低' };
  } else {
    return { status: 'normal', message: '体温正常' };
  }
}

