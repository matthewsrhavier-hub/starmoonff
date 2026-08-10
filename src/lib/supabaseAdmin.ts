import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[supabaseAdmin] Credenciais incompletas. Operações admin podem falhar durante o build ou em produção se não configuradas.');
}

const url = supabaseUrl || 'https://placeholder.supabase.co';
const key = supabaseServiceKey || 'placeholder-service-key';

/**
 * Cliente Supabase com Service Role Key (bypass RLS).
 * NUNCA expor esta chave no cliente. Usar apenas em rotas de servidor (API).
 */
export const supabaseAdmin = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
