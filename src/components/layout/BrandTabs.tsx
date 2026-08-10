'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/Logo';

type TabId = 'foryou' | 'movies' | 'series' | 'tv';

const tabs: { href: string; id: TabId; label: string }[] = [
  { href: '/', id: 'foryou', label: 'For You' },
  { href: '/movies', id: 'movies', label: 'Filmes' },
  { href: '/series', id: 'series', label: 'Séries' },
  { href: '/tv', id: 'tv', label: 'TV' },
];

function getActiveId(pathname: string): TabId {
  if (pathname.startsWith('/movies')) return 'movies';
  if (pathname.startsWith('/series')) return 'series';
  if (pathname === '/tv') return 'tv';
  return 'foryou';
}

interface BrandTabsProps {
  overlay?: boolean;
}

export function BrandTabs({ overlay = false }: BrandTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<Record<TabId, HTMLAnchorElement | null>>({
    foryou: null,
    movies: null,
    series: null,
    tv: null,
  });
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false });
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const prevIndex = useRef(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const activeId = getActiveId(pathname);
  const activeIndex = tabs.findIndex((t) => t.id === activeId);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
  }, []);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const measure = useCallback(() => {
    const nav = navRef.current;
    const el = tabRefs.current[activeId];
    if (!nav || !el) return;

    const navRect = nav.getBoundingClientRect();
    const tabRect = el.getBoundingClientRect();
    setIndicator({
      left: tabRect.left - navRect.left,
      width: tabRect.width,
      ready: true,
    });
  }, [activeId]);

  useLayoutEffect(() => {
    if (activeIndex !== prevIndex.current) {
      setSlideDir(activeIndex > prevIndex.current ? 'right' : 'left');
      prevIndex.current = activeIndex;
    }
    if (!searchOpen) measure();
  }, [activeId, activeIndex, measure, pathname, searchOpen]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [searchOpen, closeSearch]);

  useEffect(() => {
    closeSearch();
  }, [pathname, closeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    closeSearch();
  };

  if (pathname.startsWith('/watch') || pathname.startsWith('/login') || pathname.startsWith('/register')) {
    return null;
  }

  return (
    <div
      className={cn(
        'z-50 hidden md:flex items-center justify-center pointer-events-none',
        overlay
          ? 'fixed top-0 left-0 right-0 pt-4 px-5 lg:px-7'
          : 'sticky top-0 pt-4 pb-3 px-5 lg:px-7 bg-gradient-to-b from-black via-black/80 to-transparent'
      )}
    >
      {/* Barra de pesquisa — centro do navbar */}
      {searchOpen && (
        <form
          onSubmit={handleSubmit}
          className="brand-search-bar pointer-events-auto"
          role="search"
        >
          <Search size={18} strokeWidth={2} className="brand-search-bar__icon" />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar filmes, séries..."
            className="brand-search-bar__input"
            autoComplete="off"
            aria-label="Buscar"
          />
          <button
            type="button"
            onClick={closeSearch}
            className="brand-search-bar__close"
            aria-label="Fechar busca"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </form>
      )}

      {/* Abas + lupa — à direita quando a busca está fechada */}
      <div
        className={cn(
          'brand-tabs-pill pointer-events-auto ml-auto transition-opacity duration-200',
          searchOpen && 'opacity-0 pointer-events-none absolute'
        )}
      >
        <button
          type="button"
          onClick={openSearch}
          className="brand-search-btn"
          aria-label="Pesquisar"
          title="Pesquisar"
        >
          <Search size={17} strokeWidth={2} />
        </button>

        <span className="brand-tabs-sep" aria-hidden />

        <nav
          ref={navRef}
          className="brand-tabs-nav relative flex items-center gap-0.5"
          aria-label="Navegação Starmoon"
        >
          <span
            aria-hidden
            className={cn('brand-tab-indicator', indicator.ready && 'brand-tab-indicator--ready')}
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: indicator.width,
            }}
          />

          {tabs.map((tab) => {
            const active = activeId === tab.id;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                ref={(node) => {
                  tabRefs.current[tab.id] = node;
                }}
                className={cn(
                  'brand-tab',
                  active && 'brand-tab--active',
                  active && (slideDir === 'right' ? 'brand-tab--enter-right' : 'brand-tab--enter-left')
                )}
                aria-current={active ? 'page' : undefined}
              >
                {tab.id === 'foryou' ? (
                  <Logo size="xs" tone={active ? 'dark' : 'light'} showShadow={false} />
                ) : (
                  <span className={cn('brand-tab-label', active && 'brand-tab-label--on')}>
                    {tab.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
