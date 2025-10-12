/**
 * Supabase Realtime Utilities
 * 
 * 实时数据同步工具，封装Supabase Realtime订阅逻辑。
 * 
 * @module lib/realtime
 */

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * 订阅回调函数类型
 */
export type RealtimeCallback = (payload: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
  errors: any;
}) => void;

/**
 * 订阅奶牛表变更
 * 
 * @param callback - 数据变更时的回调函数
 * @returns {RealtimeChannel} Realtime频道实例
 * 
 * @example
 * ```typescript
 * const channel = subscribeToCows((payload) => {
 *   console.log('Cow updated:', payload.new);
 *   // 更新UI
 * });
 * 
 * // 取消订阅
 * unsubscribe(channel);
 * ```
 */
export function subscribeToCows(callback: RealtimeCallback): RealtimeChannel {
  const channel = supabase
    .channel('cows-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cows',
      },
      (payload: any) => {
        console.log('[Realtime] Cows change:', payload);
        callback(payload);
      }
    )
    .subscribe();
  
  return channel;
}

/**
 * 订阅健康记录表变更
 * 
 * @param callback - 数据变更时的回调函数
 * @returns {RealtimeChannel} Realtime频道实例
 */
export function subscribeToHealthRecords(
  callback: RealtimeCallback
): RealtimeChannel {
  const channel = supabase
    .channel('health-records-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'health_records',
      },
      (payload: any) => {
        console.log('[Realtime] Health record change:', payload);
        callback(payload);
      }
    )
    .subscribe();
  
  return channel;
}

/**
 * 订阅产奶记录表变更
 * 
 * @param callback - 数据变更时的回调函数
 * @returns {RealtimeChannel} Realtime频道实例
 */
export function subscribeToMilkRecords(
  callback: RealtimeCallback
): RealtimeChannel {
  const channel = supabase
    .channel('milk-records-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'milk_records',
      },
      (payload: any) => {
        console.log('[Realtime] Milk record change:', payload);
        callback(payload);
      }
    )
    .subscribe();
  
  return channel;
}

/**
 * 订阅通知表变更
 * 
 * @param userId - 用户ID（只订阅该用户的通知）
 * @param callback - 数据变更时的回调函数
 * @returns {RealtimeChannel} Realtime频道实例
 */
export function subscribeToNotifications(
  userId: string,
  callback: RealtimeCallback
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: any) => {
        console.log('[Realtime] New notification:', payload);
        callback(payload);
      }
    )
    .subscribe();
  
  return channel;
}

/**
 * 订阅特定奶牛的所有相关记录变更
 * 
 * @param cowId - 奶牛ID
 * @param callbacks - 各表的回调函数
 * @returns {RealtimeChannel[]} 多个Realtime频道实例
 * 
 * @example
 * ```typescript
 * const channels = subscribeToCowRecords('cow-id', {
 *   health: (payload) => console.log('Health:', payload),
 *   milk: (payload) => console.log('Milk:', payload),
 * });
 * 
 * // 取消所有订阅
 * channels.forEach(ch => unsubscribe(ch));
 * ```
 */
export function subscribeToCowRecords(
  cowId: string,
  callbacks: {
    health?: RealtimeCallback;
    milk?: RealtimeCallback;
    medical?: RealtimeCallback;
  }
): RealtimeChannel[] {
  const channels: RealtimeChannel[] = [];
  
  if (callbacks.health) {
    const healthChannel = supabase
      .channel(`cow-health-${cowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'health_records',
          filter: `cow_id=eq.${cowId}`,
        },
        (payload: any) => {
          console.log('[Realtime] Cow health change:', payload);
          callbacks.health?.(payload);
        }
      )
      .subscribe();
    
    channels.push(healthChannel);
  }
  
  if (callbacks.milk) {
    const milkChannel = supabase
      .channel(`cow-milk-${cowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'milk_records',
          filter: `cow_id=eq.${cowId}`,
        },
        (payload: any) => {
          console.log('[Realtime] Cow milk change:', payload);
          callbacks.milk?.(payload);
        }
      )
      .subscribe();
    
    channels.push(milkChannel);
  }
  
  if (callbacks.medical) {
    const medicalChannel = supabase
      .channel(`cow-medical-${cowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_records',
          filter: `cow_id=eq.${cowId}`,
        },
        (payload: any) => {
          console.log('[Realtime] Cow medical change:', payload);
          callbacks.medical?.(payload);
        }
      )
      .subscribe();
    
    channels.push(medicalChannel);
  }
  
  return channels;
}

/**
 * 取消订阅
 * 
 * @param channel - Realtime频道实例
 * 
 * @example
 * ```typescript
 * const channel = subscribeToCows(callback);
 * // ... 后续
 * unsubscribe(channel);
 * ```
 */
export function unsubscribe(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
  console.log('[Realtime] Unsubscribed from channel');
}

/**
 * 取消所有订阅
 * 
 * @param channels - Realtime频道实例数组
 */
export function unsubscribeAll(channels: RealtimeChannel[]): void {
  channels.forEach((channel) => {
    supabase.removeChannel(channel);
  });
  console.log(`[Realtime] Unsubscribed from ${channels.length} channels`);
}

/**
 * 检查Realtime连接状态
 * 
 * @returns {string} 连接状态
 */
export function getRealtimeStatus(channel: RealtimeChannel): string {
  // @ts-ignore - Accessing internal state
  return channel.state || 'unknown';
}

