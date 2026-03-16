'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Sale, LogType, Notification } from '@/types';

const supabase = createClient();

export function useTable<T>(table: string, orderBy?: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let q = supabase.from(table).select('*');
    if (orderBy) q = q.order(orderBy, { ascending: false });
    const { data: r, error } = await q;
    if (error) console.error(`[useTable] ${table}:`, error.message);
    setData((r || []) as T[]);
    setLoading(false);
  }, [table, orderBy]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const ch = supabase.channel(`${table}_rt`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [table, fetch]);

  return { data, setData, loading, refetch: fetch };
}

export async function insert(table: string, row: any) {
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function update(table: string, id: string, updates: any) {
  const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function remove(table: string, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function log(action: string, detail = '', board = '', type: LogType = 'info', user = 'System') {
  await supabase.from('activity_log').insert({ action, detail, board, log_type: type, user_name: user });
}

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profile || null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  return { profile, loading, reload: fetchProfile };
}

export function useActivityLog() {
  const addLog = useCallback(async (action: string, detail = '', board = '', type: LogType = 'info', user = 'System') => {
    await log(action, detail, board, type, user);
  }, []);

  return { addLog };
}

export function useRealtime(table: string, onChange: () => void) {
  useEffect(() => {
    const ch = supabase.channel(`${table}_rt`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => onChange())
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [table, onChange]);
}

export function useSales() {
  const { data: sales, setData: setSales, loading, refetch } = useTable<Sale>('sales', 'created_at');

  const upsert = useCallback(async (item: any) => {
    const payload = { ...item };
    if (item.id) {
      await update('sales', item.id, payload);
    } else {
      await insert('sales', payload);
    }
  }, []);

  const removeSale = useCallback(async (id: string) => {
    await remove('sales', id);
  }, []);

  const updateStage = useCallback(async (id: string, stage: string) => {
    // Optimistic update — move the card immediately in UI
    setSales(prev => prev.map(s => s.id === id ? { ...s, stage: stage as Sale['stage'] } : s));
    await update('sales', id, { stage });
  }, [setSales]);

  return { sales, loading, reload: refetch, upsert, remove: removeSale, updateStage };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    const list = (data || []) as Notification[];
    setNotifications(list);
    setUnreadCount(list.filter(n => !n.is_read).length);
    setLoading(false);
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    const ch = supabase.channel('notifications_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchNotifications]);

  const markRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  return { notifications, unreadCount, loading, markRead, markAllRead, refetch: fetchNotifications };
}

export { supabase };
