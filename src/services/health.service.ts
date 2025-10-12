/**
 * Health Records Service
 * 
 * 健康记录数据服务层。
 * 
 * @module services/health.service
 */

import { supabase } from '@/lib/supabase';
import type { HealthRecord, HealthRecordFormData } from '@/types/health.types';
import type { ServiceResponse } from './cows.service';

/**
 * 创建健康记录
 */
export async function createHealthRecord(
  data: HealthRecordFormData
): Promise<ServiceResponse<HealthRecord>> {
  try {
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

    if (error) {
      console.error('[HealthService] Create error:', error);
      return { data: null, error };
    }

    console.log('[HealthService] Health record created:', record);
    return { data: record, error: null };
    
  } catch (error) {
    console.error('[HealthService] Create exception:', error);
    return { data: null, error };
  }
}

/**
 * 获取健康记录列表
 */
export async function getHealthRecords(
  cowId?: string
): Promise<ServiceResponse<HealthRecord[]>> {
  try {
    let query = supabase
      .from('health_records')
      .select('*')
      .is('deleted_at', null)
      .order('recorded_date', { ascending: false });

    if (cowId) {
      query = query.eq('cow_id', cowId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[HealthService] GetRecords error:', error);
      return { data: null, error };
    }

    return { data, error: null };
    
  } catch (error) {
    console.error('[HealthService] GetRecords exception:', error);
    return { data: null, error };
  }
}

/**
 * 获取单条健康记录
 */
export async function getHealthRecordById(
  id: string
): Promise<ServiceResponse<HealthRecord>> {
  try {
    const { data, error } = await supabase
      .from('health_records')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('[HealthService] GetById error:', error);
      return { data: null, error };
    }

    return { data, error: null };
    
  } catch (error) {
    console.error('[HealthService] GetById exception:', error);
    return { data: null, error };
  }
}

/**
 * 更新健康记录
 */
export async function updateHealthRecord(
  id: string,
  data: Partial<HealthRecordFormData>
): Promise<ServiceResponse<HealthRecord>> {
  try {
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

    if (error) {
      console.error('[HealthService] Update error:', error);
      return { data: null, error };
    }

    return { data: record, error: null };
    
  } catch (error) {
    console.error('[HealthService] Update exception:', error);
    return { data: null, error };
  }
}

/**
 * 删除健康记录（软删除）
 */
export async function deleteHealthRecord(
  id: string
): Promise<ServiceResponse<null>> {
  try {
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

    if (error) {
      console.error('[HealthService] Delete error:', error);
      return { data: null, error };
    }

    return { data: null, error: null };
    
  } catch (error) {
    console.error('[HealthService] Delete exception:', error);
    return { data: null, error };
  }
}

