/**
 * Milk Records Service
 * 
 * 产奶记录数据服务层。
 * 
 * @module services/milk.service
 */

import { supabase } from '@/lib/supabase';
import type { MilkRecord, MilkRecordFormData, MilkStats } from '@/types/milk.types';
import type { ServiceResponse } from './cows.service';

/**
 * 创建产奶记录
 */
export async function createMilkRecord(
  data: MilkRecordFormData
): Promise<ServiceResponse<MilkRecord>> {
  try {
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

    if (error) {
      console.error('[MilkService] Create error:', error);
      return { data: null, error };
    }

    console.log('[MilkService] Milk record created:', record);
    return { data: record, error: null };
    
  } catch (error) {
    console.error('[MilkService] Create exception:', error);
    return { data: null, error };
  }
}

/**
 * 获取产奶记录列表
 */
export async function getMilkRecords(
  cowId?: string
): Promise<ServiceResponse<MilkRecord[]>> {
  try {
    let query = supabase
      .from('milk_records')
      .select('*')
      .is('deleted_at', null)
      .order('recorded_datetime', { ascending: false });

    if (cowId) {
      query = query.eq('cow_id', cowId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[MilkService] GetRecords error:', error);
      return { data: null, error };
    }

    return { data, error: null };
    
  } catch (error) {
    console.error('[MilkService] GetRecords exception:', error);
    return { data: null, error };
  }
}

/**
 * 获取单条产奶记录
 */
export async function getMilkRecordById(
  id: string
): Promise<ServiceResponse<MilkRecord>> {
  try {
    const { data, error } = await supabase
      .from('milk_records')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('[MilkService] GetById error:', error);
      return { data: null, error };
    }

    return { data, error: null };
    
  } catch (error) {
    console.error('[MilkService] GetById exception:', error);
    return { data: null, error };
  }
}

/**
 * 更新产奶记录
 */
export async function updateMilkRecord(
  id: string,
  data: Partial<MilkRecordFormData>
): Promise<ServiceResponse<MilkRecord>> {
  try {
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

    if (error) {
      console.error('[MilkService] Update error:', error);
      return { data: null, error };
    }

    return { data: record, error: null };
    
  } catch (error) {
    console.error('[MilkService] Update exception:', error);
    return { data: null, error };
  }
}

/**
 * 删除产奶记录（软删除）
 */
export async function deleteMilkRecord(
  id: string
): Promise<ServiceResponse<null>> {
  try {
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

    if (error) {
      console.error('[MilkService] Delete error:', error);
      return { data: null, error };
    }

    return { data: null, error: null };
    
  } catch (error) {
    console.error('[MilkService] Delete exception:', error);
    return { data: null, error };
  }
}

/**
 * 获取产奶统计数据
 */
export async function getMilkStats(
  cowId: string,
  startDate?: string,
  endDate?: string
): Promise<ServiceResponse<MilkStats>> {
  try {
    let query = supabase
      .from('milk_records')
      .select('amount, fat_rate, protein_rate')
      .eq('cow_id', cowId)
      .is('deleted_at', null);

    if (startDate) {
      query = query.gte('recorded_datetime', startDate);
    }
    if (endDate) {
      query = query.lte('recorded_datetime', endDate);
    }

    const { data: records, error } = await query;

    if (error) {
      console.error('[MilkService] GetStats error:', error);
      return { data: null, error };
    }

    if (!records || records.length === 0) {
      return {
        data: {
          total_records: 0,
          total_amount: 0,
          avg_amount: 0,
          max_amount: 0,
          min_amount: 0,
          avg_fat_rate: 0,
          avg_protein_rate: 0,
        },
        error: null,
      };
    }

    const amounts = records.map(r => r.amount);
    const fatRates = records.filter(r => r.fat_rate !== null).map(r => r.fat_rate!);
    const proteinRates = records.filter(r => r.protein_rate !== null).map(r => r.protein_rate!);

    const stats: MilkStats = {
      total_records: records.length,
      total_amount: amounts.reduce((sum, a) => sum + a, 0),
      avg_amount: amounts.reduce((sum, a) => sum + a, 0) / amounts.length,
      max_amount: Math.max(...amounts),
      min_amount: Math.min(...amounts),
      avg_fat_rate: fatRates.length > 0 
        ? fatRates.reduce((sum, r) => sum + r, 0) / fatRates.length 
        : 0,
      avg_protein_rate: proteinRates.length > 0
        ? proteinRates.reduce((sum, r) => sum + r, 0) / proteinRates.length
        : 0,
    };

    return { data: stats, error: null };
    
  } catch (error) {
    console.error('[MilkService] GetStats exception:', error);
    return { data: null, error };
  }
}

