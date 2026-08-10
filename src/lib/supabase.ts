import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Aviso apenas em runtime, não quebra o build
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('[supabase] Credenciais não encontradas nas variáveis de ambiente.');
}

// Usar valores de placeholder para evitar erro de build quando as vars ainda não existem
const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseAnonKey || 'placeholder-anon-key';

/**
 * Cliente Supabase público (anon key).
 * Segue as Row Level Security (RLS) policies do banco.
 */
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
