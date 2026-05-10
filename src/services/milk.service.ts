/**
 * 产奶记录服务层
 * 封装所有产奶记录相关的数据库操作
 * 
 * @module services/milk.service
 */

import { supabase } from '@/lib/supabase';
import type { 
  MilkRecord, 
  MilkRecordFormData, 
  MilkRecordFilters,
  MilkStats,
  MilkRecordDetail,
  MilkTrendDataPoint
} from '@/types/milk.types';
import { isAbnormalSomaticCellCount } from '@/types/milk.types';

/**
 * 创建产奶记录
 * @param data - 产奶记录表单数据
 * @returns Supabase 响应
 * 
 * @example
 * const result = await createMilkRecord({
 *   cow_id: 'uuid',
 *   recorded_datetime: '2025-10-12T06:00:00',
 *   milking_session: 'morning',
 *   milk_yield: 25.5,
 *   fat_percentage: 3.8,
 *   protein_percentage: 3.2,
 *   milker_id: 'user-uuid'
 * });
 */
export async function createMilkRecord(data: MilkRecordFormData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  const { data: record, error } = await supabase
    .from('milk_records')
    .insert({
      ...data,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  return { data: record, error };
}

/**
 * 获取产奶记录列表
 * @param filters - 查询过滤器
 * @returns Supabase 响应
 * 
 * @example
 * // 获取指定奶牛的产奶记录
 * const result = await getMilkRecords({ cow_id: 'uuid' });
 * 
 * // 获取日期范围内的早班记录
 * const result = await getMilkRecords({
 *   start_date: '2025-10-01',
 *   end_date: '2025-10-12',
 *   milking_session: 'morning'
 * });
 */
export async function getMilkRecords(filters?: MilkRecordFilters) {
  try {
    let query = supabase
      .from('milk_records')
      .select(`
        *,
        cow:cows!inner(cow_number, name)
      `)
      .is('deleted_at', null)
      .order('recorded_datetime', { ascending: false });

    if (filters?.cow_id) {
      query = query.eq('cow_id', filters.cow_id);
    }

    if (filters?.start_date) {
      query = query.gte('recorded_datetime', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('recorded_datetime', filters.end_date);
    }

    if (filters?.session) {
      query = query.eq('session', filters.session);
    }

    if (filters?.milker_id) {
      query = query.eq('milker_id', filters.milker_id);
    }

    const { data, error } = await query;

    if (filters?.abnormal_only && data) {
      const abnormalRecords = data.filter(record =>
        isAbnormalSomaticCellCount(record.somatic_cell_count)
      );
      return { data: abnormalRecords, error };
    }

    return { data, error };
  } catch (error) {
    console.error('[MilkService] getMilkRecords exception:', error);
    return { data: null, error };
  }
}

/**
 * 根据ID获取产奶记录详情 (含关联信息)
 * @param id - 产奶记录ID
 * @returns Supabase 响应
 */
export async function getMilkRecordById(id: string) {
  try {
    const { data, error } = await supabase
      .from('milk_records')
      .select(`
        *,
        cow:cows!inner(id, cow_number, name, breed),
        milker:users!milk_records_milker_id_fkey(id, full_name, role)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single<MilkRecordDetail>();

    return { data, error };
  } catch (error) {
    console.error('[MilkService] getMilkRecordById exception:', error);
    return { data: null, error };
  }
}

/**
 * 更新产奶记录
 * @param id - 产奶记录ID
 * @param data - 更新的数据
 * @returns Supabase 响应
 */
export async function updateMilkRecord(id: string, data: Partial<MilkRecordFormData>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  const { data: record, error } = await supabase
    .from('milk_records')
    .update({
      ...data,
      updated_by: user.id,
    })
    .eq('id', id)
    .select()
    .single();

  return { data: record, error };
}

/**
 * 删除产奶记录 (软删除)
 * @param id - 产奶记录ID
 * @returns Supabase 响应
 */
export async function deleteMilkRecord(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  const { error } = await supabase
    .from('milk_records')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', id);

  return { error };
}

/**
 * 获取产奶统计数据
 * @param cowId - 奶牛ID
 * @param startDate - 开始日期 (可选)
 * @param endDate - 结束日期 (可选)
 * @returns 产奶统计数据
 * 
 * @example
 * // 获取指定奶牛本月的产奶统计
 * const stats = await getMilkStats('cow-uuid', '2025-10-01', '2025-10-12');
 */
export async function getMilkStats(
  cowId: string,
  startDate?: string,
  endDate?: string
): Promise<MilkStats> {
  const empty: MilkStats = {
    total_records: 0,
    total_yield: 0,
    avg_yield: 0,
    max_yield: 0,
  };

  let data: any[] | null = null;
  let error: any = null;

  try {
    let query = supabase
      .from('milk_records')
      .select('*')
      .eq('cow_id', cowId)
      .is('deleted_at', null);

    if (startDate) query = query.gte('recorded_datetime', startDate);
    if (endDate) query = query.lte('recorded_datetime', endDate);

    const result = await query;
    data = result.data;
    error = result.error;
  } catch (e) {
    console.error('[MilkService] getMilkStats exception:', e);
    return empty;
  }

  if (error || !data || data.length === 0) {
    return empty;
  }

  // 计算统计数据
  const totalYield = data.reduce((sum, r) => sum + r.amount, 0);
  const yields = data.map(r => r.amount);
  
  const stats: MilkStats = {
    total_records: data.length,
    total_yield: totalYield,
    avg_yield: totalYield / data.length,
    max_yield: Math.max(...yields),
  };

  // 计算平均质量指标
  const recordsWithFat = data.filter(r => r.fat_rate != null);
  if (recordsWithFat.length > 0) {
    stats.avg_fat_percentage = 
      recordsWithFat.reduce((sum, r) => sum + (r.fat_rate || 0), 0) / recordsWithFat.length;
  }

  const recordsWithProtein = data.filter(r => r.protein_rate != null);
  if (recordsWithProtein.length > 0) {
    stats.avg_protein_percentage = 
      recordsWithProtein.reduce((sum, r) => sum + (r.protein_rate || 0), 0) / recordsWithProtein.length;
  }

  const recordsWithSCC = data.filter(r => r.somatic_cell_count != null);
  if (recordsWithSCC.length > 0) {
    stats.avg_somatic_cell_count = 
      recordsWithSCC.reduce((sum, r) => sum + (r.somatic_cell_count || 0), 0) / recordsWithSCC.length;
  }

  // 统计日期范围
  if (startDate && endDate) {
    stats.date_range = { start_date: startDate, end_date: endDate };
  }

  return stats;
}

/**
 * 获取产奶趋势数据 (用于图表展示)
 * @param cowId - 奶牛ID
 * @param days - 天数 (默认30天)
 * @returns 产奶趋势数据点数组
 * 
 * @example
 * // 获取最近30天的产奶趋势
 * const trend = await getMilkTrend('cow-uuid', 30);
 */
export async function getMilkTrend(cowId: string, days: number = 30): Promise<MilkTrendDataPoint[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let data: any[] | null = null;
  let error: any = null;

  try {
    const result = await supabase
      .from('milk_records')
      .select('recorded_datetime, amount, fat_rate, protein_rate')
      .eq('cow_id', cowId)
      .is('deleted_at', null)
      .gte('recorded_datetime', startDate.toISOString())
      .lte('recorded_datetime', endDate.toISOString())
      .order('recorded_datetime', { ascending: true });
    data = result.data;
    error = result.error;
  } catch (e) {
    console.error('[MilkService] getMilkTrend exception:', e);
    return [];
  }

  if (error || !data) {
    return [];
  }

  // 按日期分组并计算每日总产奶量
  const dailyData = new Map<string, MilkTrendDataPoint>();
  
  data.forEach(record => {
    const date = record.recorded_datetime.split('T')[0]; // 提取日期部分
    
    if (dailyData.has(date)) {
      const existing = dailyData.get(date)!;
      existing.yield += record.amount;
      // 计算平均值
      if (record.fat_rate) {
        existing.fat_percentage = 
          ((existing.fat_percentage || 0) + record.fat_rate) / 2;
      }
      if (record.protein_rate) {
        existing.protein_percentage = 
          ((existing.protein_percentage || 0) + record.protein_rate) / 2;
      }
    } else {
      dailyData.set(date, {
        date,
        yield: record.amount,
        fat_percentage: record.fat_rate || undefined,
        protein_percentage: record.protein_rate || undefined,
      });
    }
  });

  return Array.from(dailyData.values());
}

/**
 * 获取指定奶牛的最近N条产奶记录
 * @param cowId - 奶牛ID
 * @param limit - 记录数量
 * @returns Supabase 响应
 */
export async function getRecentMilkRecords(cowId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('milk_records')
      .select('*')
      .eq('cow_id', cowId)
      .is('deleted_at', null)
      .order('recorded_datetime', { ascending: false })
      .limit(limit);

    return { data, error };
  } catch (error) {
    console.error('[MilkService] getRecentMilkRecords exception:', error);
    return { data: null, error };
  }
}
