import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(url && anon && !url.includes('tu-proyecto'));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anon)
  : null;
