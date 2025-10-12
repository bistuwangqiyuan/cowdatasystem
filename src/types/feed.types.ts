/**
 * 饲料管理类型定义
 * 
 * @module types/feed.types
 */

/**
 * 饲料配方接口
 */
export interface FeedFormula {
  id: string;
  formula_name: string;
  formula_code: string;
  target_group: string;
  ingredients: any;
  total_cost_per_kg?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at?: string;
}

/**
 * 投喂记录接口
 */
export interface FeedingRecord {
  id: string;
  cow_id: string;
  formula_id: string;
  feeding_datetime: string;
  quantity_kg: number;
  cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at?: string;
}

/**
 * 饲料配方表单数据
 */
export interface FeedFormulaFormData {
  formula_name: string;
  formula_code: string;
  target_group: string;
  ingredients: any;
  total_cost_per_kg?: number;
  notes?: string;
}

/**
 * 投喂记录表单数据
 */
export interface FeedingFormData {
  cow_id: string;
  formula_id: string;
  feeding_datetime: string;
  quantity_kg: number;
  notes?: string;
}

/**
 * 饲料查询过滤器
 */
export interface FeedFilters {
  cow_id?: string;
  formula_id?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * 饲料统计数据
 */
export interface FeedStats {
  total_feedings: number;
  total_quantity_kg: number;
  total_cost: number;
  avg_quantity_per_feeding: number;
}

