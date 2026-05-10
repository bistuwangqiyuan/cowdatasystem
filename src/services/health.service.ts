/**
 * 健康记录服务层
 * 封装所有健康记录相关的数据库操作
 * 
 * @module services/health.service
 */

import { supabase } from '@/lib/supabase';
import type { 
  HealthRecord, 
  HealthRecordFormData, 
  HealthRecordFilters,
  HealthStats,
  HealthRecordDetail
} from '@/types/health.types';
import { isAbnormalHealth } from '@/types/health.types';

/**
 * 创建健康记录
 * @param data - 健康记录表单数据
 * @returns Supabase 响应
 * 
 * @example
 * const result = await createHealthRecord({
 *   cow_id: 'uuid',
 *   check_datetime: '2025-10-12T10:00:00',
 *   temperature: 38.5,
 *   mental_state: 'normal',
 *   appetite: 'good',
 *   examiner_id: 'user-uuid'
 * });
 */
export async function createHealthRecord(data: HealthRecordFormData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  const { data: record, error } = await supabase
    .from('health_records')
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
 * 获取健康记录列表
 * @param filters - 查询过滤器
 * @returns Supabase 响应
 * 
 * @example
 * // 获取指定奶牛的健康记录
 * const result = await getHealthRecords({ cow_id: 'uuid' });
 * 
 * // 获取日期范围内的异常记录
 * const result = await getHealthRecords({
 *   start_date: '2025-10-01',
 *   end_date: '2025-10-12',
 *   abnormal_only: true
 * });
 */
export async function getHealthRecords(filters?: HealthRecordFilters) {
  try {
    let query = supabase
      .from('health_records')
      .select('*')
      .is('deleted_at', null)
      .order('check_datetime', { ascending: false });

    if (filters?.cow_id) {
      query = query.eq('cow_id', filters.cow_id);
    }

    if (filters?.start_date) {
      query = query.gte('check_datetime', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('check_datetime', filters.end_date);
    }

    if (filters?.examiner_id) {
      query = query.eq('examiner_id', filters.examiner_id);
    }

    if (filters?.mental_state) {
      query = query.eq('mental_state', filters.mental_state);
    }

    const { data, error } = await query;

    if (filters?.abnormal_only && data) {
      const abnormalRecords = data.filter(record => isAbnormalHealth(record));
      return { data: abnormalRecords, error };
    }

    return { data, error };
  } catch (error) {
    console.error('[HealthService] getHealthRecords exception:', error);
    return { data: null, error };
  }
}

/**
 * 根据ID获取健康记录详情 (含关联信息)
 * @param id - 健康记录ID
 * @returns Supabase 响应
 */
export async function getHealthRecordById(id: string) {
  try {
    const { data, error } = await supabase
      .from('health_records')
      .select(`
        *,
        cow:cows!inner(id, cow_number, name, breed),
        examiner:users!health_records_examiner_id_fkey(id, full_name, role)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single<HealthRecordDetail>();

    return { data, error };
  } catch (error) {
    console.error('[HealthService] getHealthRecordById exception:', error);
    return { data: null, error };
  }
}

/**
 * 更新健康记录
 * @param id - 健康记录ID
 * @param data - 更新的数据
 * @returns Supabase 响应
 */
export async function updateHealthRecord(id: string, data: Partial<HealthRecordFormData>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  const { data: record, error } = await supabase
    .from('health_records')
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
 * 删除健康记录 (软删除)
 * @param id - 健康记录ID
 * @returns Supabase 响应
 */
export async function deleteHealthRecord(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  const { error } = await supabase
    .from('health_records')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', id);

  return { error };
}

/**
 * 获取健康统计数据
 * @param cowId - 奶牛ID
 * @param startDate - 开始日期 (可选)
 * @param endDate - 结束日期 (可选)
 * @returns 健康统计数据
 * 
 * @example
 * // 获取指定奶牛的健康统计
 * const stats = await getHealthStats('cow-uuid', '2025-10-01', '2025-10-12');
 */
export async function getHealthStats(
  cowId: string,
  startDate?: string,
  endDate?: string
): Promise<HealthStats> {
  const empty: HealthStats = {
    total_records: 0,
    abnormal_records: 0,
    avg_temperature: 0,
    max_temperature: 0,
    min_temperature: 0,
  };

  try {
    let query = supabase
      .from('health_records')
      .select('*')
      .eq('cow_id', cowId)
      .is('deleted_at', null);

    if (startDate) query = query.gte('check_datetime', startDate);
    if (endDate) query = query.lte('check_datetime', endDate);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return empty;
    }

    const temperatures = data.map(r => r.temperature);
    const abnormalRecords = data.filter(r => isAbnormalHealth(r));

    const stats: HealthStats = {
      total_records: data.length,
      abnormal_records: abnormalRecords.length,
      avg_temperature: temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length,
      max_temperature: Math.max(...temperatures),
      min_temperature: Math.min(...temperatures),
    };

    if (data.length > 0) {
      stats.last_check_date = data[0].check_datetime;
    }

    return stats;
  } catch (error) {
    console.error('[HealthService] getHealthStats exception:', error);
    return empty;
  }
}

/**
 * 获取指定奶牛的最近N条健康记录
 * @param cowId - 奶牛ID
 * @param limit - 记录数量
 * @returns Supabase 响应
 */
export async function getRecentHealthRecords(cowId: string, limit: number = 7) {
  try {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('cow_id', cowId)
      .is('deleted_at', null)
      .order('check_datetime', { ascending: false })
      .limit(limit);

    return { data, error };
  } catch (error) {
    console.error('[HealthService] getRecentHealthRecords exception:', error);
    return { data: null, error };
  }
}
