'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Sale } from '@/types';

const supabase = createClient();

export function useTable<T>(table: string, orderBy?: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    let q = supabase.from(table).select('*');
    if (orderBy) q = q.order(orderBy, { ascending: false });
    const { data: r } = await q;
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

  return { data, loading, refetch: fetch };
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

export async function log(action: string, detail = '', board = '', type = 'info', user = 'System') {
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
  const addLog = useCallback(async (action: string, detail = '', board = '', type = 'info', user = 'System') => {
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
  const { data: sales, loading, refetch } = useTable<Sale>('sales', 'created_at');

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
    await update('sales', id, { stage });
  }, []);

  return { sales, loading, reload: refetch, upsert, remove: removeSale, updateStage };
}

export { supabase };
