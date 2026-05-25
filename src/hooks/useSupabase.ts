import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

type QueryOptions = {
  table: string;
  select?: string;
  eq?: Record<string, any>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  dependencies?: any[];
};

export function useSupabaseQuery<T = any>(options: QueryOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const user = useAuthStore(state => state.user);
  
  const { table, select = '*', eq, order, limit, dependencies = [] } = options;

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase.from(table).select(select);

      if (eq) {
        Object.entries(eq).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      if (order) {
        query = query.order(order.column, { ascending: order.ascending ?? true });
      }

      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setData((result as T[]) || []);
      setError(null);
    } catch (err: any) {
      console.error(`Error fetching from ${table}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [table, select, JSON.stringify(eq), JSON.stringify(order), limit, ...dependencies]);

  useEffect(() => {
    // Only fetch if user is authenticated
    if (user?.id) {
      fetchData();
    }
  }, [fetchData, user?.id]);

  return { data, loading, error, refetch: fetchData };
}

// Hook for mutations
export function useSupabaseMutation(table: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const insert = async (payload: any) => {
    if (!supabase) throw new Error("Supabase is not configured");
    setLoading(true);
    try {
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: number | string, payload: any) => {
    if (!supabase) throw new Error("Supabase is not configured");
    setLoading(true);
    try {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number | string) => {
    if (!supabase) throw new Error("Supabase is not configured");
    setLoading(true);
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { insert, update, remove, loading, error };
}
