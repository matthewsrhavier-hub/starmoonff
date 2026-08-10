'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Search, Film, Tv, Loader2 } from 'lucide-react';
import { LogoLink } from '@/components/layout/Logo';
import { tmdb } from '@/services/tmdb';

interface SearchSuggestion {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [scrolled, setScrolled] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const navLinks = [
    { href: '/', label: 'Início', active: pathname === '/' },
    { href: '/movies', label: 'Filmes', active: pathname === '/movies' || pathname.startsWith('/movies/') },
    { href: '/series', label: 'Séries', active: pathname === '/series' || pathname.startsWith('/series/') },
    { href: '/tv', label: 'TV ao Vivo', active: pathname === '/tv' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
        setSuggestions([]);
      }
    };
    if (searchOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [searchOpen]);

  // Buscar sugestoes com debounce (APENAS CATALOGO PROPRIO)
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      // 1. Buscar APENAS no Catálogo Próprio (Supabase)
      const { supabase } = await import('@/lib/supabase');
      const { data: customData } = await supabase
        .from('custom_content')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(8);

      if (!customData || customData.length === 0) {
        setSuggestions([]);
        return;
      }

      // 2. Processar itens do Catálogo Próprio enriquecendo com TMDB (para imagem/info)
      const customItemsPromises = customData.map(async (item: any) => {
        try {
          const details = await tmdb.getDetails(item.media_type as any, item.tmdb_id);
          return {
            id: item.tmdb_id,
            title: item.title || details.title || details.name,
            media_type: item.media_type as 'movie' | 'tv',
            poster_path: details.poster_path,
            release_date: details.release_date,
            first_air_date: details.first_air_date,
            vote_average: details.vote_average,
          };
        } catch (err) {
          return null;
        }
      });

      const customItems = (await Promise.all(customItemsPromises)).filter(Boolean);
      
      setSuggestions(customItems as SearchSuggestion[]);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Erro ao buscar sugestoes:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (searchQuery.length >= 3) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, fetchSuggestions]);

  // Navegacao por teclado nas sugestoes
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      goToContent(suggestions[selectedIndex]);
    }
  };

  // Ir para pagina do conteudo
  const goToContent = (item: SearchSuggestion) => {
    router.push(`/watch/${item.media_type}/${item.id}`);
    setSearchOpen(false);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setSuggestions([]);
    }
  };

  // Formatar ano
  const getYear = (item: SearchSuggestion) => {
    const date = item.release_date || item.first_air_date;
    return date ? new Date(date).getFullYear() : null;
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-none ring-0 outline-none',
          scrolled
            ? 'glass'
            : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
        )}
      >
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 h-14 md:h-[72px] flex items-center justify-between">
          {/* Logo */}
          <LogoLink size="md" />

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'nav-link',
                  link.active && 'active'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions — busca + perfil no mesmo pill */}
          <div className="flex items-center">
            {user ? (
              <div className="relative flex items-center gap-0.5 h-11 pl-1.5 pr-1.5 rounded-full bg-black/80 border border-white/15 backdrop-blur-md shadow-lg shadow-black/40">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/85 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Buscar"
                >
                  <Search size={18} strokeWidth={1.8} />
                </button>

                <Link
                  href="/who-is-watching"
                  className="h-9 px-3 flex items-center justify-center rounded-full transition-all hover:bg-white/10"
                  aria-label="Perfil"
                >
                  <span className="text-xs font-semibold text-white/90">
                    Perfil
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 h-11 pl-1.5 pr-1.5 rounded-full bg-black/80 border border-white/15 backdrop-blur-md shadow-lg shadow-black/40">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-white/85 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Buscar"
                >
                  <Search size={18} strokeWidth={1.8} />
                </button>
                <a
                  href="/login"
                  className="h-8 px-3.5 inline-flex items-center justify-center text-xs font-bold rounded-full bg-white text-black hover:bg-zinc-200 transition-all"
                >
                  Entrar
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-xl animate-fade-in"
          onClick={() => {
            setSearchOpen(false);
            setSuggestions([]);
          }}
        >
          <div
            className="max-w-2xl mx-auto pt-20 sm:pt-32 px-4 sm:px-6"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSearch} className="relative">
              <Search
                size={22}
                strokeWidth={1.5}
                className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
              />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Buscar filmes, séries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className={cn(
                  'w-full pl-12 sm:pl-16 pr-12 py-4 sm:py-5 text-base sm:text-lg',
                  'bg-[var(--bg-elevated)]',
                  suggestions.length > 0 ? 'rounded-t-2xl rounded-b-none' : 'rounded-2xl',
                  'text-white placeholder-[var(--text-tertiary)]',
                  'border border-[var(--border-color)]',
                  suggestions.length > 0 && 'border-b-0',
                  'focus:outline-none focus:border-white/30',
                  'transition-colors'
                )}
              />
              {isLoadingSuggestions && (
                <Loader2
                  size={20}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] animate-spin"
                />
              )}
            </form>

            {/* Sugestoes */}
            {suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="bg-[var(--bg-elevated)] border border-[var(--border-color)] border-t-0 rounded-b-2xl overflow-hidden"
              >
                {suggestions.map((item, index) => (
                  <button
                    key={`${item.media_type}-${item.id}`}
                    onClick={() => goToContent(item)}
                    className={cn(
                      'w-full flex items-center gap-4 px-4 py-3 text-left transition-colors',
                      'hover:bg-white/10',
                      selectedIndex === index && 'bg-white/10'
                    )}
                  >
                    {/* Poster */}
                    <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-[var(--bg-tertiary)]">
                      {item.poster_path ? (
                        <Image
                          src={tmdb.getImageUrl(item.poster_path, 'w92')}
                          alt={item.title}
                          width={48}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {item.media_type === 'movie' ? (
                            <Film size={20} className="text-[var(--text-tertiary)]" />
                          ) : (
                            <Tv size={20} className="text-[var(--text-tertiary)]" />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{item.title}</p>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-white/10 text-white/80">
                          {item.media_type === 'movie' ? 'Filme' : 'Série'}
                        </span>
                        {getYear(item) && <span>{getYear(item)}</span>}
                        {item.vote_average && item.vote_average > 0 && (
                          <span className="text-yellow-500">★ {item.vote_average.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}

                {/* Ver todos os resultados */}
                <button
                  onClick={handleSearch}
                  className="w-full py-3 text-center text-sm text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-colors border-t border-[var(--border-color)]"
                >
                  Ver todos os resultados para "{searchQuery}"
                </button>
              </div>
            )}

            <p className="text-center text-sm text-[var(--text-tertiary)] mt-6">
              {searchQuery.length < 3 ? (
                <>Digite pelo menos <strong>3 caracteres</strong> para buscar</>
              ) : (
                <>Pressione <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded-lg text-xs font-medium">ESC</kbd> para fechar</>
              )}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
