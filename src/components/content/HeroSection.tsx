'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { tmdb } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import { Play, ChevronRight, Bookmark, Info, Star } from 'lucide-react';
import type { Content, ContentDetails } from '@/types/content';

const GENRE_MAP: Record<number, string> = {
  28: 'Ação', 12: 'Aventura', 16: 'Animação', 35: 'Comédia', 80: 'Crime',
  99: 'Documentário', 18: 'Drama', 10751: 'Família', 14: 'Fantasia',
  36: 'História', 27: 'Terror', 10402: 'Música', 9648: 'Mistério',
  10749: 'Romance', 878: 'Ficção Científica', 10770: 'Cinema TV',
  53: 'Suspense', 10752: 'Guerra', 37: 'Faroeste',
  10759: 'Ação e Aventura', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasia', 10766: 'Novela',
  10767: 'Talk', 10768: 'Guerra & Política', 10769: 'Musical',
  10771: 'Para Toda Família',
};

interface HeroSectionProps {
  content?: Content | ContentDetails | null;
  items?: Content[];
  isLoading?: boolean;
  autoRotate?: boolean;
  rotateInterval?: number;
  onPlay?: () => void;
  tagline?: string;
}

function StarRating({ rating }: { rating: number }) {
  const stars = Math.max(0, Math.min(5, Math.round((rating / 10) * 5)));
  return (
    <span className="inline-flex items-center gap-[2px]">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={15}
          className={i < stars ? 'text-white fill-white' : 'text-white/30'}
          strokeWidth={i < stars ? 0 : 1.6}
        />
      ))}
    </span>
  );
}

