/**
 * 产奶记录类型定义
 * 用于奶牛每次挤奶的产量和质量数据
 * 
 * @module types/milk.types
 * @see supabase/migrations/001_initial_schema.sql - milk_records 表定义
 */

/**
 * 挤奶时段枚举
 */
export type MilkingSessionType = 'morning' | 'afternoon' | 'evening';

/**
 * 产奶记录接口
 * 映射数据库 milk_records 表
 */
export interface MilkRecord {
  /** 主键 */
  id: string;
  
  /** 关联奶牛ID */
  cow_id: string;
  
  /** 记录日期时间 */
  recorded_datetime: string;
  
  /** 挤奶时段 */
  milking_session: MilkingSessionType;
  
  /** 产奶量 (L) - 必须 > 0 */
  milk_yield: number;
  
  /** 脂肪率 (%) - 正常范围: 3.0-5.0 */
  fat_percentage?: number;
  
  /** 蛋白质率 (%) - 正常范围: 2.8-3.8 */
  protein_percentage?: number;
  
  /** 乳糖含量 (%) - 正常范围: 4.5-5.5 */
  lactose_percentage?: number;
  
  /** 体细胞数 (万个/mL) - 正常范围: < 20 */
  somatic_cell_count?: number;
  
  /** 挤奶人员ID */
  milker_id: string;
  
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
 * 产奶记录表单数据接口
 * 用于创建和更新产奶记录
 */
export interface MilkRecordFormData {
  /** 关联奶牛ID */
  cow_id: string;
  
  /** 记录日期时间 */
  recorded_datetime: string;
  
  /** 挤奶时段 */
  milking_session: MilkingSessionType;
  
  /** 产奶量 (L) */
  milk_yield: number;
  
  /** 脂肪率 (%) - 可选 */
  fat_percentage?: number;
  
  /** 蛋白质率 (%) - 可选 */
  protein_percentage?: number;
  
  /** 乳糖含量 (%) - 可选 */
  lactose_percentage?: number;
  
  /** 体细胞数 (万个/mL) - 可选 */
  somatic_cell_count?: number;
  
  /** 挤奶人员ID */
  milker_id: string;
  
  /** 备注 - 可选 */
  notes?: string;
}

/**
 * 产奶记录查询过滤器
 */
export interface MilkRecordFilters {
  /** 按奶牛ID过滤 */
  cow_id?: string;
  
  /** 按日期范围过滤 - 开始日期 */
  start_date?: string;
  
  /** 按日期范围过滤 - 结束日期 */
  end_date?: string;
  
  /** 按挤奶时段过滤 */
  milking_session?: MilkingSessionType;
  
  /** 按挤奶人员过滤 */
  milker_id?: string;
  
  /** 仅显示异常记录 (体细胞数超标) */
  abnormal_only?: boolean;
}

/**
 * 产奶统计数据
 */
export interface MilkStats {
  /** 总记录数 */
  total_records: number;
  
  /** 总产奶量 (L) */
  total_yield: number;
  
  /** 平均产奶量 (L) */
  avg_yield: number;
  
  /** 最高产奶量 (L) */
  max_yield: number;
  
  /** 平均脂肪率 (%) */
  avg_fat_percentage?: number;
  
  /** 平均蛋白质率 (%) */
  avg_protein_percentage?: number;
  
  /** 平均体细胞数 (万个/mL) */
  avg_somatic_cell_count?: number;
  
  /** 统计日期范围 */
  date_range?: {
    start_date: string;
    end_date: string;
  };
}

/**
 * 产奶记录详情 (含关联奶牛信息)
 */
export interface MilkRecordDetail extends MilkRecord {
  /** 关联的奶牛信息 */
  cow?: {
    id: string;
    cow_number: string;
    name?: string;
    breed: string;
  };
  
  /** 挤奶人员信息 */
  milker?: {
    id: string;
    full_name: string;
    role: string;
  };
}

/**
 * 产奶趋势数据点
 * 用于图表展示
 */
export interface MilkTrendDataPoint {
  /** 日期 */
  date: string;
  
  /** 产奶量 (L) */
  yield: number;
  
  /** 脂肪率 (%) - 可选 */
  fat_percentage?: number;
  
  /** 蛋白质率 (%) - 可选 */
  protein_percentage?: number;
}

/**
 * 挤奶时段标签映射
 */
export const MilkingSessionLabels: Record<MilkingSessionType, string> = {
  morning: '早班',
  afternoon: '午班',
  evening: '晚班',
};

/**
 * 判断体细胞数是否异常
 * @param count - 体细胞数 (万个/mL)
 * @returns 是否异常
 * 
 * Reason: 体细胞数是判断乳房炎的重要指标，>20万/mL为异常
 */
export function isAbnormalSomaticCellCount(count?: number): boolean {
  if (!count) return false;
  return count > 20;
}

/**
 * 判断产奶质量是否合格
 * @param record - 产奶记录
 * @returns 是否合格
 * 
 * Reason: 综合判断多个质量指标
 */
export function isMilkQualityGood(record: Partial<MilkRecord>): boolean {
  // 检查体细胞数
  if (record.somatic_cell_count && isAbnormalSomaticCellCount(record.somatic_cell_count)) {
    return false;
  }
  
  // 检查脂肪率
  if (record.fat_percentage) {
    if (record.fat_percentage < 3.0 || record.fat_percentage > 5.0) {
      return false;
    }
  }
  
  // 检查蛋白质率
  if (record.protein_percentage) {
    if (record.protein_percentage < 2.8 || record.protein_percentage > 3.8) {
      return false;
    }
  }
  
  // 检查乳糖含量
  if (record.lactose_percentage) {
    if (record.lactose_percentage < 4.5 || record.lactose_percentage > 5.5) {
      return false;
    }
  }
  
  return true;
}

/**
 * 计算日产奶量
 * @param records - 一天内的所有产奶记录
 * @returns 总产奶量 (L)
 */
export function calculateDailyYield(records: MilkRecord[]): number {
  return records.reduce((sum, record) => sum + record.milk_yield, 0);
}
