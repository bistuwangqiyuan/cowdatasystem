/**
 * 繁殖记录服务层
 * 
 * @module services/breeding.service
 */

import { supabase } from '@/lib/supabase';
import type { 
  BreedingRecord, 
  BreedingFormData,
  BreedingFilters 
} from '@/types/breeding.types';

export async function createBreedingRecord(data: BreedingFormData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  const { data: record, error } = await supabase
    .from('breeding_records')
    .insert({
      ...data,
      status: 'planned',
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  return { data: record, error };
}

export async function getBreedingRecords(filters?: BreedingFilters) {
  let query = supabase
    .from('breeding_records')
    .select('*')
    .is('deleted_at', null)
    .order('breeding_date', { ascending: false });

  if (filters?.cow_id) query = query.eq('cow_id', filters.cow_id);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.breeding_method) query = query.eq('breeding_method', filters.breeding_method);
  if (filters?.start_date) query = query.gte('breeding_date', filters.start_date);
  if (filters?.end_date) query = query.lte('breeding_date', filters.end_date);

  return await query;
}

export async function getBreedingRecordById(id: string) {
  return await supabase
    .from('breeding_records')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();
}

export async function updateBreedingRecord(id: string, data: Partial<BreedingFormData>) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  return await supabase
    .from('breeding_records')
    .update({
      ...data,
      updated_by: user.id,
    })
    .eq('id', id)
    .select()
    .single();
}

export async function deleteBreedingRecord(id: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: '用户未登录' } };
  }
  
  return await supabase
    .from('breeding_records')
    .update({
      deleted_at: new Date().toISOString(),
      updated_by: user.id,
    })
    .eq('id', id);
}

