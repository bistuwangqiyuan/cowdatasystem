/**
 * 饲料管理服务层
 * 
 * @module services/feed.service
 */

import { supabase } from '@/lib/supabase';
import type { 
  FeedFormula,
  FeedingRecord, 
  FeedFormulaFormData,
  FeedingFormData,
  FeedFilters 
} from '@/types/feed.types';

// 饲料配方相关
export async function createFeedFormula(data: FeedFormulaFormData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  const { data: formula, error } = await supabase
    .from('feed_formulas')
    .insert({
      ...data,
      is_active: true,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  return { data: formula, error };
}

export async function getFeedFormulas() {
  return await supabase
    .from('feed_formulas')
    .select('*')
    .is('deleted_at', null)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
}

export async function getFeedFormulaById(id: string) {
  return await supabase
    .from('feed_formulas')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
}

// 投喂记录相关
export async function createFeedingRecord(data: FeedingFormData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  const { data: record, error } = await supabase
    .from('feeding_records')
    .insert({
      ...data,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  return { data: record, error };
}

export async function getFeedingRecords(filters?: FeedFilters) {
  let query = supabase
    .from('feeding_records')
    .select('*')
    .is('deleted_at', null)
    .order('feeding_datetime', { ascending: false });

  if (filters?.cow_id) query = query.eq('cow_id', filters.cow_id);
  if (filters?.formula_id) query = query.eq('formula_id', filters.formula_id);
  if (filters?.start_date) query = query.gte('feeding_datetime', filters.start_date);
  if (filters?.end_date) query = query.lte('feeding_datetime', filters.end_date);

  return await query;
}

export async function getFeedingRecordById(id: string) {
  return await supabase
    .from('feeding_records')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
}

