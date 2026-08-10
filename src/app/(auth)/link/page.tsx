'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function LinkPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [code, setCode] = useState(searchParams.get('code')?.toUpperCase() || '');
  const [status, setStatus] = useState<'idle' | 'linking' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Se o código mudar no URL, atualiza o estado
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) setCode(urlCode.toUpperCase());
  }, [searchParams]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('Você precisa estar logado no celular para vincular.', 'error');
      router.push('/login?returnTo=/link?code=' + code);
      return;
    }

    if (code.length < 6) {
      showToast('Código inválido.', 'error');
      return;
    }

    setStatus('linking');
    try {
      // 1. Buscar a sessão atual do celular
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // 2. Atualizar o registro no banco para 'approved'
      const { data, error } = await supabase
        .from('tv_links')
        .update({
          status: 'approved',
          session_data: {
            access_token: session.access_token,
            refresh_token: session.refresh_token
          },
          updated_at: new Date().toISOString()
        })
        .eq('code', code.toUpperCase())
        .eq('status', 'pending')
        .select()
        .single();

      if (error || !data) {
        throw new Error('Código expirado ou incorreto.');
      }

      setStatus('success');
      showToast('Acesso autorizado! O computador irá logar agora.', 'success');
      
      // Voltar para o início após 3 segundos
      setTimeout(() => router.push('/'), 3000);

    } catch (err: unknown) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Erro ao vincular dispositivo.';
      setErrorMessage(errorMessage);
      showToast(errorMessage, 'error');
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center"><Loader2 className="animate-spin text-white" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[var(--bg-secondary)]/90 border border-[var(--border-color)] backdrop-blur-3xl p-8 md:p-12 rounded-3xl shadow-[var(--shadow-lg)] relative overflow-hidden">

        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent-teal)]/10 blur-[80px]" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[var(--accent-purple)]/10 blur-[80px]" />

        <div className="relative text-center">
          {user && (
            <div className="mb-10 p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700">
               <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--accent-teal)] via-[var(--accent-blue)] to-[var(--accent-purple)] rounded-full flex items-center justify-center border-4 border-white/5 shadow-2xl">
                     <span className="text-xl font-black text-white">{(user.name || user.email)[0].toUpperCase()}</span>
                  </div>
                  <div className="space-y-1">
                     <p className="text-white font-black tracking-tight">{user.name || user.email.split('@')[0]}</p>
                     <p className="text-zinc-500 text-xs font-medium">{user.email}</p>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-teal)]/10 border border-[var(--accent-teal)]/20 rounded-full">
                     <span className="w-1.5 h-1.5 bg-[var(--accent-teal)] rounded-full animate-pulse" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-teal)]">
                       {user.subscription_status === 'pago' ? 'Assinante VIP' : 'Conta Gratuita'}
                     </span>
                  </div>
               </div>
            </div>
          )}

          {status === 'idle' || status === 'linking' ? (
            <>
              <h1 className="text-4xl font-black tracking-tighter text-white mb-4">Vincular TV</h1>
              <p className="text-zinc-500 text-sm font-medium mb-12">Confirme o código que aparece na sua Smart TV ou computador para entrar instantaneamente.</p>

              <form onSubmit={handleLink} className="space-y-8">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Código de Pareamento</label>
                  <input 
                    type="text" 
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    placeholder="ABCDEF"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-6 text-center text-5xl font-bold tracking-[0.3em] text-white focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all placeholder:text-zinc-700"
                    required
                  />
                </div>

                {!user && (
                   <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl text-yellow-500 text-xs font-bold flex items-center gap-3">
                      <XCircle size={18} />
                      Você precisa logar neste celular primeiro.
                   </div>
                )}

                <button 
                  type="submit"
                  disabled={status === 'linking' || code.length < 6}
                  className="w-full py-5 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[11px] rounded-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {status === 'linking' ? <Loader2 className="animate-spin" /> : (
                    <>Autorizar Acesso <ArrowRight size={16} /></>
                  )}
                </button>
              </form>
            </>
          ) : status === 'success' ? (
            <div className="animate-in fade-in zoom-in duration-500">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-[var(--accent-teal)]/30">
                  <CheckCircle2 size={48} className="text-[var(--accent-teal)]" />
               </div>
               <h2 className="text-3xl font-black text-white tracking-tighter mb-4 text-white">Sucesso!</h2>
               <p className="text-zinc-500 text-sm font-medium">A TV/PC foi autorizada e irá logar nos próximos segundos. Aproveite seu cinema!</p>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in duration-500">
               <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10">
                  <XCircle size={48} className="text-[var(--text-secondary)]" />
               </div>
               <h2 className="text-3xl font-black text-white tracking-tighter mb-4 text-white">Oops!</h2>
               <p className="text-zinc-500 text-sm font-medium mb-12">{errorMessage}</p>
               <button 
                 onClick={() => setStatus('idle')}
                 className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
               >
                 Tentar outro código
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
