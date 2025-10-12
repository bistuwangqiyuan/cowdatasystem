/**
 * Cows Service
 * 
 * 奶牛数据服务层，封装所有奶牛相关的数据库操作。
 * 
 * @module services/cows.service
 */

import { supabase } from '@/lib/supabase';
import type { Cow, CowFormData, CowFilters } from '@/types/cow.types';

/**
 * 服务响应类型
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: any | null;
}

/**
 * 创建新奶牛
 * 
 * @param data - 奶牛表单数据
 * @returns {Promise<ServiceResponse<Cow>>} 创建的奶牛记录
 * 
 * @example
 * ```typescript
 * const result = await createCow({
 *   cow_number: 'CN001',
 *   name: '小花',
 *   breed: 'holstein',
 *   gender: 'female',
 *   birth_date: '2022-01-01',
 *   entry_date: '2022-01-05',
 * });
 * ```
 */
export async function createCow(
  data: CowFormData
): Promise<ServiceResponse<Cow>> {
  try {
    // 获取当前用户ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: '用户未登录' },
      };
    }

    // 插入数据
    const { data: cow, error } = await supabase
      .from('cows')
      .insert({
        ...data,
        status: data.status || 'active',
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[CowsService] Create error:', error);
      return { data: null, error };
    }

    console.log('[CowsService] Cow created:', cow);
    return { data: cow, error: null };
    
  } catch (error) {
    console.error('[CowsService] Create exception:', error);
    return { data: null, error };
  }
}

/**
 * 获取奶牛列表
 * 
 * @param filters - 可选的过滤条件
 * @returns {Promise<ServiceResponse<Cow[]>>} 奶牛列表
 * 
 * @example
 * ```typescript
 * // 获取所有奶牛
 * const allCows = await getCows();
 * 
 * // 获取特定品种的奶牛
 * const holsteinCows = await getCows({ breed: 'holstein' });
 * ```
 */
export async function getCows(
  filters?: CowFilters
): Promise<ServiceResponse<Cow[]>> {
  try {
    let query = supabase
      .from('cows')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // 应用过滤器
    if (filters?.breed) {
      query = query.eq('breed', filters.breed);
    }
    
    if (filters?.gender) {
      query = query.eq('gender', filters.gender);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.search) {
      query = query.or(
        `cow_number.ilike.%${filters.search}%,name.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[CowsService] GetCows error:', error);
      return { data: null, error };
    }

    console.log(`[CowsService] Found ${data?.length || 0} cows`);
    return { data, error: null };
    
  } catch (error) {
    console.error('[CowsService] GetCows exception:', error);
    return { data: null, error };
  }
}

/**
 * 根据ID获取单头奶牛
 * 
 * @param id - 奶牛ID
 * @returns {Promise<ServiceResponse<Cow>>} 奶牛记录
 */
export async function getCowById(id: string): Promise<ServiceResponse<Cow>> {
  try {
    const { data, error } = await supabase
      .from('cows')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('[CowsService] GetCowById error:', error);
      return { data: null, error };
    }

    console.log('[CowsService] Cow found:', data);
    return { data, error: null };
    
  } catch (error) {
    console.error('[CowsService] GetCowById exception:', error);
    return { data: null, error };
  }
}

/**
 * 根据编号获取单头奶牛
 * 
 * @param cowNumber - 奶牛编号
 * @returns {Promise<ServiceResponse<Cow>>} 奶牛记录
 */
export async function getCowByNumber(
  cowNumber: string
): Promise<ServiceResponse<Cow>> {
  try {
    const { data, error } = await supabase
      .from('cows')
      .select('*')
      .eq('cow_number', cowNumber)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('[CowsService] GetCowByNumber error:', error);
      return { data: null, error };
    }

    return { data, error: null };
    
  } catch (error) {
    console.error('[CowsService] GetCowByNumber exception:', error);
    return { data: null, error };
  }
}

/**
 * 更新奶牛信息
 * 
 * @param id - 奶牛ID
 * @param data - 要更新的数据
 * @returns {Promise<ServiceResponse<Cow>>} 更新后的奶牛记录
 */
export async function updateCow(
  id: string,
  data: Partial<CowFormData>
): Promise<ServiceResponse<Cow>> {
  try {
    // 获取当前用户ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: '用户未登录' },
      };
    }

    // 更新数据
    const { data: cow, error } = await supabase
      .from('cows')
      .update({
        ...data,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[CowsService] Update error:', error);
      return { data: null, error };
    }

    console.log('[CowsService] Cow updated:', cow);
    return { data: cow, error: null };
    
  } catch (error) {
    console.error('[CowsService] Update exception:', error);
    return { data: null, error };
  }
}

/**
 * 软删除奶牛
 * 
 * @param id - 奶牛ID
 * @returns {Promise<ServiceResponse<null>>} 删除结果
 */
export async function deleteCow(id: string): Promise<ServiceResponse<null>> {
  try {
    // 获取当前用户ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: '用户未登录' },
      };
    }

    // 软删除（设置 deleted_at 时间戳）
    const { error } = await supabase
      .from('cows')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id);

    if (error) {
      console.error('[CowsService] Delete error:', error);
      return { data: null, error };
    }

    console.log('[CowsService] Cow deleted (soft):', id);
    return { data: null, error: null };
    
  } catch (error) {
    console.error('[CowsService] Delete exception:', error);
    return { data: null, error };
  }
}

/**
 * 搜索奶牛
 * 
 * @param keyword - 搜索关键词（编号或名称）
 * @returns {Promise<ServiceResponse<Cow[]>>} 匹配的奶牛列表
 * 
 * @example
 * ```typescript
 * const results = await searchCows('CN');
 * ```
 */
export async function searchCows(
  keyword: string
): Promise<ServiceResponse<Cow[]>> {
  try {
    const { data, error } = await supabase
      .from('cows')
      .select('*')
      .or(`cow_number.ilike.%${keyword}%,name.ilike.%${keyword}%`)
      .is('deleted_at', null)
      .order('cow_number', { ascending: true })
      .limit(50);

    if (error) {
      console.error('[CowsService] Search error:', error);
      return { data: null, error };
    }

    console.log(`[CowsService] Search found ${data?.length || 0} cows`);
    return { data, error: null };
    
  } catch (error) {
    console.error('[CowsService] Search exception:', error);
    return { data: null, error };
  }
}

/**
 * 获取奶牛统计信息
 * 
 * @returns {Promise<ServiceResponse<any>>} 统计信息
 */
export async function getCowStats(): Promise<ServiceResponse<{
  total: number;
  active: number;
  male: number;
  female: number;
  by_breed: Record<string, number>;
}>> {
  try {
    // 获取所有活跃奶牛
    const { data: cows, error } = await supabase
      .from('cows')
      .select('id, status, gender, breed')
      .is('deleted_at', null);

    if (error) {
      console.error('[CowsService] GetStats error:', error);
      return { data: null, error };
    }

    // 计算统计信息
    const stats = {
      total: cows?.length || 0,
      active: cows?.filter(c => c.status === 'active').length || 0,
      male: cows?.filter(c => c.gender === 'male').length || 0,
      female: cows?.filter(c => c.gender === 'female').length || 0,
      by_breed: {} as Record<string, number>,
    };

    // 按品种统计
    cows?.forEach(cow => {
      stats.by_breed[cow.breed] = (stats.by_breed[cow.breed] || 0) + 1;
    });

    console.log('[CowsService] Stats:', stats);
    return { data: stats, error: null };
    
  } catch (error) {
    console.error('[CowsService] GetStats exception:', error);
    return { data: null, error };
  }
}

