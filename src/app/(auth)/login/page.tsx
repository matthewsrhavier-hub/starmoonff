'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { tmdb } from '@/services/tmdb';
import { Mail, Lock, ArrowLeft, Star, Loader2 } from 'lucide-react';
import { LogoLink } from '@/components/layout/Logo';
import type { Content } from '@/types/content';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [featuredItems, setFeaturedItems] = useState<Content[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadTrending = async () => {
      try {
        const data = await tmdb.getTrending('movie', 'week');
        const items = data.results.filter(item => item.backdrop_path && item.overview).slice(0, 8);
        setFeaturedItems(items);
      } catch (e) {
        console.error('TMDB Slide Error:', e);
      }
    };
    loadTrending();

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % 8);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Bem-vindo de volta!', 'success');
      router.push('/');
    } catch {
      showToast('E-mail ou senha incorretos.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const currentItem = featuredItems[currentIndex];

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-[var(--bg-primary)] flex overflow-hidden">
      <Link
        href="/"
        className="fixed top-4 left-4 sm:top-8 sm:left-8 w-11 h-11 sm:w-12 sm:h-12 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-center text-white z-[100] hover:bg-white/15 transition-all hover:scale-105"
      >
        <ArrowLeft size={20} />
      </Link>

      <div className="flex-1 min-w-0 w-full max-w-full lg:max-w-[38%] h-full flex flex-col items-center justify-center px-5 py-10 sm:p-8 md:p-16 z-10 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent overflow-y-auto">
        <div className="w-full max-w-[400px] animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="mb-8 sm:mb-10">
            <LogoLink size="lg" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-white">Entrar na conta</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-8">Continue de onde parou no seu catálogo.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} />
                <input
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-white hover:bg-zinc-200 text-[#040714] font-bold rounded-full transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 mt-2"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar'}
            </button>

            <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] px-1">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                <input type="checkbox" className="accent-white w-4 h-4 rounded" defaultChecked />
                Lembrar de mim
              </label>
              <a href="#" className="hover:text-white transition-colors">Esqueceu a senha?</a>
            </div>
          </form>

          <div className="mt-10 pt-8 text-center text-sm text-[var(--text-secondary)] border-t border-[var(--border-color)]">
            Novo por aqui?{' '}
            <Link href="/plans" className="text-white font-semibold hover:text-[var(--accent-teal)] transition-colors">
              Ver planos
            </Link>
          </div>
        </div>
      </div>

      <div className="hidden lg:block flex-[1.4] h-full relative">
        <div className="absolute inset-0">
          {currentItem && (
            <div className="relative w-full h-full transition-opacity duration-1000">
              <Image
                src={tmdb.getImageUrl(currentItem.backdrop_path, 'original')}
                alt={currentItem.title || currentItem.name || ''}
                fill
                className="object-cover transition-all duration-1000 brightness-[0.35]"
                priority
              />

              <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)] via-transparent to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-teal)]/10 via-transparent to-[var(--accent-purple)]/10" />

              <div className="absolute bottom-16 left-16 right-16 max-w-2xl animate-in slide-in-from-bottom-8 duration-1000">
                <div className="relative w-28 aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-8">
                  {currentItem.poster_path && (
                    <Image
                      src={tmdb.getImageUrl(currentItem.poster_path, 'w342')}
                      alt="Poster"
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <h1 className="text-5xl font-bold tracking-tight text-white mb-4 drop-shadow-2xl">
                  {currentItem.title || currentItem.name}
                </h1>
                <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-6 line-clamp-3">
                  {currentItem.overview}
                </p>
                <div className="flex items-center gap-2 text-white text-lg font-semibold">
                  <Star size={20} fill="currentColor" className="text-[var(--accent-teal)]" />
                  {currentItem.vote_average.toFixed(1)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
