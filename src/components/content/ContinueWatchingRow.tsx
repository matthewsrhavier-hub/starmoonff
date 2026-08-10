'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { tmdb } from '@/services/tmdb';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getContinueWatching,
  loadLocalProgress,
  loadFromServer,
  type WatchProgressItem,
} from '@/services/watchProgress';
import { getSelectedProfileId } from '@/lib/selectedProfile';
import { CatalogSection } from './CatalogSection';
import { RemainingLabel } from './RemainingLabel';

export function ContinueWatchingRow() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [items, setItems] = useState<WatchProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileId, setProfileId] = useState('default');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfileId(getSelectedProfileId());
  }, [pathname]);

  const refresh = useCallback(() => {
    try {
      const pid = getSelectedProfileId();
      loadLocalProgress(pid);
      setItems(getContinueWatching());
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading continue watching:', error);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    // Servidor só uma vez ao montar / trocar perfil (evita loop 401)
    if (user) {
      void loadFromServer()
        .then(() => refresh())
        .catch(() => {});
    }
  }, [user, profileId, pathname, refresh]);

  useEffect(() => {
    const onProgress = () => refresh();
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    window.addEventListener('starmoon:progress', onProgress);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('starmoon:progress', onProgress);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <CatalogSection title="Continuar assistindo">
      <div className="relative group">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-[var(--bg-elevated)]/95 border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hidden md:flex"
        >
          <ChevronLeft size={20} className="text-white" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-1 px-1"
        >
          {items.map((item) => (
            <ContinueWatchingCard
              key={`${item.tmdb_id}-${item.season}-${item.episode}-${item.updated_at}`}
              item={item}
            />
          ))}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-[var(--bg-elevated)]/95 border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 hidden md:flex"
        >
          <ChevronRight size={20} className="text-white" />
        </button>
      </div>
    </CatalogSection>
  );
}

function ContinueWatchingCard({ item }: { item: WatchProgressItem }) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      try {
        const url = await tmdb.getLogo(item.media_type, item.tmdb_id);
        setLogoUrl(url);
      } catch {
        /* ignore */
      }
    };
    loadLogo();
  }, [item.tmdb_id, item.media_type]);

  const thumbUrl = item.backdrop_path
    ? tmdb.getImageUrl(item.backdrop_path, 'w780')
    : item.poster_path
      ? tmdb.getImageUrl(item.poster_path, 'w500')
      : '/placeholder-backdrop.jpg';

  const watchUrl =
    item.media_type === 'movie'
      ? `/watch/movie/${item.tmdb_id}?play=1`
      : `/watch/tv/${item.tmdb_id}?s=${item.season || 1}&e=${item.episode || 1}&play=1`;

  const progressPercent = Math.min(100, Math.max(0, Math.round((item.progress || 0) * 100)));

  return (
    <Link
      href={watchUrl}
      className="flex-shrink-0 w-64 md:w-80 group/card animate-in fade-in duration-500"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-white/5 shadow-2xl">
        <img
          src={thumbUrl}
          alt={item.title}
          className="w-full h-full object-cover opacity-70 group-hover/card:opacity-100 transition-opacity duration-300"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="max-w-full max-h-[60%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            />
          ) : (
            <span className="text-white font-black text-center text-sm md:text-base uppercase tracking-tighter drop-shadow-md">
              {item.title}
            </span>
          )}
        </div>

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center z-20">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-xl">
            <Play size={24} className="text-black ml-1" fill="currentColor" />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-white transition-all shadow-[0_0_8px_rgba(255,255,255,0.4)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {item.media_type === 'tv' && item.season && item.episode && (
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-white font-black uppercase tracking-wider border border-white/10 z-10">
            S{item.season}:E{item.episode}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-semibold truncate group-hover/card:text-white/80 transition-colors">
            {item.title}
          </h3>
          <RemainingLabel
            key={`rem-${item.tmdb_id}-${item.progress}-${item.current_time}-${item.updated_at}`}
            item={item}
            className="text-zinc-400 text-[11px] font-medium mt-0.5 truncate"
          />
        </div>
      </div>
    </Link>
  );
}
