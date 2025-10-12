/**
 * Cow Types and Interfaces
 * 
 * 奶牛相关的类型定义和接口。
 * 
 * @module types/cow.types
 */

/**
 * 奶牛品种类型
 */
export type BreedType = 'holstein' | 'jersey' | 'other';

/**
 * 性别类型
 */
export type GenderType = 'male' | 'female';

/**
 * 奶牛状态
 */
export type CowStatus = 'active' | 'culled' | 'sold' | 'dead';

/**
 * 奶牛完整信息接口（映射数据库表）
 */
export interface Cow {
  id: string;
  cow_number: string;
  name: string | null;
  breed: BreedType;
  gender: GenderType;
  birth_date: string;
  sire_id: string | null;
  dam_id: string | null;
  status: CowStatus;
  entry_date: string;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  deleted_at: string | null;
}

/**
 * 奶牛表单数据接口（用于创建/编辑）
 */
export interface CowFormData {
  cow_number: string;
  name?: string;
  breed: BreedType;
  gender: GenderType;
  birth_date: string;
  entry_date: string;
  sire_id?: string;
  dam_id?: string;
  status?: CowStatus;
  photo_url?: string;
  notes?: string;
}

/**
 * 奶牛查询过滤器
 */
export interface CowFilters {
  breed?: BreedType;
  gender?: GenderType;
  status?: CowStatus;
  search?: string;
}

/**
 * 奶牛列表项（简化版，用于列表展示）
 */
export interface CowListItem {
  id: string;
  cow_number: string;
  name: string | null;
  breed: BreedType;
  gender: GenderType;
  birth_date: string;
  status: CowStatus;
  age_months: number; // 计算得出的月龄
}

/**
 * 奶牛详情（包含关联数据）
 */
export interface CowDetail extends Cow {
  sire?: Cow | null; // 父牛信息
  dam?: Cow | null; // 母牛信息
  offspring_count?: number; // 后代数量
  latest_health_status?: string; // 最新健康状态
  latest_milk_amount?: number; // 最新产奶量
}

/**
 * 品种中文名称映射
 */
export const BREED_NAMES: Record<BreedType, string> = {
  holstein: '荷斯坦牛',
  jersey: '娟姗牛',
  other: '其他',
};

/**
 * 性别中文名称映射
 */
export const GENDER_NAMES: Record<GenderType, string> = {
  male: '公',
  female: '母',
};

/**
 * 状态中文名称映射
 */
export const STATUS_NAMES: Record<CowStatus, string> = {
  active: '在养',
  culled: '淘汰',
  sold: '售出',
  dead: '死亡',
};

/**
 * 状态颜色映射（Tailwind CSS类）
 */
export const STATUS_COLORS: Record<CowStatus, string> = {
  active: 'bg-green-100 text-green-800',
  culled: 'bg-gray-100 text-gray-800',
  sold: 'bg-blue-100 text-blue-800',
  dead: 'bg-red-100 text-red-800',
};

/**
 * 计算奶牛月龄
 * 
 * @param birthDate - 出生日期（YYYY-MM-DD）
 * @returns {number} 月龄
 */
export function calculateAgeMonths(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  
  return years * 12 + months;
}

/**
 * 格式化奶牛年龄
 * 
 * @param birthDate - 出生日期（YYYY-MM-DD）
 * @returns {string} 格式化的年龄（如"2岁3个月"）
 */
export function formatAge(birthDate: string): string {
  const ageMonths = calculateAgeMonths(birthDate);
  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;
  
  if (years > 0 && months > 0) {
    return `${years}岁${months}个月`;
  } else if (years > 0) {
    return `${years}岁`;
  } else {
    return `${months}个月`;
  }
}

/**
 * 验证奶牛编号是否有效
 * 
 * @param cowNumber - 奶牛编号
 * @returns {boolean} 是否有效
 */
export function isValidCowNumber(cowNumber: string): boolean {
  return /^[A-Z0-9]{3,50}$/.test(cowNumber);
}

