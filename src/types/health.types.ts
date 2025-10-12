/**
 * 健康记录类型定义
 * 用于奶牛日常健康监测数据
 * 
 * @module types/health.types
 * @see supabase/migrations/001_initial_schema.sql - health_records 表定义
 */

/**
 * 精神状态枚举
 */
export type MentalStateType = 'normal' | 'depressed' | 'excited';

/**
 * 食欲状态枚举
 */
export type AppetiteType = 'good' | 'normal' | 'poor';

/**
 * 健康记录接口
 * 映射数据库 health_records 表
 */
export interface HealthRecord {
  /** 主键 */
  id: string;
  
  /** 关联奶牛ID */
  cow_id: string;
  
  /** 检查日期时间 */
  check_datetime: string;
  
  /** 体温 (°C) - 正常范围: 38.0-39.5 */
  temperature: number;
  
  /** 精神状态 */
  mental_state: MentalStateType;
  
  /** 食欲状态 */
  appetite: AppetiteType;
  
  /** 呼吸频率 (次/分) - 正常范围: 15-35 */
  respiratory_rate?: number;
  
  /** 心率 (次/分) - 正常范围: 60-80 */
  heart_rate?: number;
  
  /** 瘤胃蠕动频率 (次/2分钟) - 正常范围: 4-10 */
  rumen_movement?: number;
  
  /** 粪便性状描述 */
  fecal_condition?: string;
  
  /** 健康问题描述 */
  health_issues?: string;
  
  /** 处理措施 */
  treatment?: string;
  
  /** 检查人员ID */
  examiner_id: string;
  
  /** 备注 */
  notes?: string;
  
  /** 审计字段 */
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at?: string;
}

/**
 * 健康记录表单数据接口
 * 用于创建和更新健康记录
 */
export interface HealthRecordFormData {
  /** 关联奶牛ID */
  cow_id: string;
  
  /** 检查日期时间 */
  check_datetime: string;
  
  /** 体温 (°C) */
  temperature: number;
  
  /** 精神状态 */
  mental_state: MentalStateType;
  
  /** 食欲状态 */
  appetite: AppetiteType;
  
  /** 呼吸频率 (次/分) - 可选 */
  respiratory_rate?: number;
  
  /** 心率 (次/分) - 可选 */
  heart_rate?: number;
  
  /** 瘤胃蠕动频率 (次/2分钟) - 可选 */
  rumen_movement?: number;
  
  /** 粪便性状描述 - 可选 */
  fecal_condition?: string;
  
  /** 健康问题描述 - 可选 */
  health_issues?: string;
  
  /** 处理措施 - 可选 */
  treatment?: string;
  
  /** 检查人员ID */
  examiner_id: string;
  
  /** 备注 - 可选 */
  notes?: string;
}

/**
 * 健康记录查询过滤器
 */
export interface HealthRecordFilters {
  /** 按奶牛ID过滤 */
  cow_id?: string;
  
  /** 按日期范围过滤 - 开始日期 */
  start_date?: string;
  
  /** 按日期范围过滤 - 结束日期 */
  end_date?: string;
  
  /** 按检查人员过滤 */
  examiner_id?: string;
  
  /** 按精神状态过滤 */
  mental_state?: MentalStateType;
  
  /** 仅显示异常记录 (体温异常或有健康问题) */
  abnormal_only?: boolean;
}

/**
 * 健康记录统计数据
 */
export interface HealthStats {
  /** 总记录数 */
  total_records: number;
  
  /** 异常记录数 */
  abnormal_records: number;
  
  /** 平均体温 */
  avg_temperature: number;
  
  /** 最高体温 */
  max_temperature: number;
  
  /** 最低体温 */
  min_temperature: number;
  
  /** 最近一次检查日期 */
  last_check_date?: string;
}

/**
 * 健康记录详情 (含关联奶牛信息)
 */
export interface HealthRecordDetail extends HealthRecord {
  /** 关联的奶牛信息 */
  cow?: {
    id: string;
    cow_number: string;
    name?: string;
    breed: string;
  };
  
  /** 检查人员信息 */
  examiner?: {
    id: string;
    full_name: string;
    role: string;
  };
}

/**
 * 体温检查结果类型
 */
export type TemperatureStatus = 'normal' | 'low' | 'high' | 'fever';

/**
 * 判断体温状态
 * @param temperature - 体温值
 * @returns 体温状态
 */
export function getTemperatureStatus(temperature: number): TemperatureStatus {
  if (temperature < 37.5) return 'low';
  if (temperature >= 37.5 && temperature <= 39.5) return 'normal';
  if (temperature > 39.5 && temperature < 40.0) return 'high';
  return 'fever';
}

/**
 * 判断健康记录是否异常
 * @param record - 健康记录
 * @returns 是否异常
 * 
 * Reason: 集中判断逻辑，便于维护和测试
 */
export function isAbnormalHealth(record: Partial<HealthRecord>): boolean {
  // 体温异常
  if (record.temperature) {
    const tempStatus = getTemperatureStatus(record.temperature);
    if (tempStatus !== 'normal') return true;
  }
  
  // 精神状态异常
  if (record.mental_state && record.mental_state !== 'normal') return true;
  
  // 食欲异常
  if (record.appetite && record.appetite === 'poor') return true;
  
  // 有健康问题描述
  if (record.health_issues && record.health_issues.trim().length > 0) return true;
  
  return false;
}