export function HeroSection({
  content,
  items,
  isLoading = false,
  autoRotate = true,
  rotateInterval = 8000,
  onPlay,
  tagline,
}: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [details, setDetails] = useState<ContentDetails | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);

  const heroItems = items?.slice(0, 5) || (content ? [content] : []);
  const currentContent = heroItems[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (heroItems.length <= 1) return prev;
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 400);
      return (prev + 1) % heroItems.length;
    });
  }, [heroItems.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex((prev) => {
      if (index === prev || heroItems.length <= 1) return prev;
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 400);
      return index;
    });
  }, [heroItems.length]);

  useEffect(() => {
    if (!autoRotate || heroItems.length <= 1) return;
    const timer = setInterval(goNext, rotateInterval);
    return () => clearInterval(timer);
  }, [autoRotate, heroItems.length, rotateInterval, goNext]);

  useEffect(() => {
    setLogoUrl(null);
    setDetails(null);
    setInWatchlist(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!currentContent?.id) return;
    const mediaType = currentContent.media_type || (currentContent.first_air_date ? 'tv' : 'movie');
    setLogoLoading(true);
    tmdb.getLogo(mediaType as 'movie' | 'tv', currentContent.id)
      .then(url => setLogoUrl(url))
      .catch(() => setLogoUrl(null))
      .finally(() => setLogoLoading(false));
  }, [currentContent?.id]);

  useEffect(() => {
    if (!currentContent?.id) return;
    const mediaType = currentContent.media_type || (currentContent.first_air_date ? 'tv' : 'movie');
    if ('genres' in currentContent && Array.isArray((currentContent as ContentDetails).genres)) {
      setDetails(currentContent as ContentDetails);
      return;
    }
    tmdb.getDetails(mediaType as 'movie' | 'tv', currentContent.id)
      .then(d => setDetails(d))
      .catch(() => setDetails(null));
  }, [currentContent?.id]);

  if (isLoading || !currentContent) {
    return (
      <div className="relative h-[68svh] min-h-[380px] max-h-[640px] md:h-[60vh] md:min-h-[480px] md:max-h-[640px] bg-black">
        <div className="absolute inset-0 skeleton" />
      </div>
    );
  }

  const title = currentContent.title || currentContent.name || 'Sem título';
  const mediaType = currentContent.media_type || (currentContent.first_air_date ? 'tv' : 'movie');
  const backdropUrl = currentContent.backdrop_path
    ? tmdb.getImageUrl(currentContent.backdrop_path, 'w1280')
    : null;
  const releaseDate = currentContent.release_date || currentContent.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const overview = currentContent.overview || '';
  const vote = currentContent.vote_average || details?.vote_average || 7.5;
  const matchPercent = Math.round((vote / 10) * 100);

  const genres: string[] = (() => {
    if (details?.genres?.length) return details.genres.map(g => g.name);
    if (currentContent.genre_ids?.length) {
      return currentContent.genre_ids.map(id => GENRE_MAP[id]).filter(Boolean) as string[];
    }
    return [];
  })();

  const primaryGenre = genres[0] || (mediaType === 'tv' ? 'Série' : 'Filme');
  const href = `/watch/${mediaType}/${currentContent.id}`;
  const resolvedTagline =
    (details?.tagline && details.tagline.trim()) ||
    tagline ||
    (mediaType === 'tv' ? 'Novos episódios toda semana' : 'Disponível agora');

  return (
    <section className="relative z-20 w-full h-[68svh] md:h-[60vh] min-h-[380px] md:min-h-[480px] max-h-[640px] md:max-h-[640px] overflow-hidden bg-black">
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          isTransitioning ? 'opacity-0' : 'opacity-100'
        )}
      >
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt={title}
            className="w-full h-full object-cover object-top md:object-[center_20%]"
          />
        ) : (
          <div className="w-full h-full bg-[#111]" />
        )}
      </div>

      {/* Gradientes */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-black via-black/70 to-transparent md:via-black/55 md:to-transparent" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/60 via-transparent to-transparent" />

      {/* Conteúdo — alinhado à esquerda, parte inferior */}
      <div className="relative z-20 h-full flex items-end">
        <div
          className={cn(
            'w-full max-w-2xl px-4 sm:px-5 md:pl-[100px] md:pr-8 pb-12 sm:pb-16 md:pb-20 transition-all duration-400',
            isTransitioning ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
          )}
        >
          {/* Badge branco estilo studio */}
          <div className="inline-flex mb-3 md:mb-4 px-2.5 py-1 bg-white rounded-sm items-baseline">
            <span className="text-[11px] md:text-xs font-black tracking-tight text-black leading-none">
              Star<span className="font-light text-black/75">moon</span>
            </span>
          </div>

          {/* Logo / título */}
          <div className="mb-2.5 md:mb-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={title}
                className="h-[48px] sm:h-[56px] md:h-[84px] w-auto max-w-[90%] sm:max-w-[85%] object-contain object-left drop-shadow-2xl"
              />
            ) : logoLoading ? (
              <div className="h-12 sm:h-14 w-40 sm:w-48 rounded bg-white/10 animate-pulse" />
            ) : (
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white uppercase tracking-tight leading-none drop-shadow-2xl line-clamp-2">
                {title}
              </h1>
            )}
          </div>

          {/* Tagline */}
          <p className="text-white font-bold text-[11px] sm:text-xs md:text-sm uppercase tracking-[0.1em] mb-2.5 md:mb-3 drop-shadow-md line-clamp-1">
            {resolvedTagline}
          </p>

          {/* Estrelas · Match · Ano · Gênero */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mb-3 text-[11px] sm:text-xs md:text-sm text-white">
            <StarRating rating={vote} />
            <span className="font-bold">{matchPercent}% Match</span>
            {year && <span className="text-white/80">{year}</span>}
            <span className="inline-flex px-2.5 py-0.5 md:px-3 md:py-1 rounded-full bg-white/15 border border-white/20 text-[10px] md:text-[11px] font-semibold backdrop-blur-sm">
              {primaryGenre}
            </span>
          </div>

          {/* Sinopse — oculta em telas bem pequenas */}
          {overview ? (
            <p className="hidden sm:block text-white/90 text-[13px] md:text-sm leading-relaxed line-clamp-2 max-w-lg mb-5 drop-shadow-md">
              {overview}
            </p>
          ) : (
            <p className="hidden sm:block text-white/60 text-sm mb-5">Assista agora no Starmoon.</p>
          )}

          {/* Botões: Play + Bookmark + Info */}
          <div className="flex items-center gap-2 sm:gap-2.5 mt-1 sm:mt-0">
            {onPlay ? (
              <button
                type="button"
                onClick={onPlay}
                className="inline-flex items-center justify-center gap-2 h-11 min-w-[7.5rem] px-6 md:px-7 rounded-full bg-white text-black font-bold text-sm md:text-base hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-lg"
              >
                <Play size={16} fill="currentColor" strokeWidth={0} />
                Play
              </button>
            ) : (
              <Link
                href={href}
                className="inline-flex items-center justify-center gap-2 h-11 min-w-[7.5rem] px-6 md:px-7 rounded-full bg-white text-black font-bold text-sm md:text-base hover:bg-neutral-200 active:scale-[0.98] transition-all shadow-lg"
              >
                <Play size={16} fill="currentColor" strokeWidth={0} />
                Play
              </Link>
            )}

            <button
              type="button"
              onClick={() => setInWatchlist(v => !v)}
              className={cn(
                'w-11 h-11 rounded-full inline-flex items-center justify-center border transition-all',
                inWatchlist
                  ? 'bg-white/20 border-white text-white'
                  : 'bg-black/50 border-white/35 text-white hover:border-white/70'
              )}
              aria-label="Minha lista"
            >
              <Bookmark size={16} fill={inWatchlist ? 'currentColor' : 'none'} strokeWidth={1.8} />
            </button>

            <Link
              href={href}
              className="w-11 h-11 rounded-full inline-flex items-center justify-center bg-black/50 border border-white/35 text-white hover:border-white/70 transition-all"
              aria-label="Informações"
            >
              <Info size={16} strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </div>

      {/* Dots — área de toque maior no mobile */}
      {heroItems.length > 1 && (
        <div className="absolute bottom-3 sm:bottom-5 right-4 sm:right-6 z-30 flex items-center -space-x-0.5">
          {heroItems.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className="flex items-center justify-center w-3.5 h-6"
              aria-label={`Slide ${index + 1}`}
            >
              <span
                className={cn(
                  'rounded-full transition-all duration-300',
                  index === currentIndex
                    ? 'w-3 h-1 bg-white'
                    : 'w-1 h-1 bg-white/40'
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* Seta direita */}
      {heroItems.length > 1 && (
        <button
          type="button"
          onClick={goNext}
          className="hidden md:flex absolute right-5 top-1/2 -translate-y-1/2 z-30 w-11 h-11 items-center justify-center rounded-full bg-black/50 border border-white/25 text-white hover:bg-black/80 transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight size={22} />
        </button>
      )}
    </section>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative w-full h-[68svh] min-h-[380px] max-h-[640px] md:h-[60vh] md:min-h-[480px] md:max-h-[640px] bg-black overflow-hidden">
      <div className="absolute inset-0 skeleton" />
      <div className="absolute bottom-16 left-6 md:left-[100px] space-y-3">
        <div className="h-5 w-20 rounded-sm bg-white/15" />
        <div className="h-16 w-56 rounded-lg bg-white/10" />
        <div className="h-3 w-40 rounded bg-white/10" />
        <div className="flex gap-3 pt-1">
          <div className="h-10 w-28 rounded-full bg-white/15" />
          <div className="h-10 w-10 rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}
