'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { tmdb } from '@/services/tmdb';
import { cn } from '@/lib/utils';
import type { Content } from '@/types/content';

interface ContentCardProps {
  content: Content;
  showType?: boolean;
  onPlay?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  inWatchlist?: boolean;
  className?: string;
  variant?: 'poster' | 'backdrop';
  minimal?: boolean;
  square?: boolean;
}

export function ContentCard({
  content,
  showType = false,
  onPlay,
  onFavorite,
  isFavorite = false,
  inWatchlist = false,
  className,
  variant = 'poster',
  minimal = false,
  square = false,
}: ContentCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const mediaType = content.media_type || (content.first_air_date ? 'tv' : 'movie');
  const title = content.title || content.name || 'Sem título';
  const releaseDate = content.release_date || content.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;

  useEffect(() => {
    // Em carrosséis minimal (Featured) não busca logo — evita N+1 e deixa a home rápida
    if (variant !== 'backdrop' || minimal || !content.id) return;
    let cancelled = false;
    tmdb.getLogo(mediaType as 'movie' | 'tv', content.id)
      .then((url) => {
        if (!cancelled && url) setLogoUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [variant, minimal, mediaType, content.id]);

  const imageUrl = variant === 'backdrop'
    ? (content.backdrop_path
        ? tmdb.getImageUrl(content.backdrop_path, 'w780')
        : content.poster_path
          ? tmdb.getImageUrl(content.poster_path, 'w500')
          : null)
    : (content.poster_path
        ? tmdb.getImageUrl(content.poster_path, 'w342')
        : null);

  const href = `/watch/${mediaType}/${content.id}`;

  return (
    <Link
      href={href}
      prefetch={true}
      className={cn('block group', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'poster-card',
          variant === 'backdrop' ? 'aspect-video poster-card--backdrop' : 'aspect-[2/3]',
          square && 'poster-card--square'
        )}
      >
        <div className="poster-card__media">
          {/* Image */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 skeleton" />
          )}

          {imageUrl && (
            <img
              src={imageUrl}
              alt={title}
              className={cn(
                'w-full h-full object-cover object-top transition-opacity duration-200',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
              }}
            />
          )}

          {/* Fallback for missing image */}
          {(!imageUrl || imageError) && imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg-tertiary)] to-[var(--bg-secondary)] flex items-center justify-center">
              <span className="text-4xl text-[var(--text-tertiary)]">
                {title[0]}
              </span>
            </div>
          )}

          {/* Badges — ocultos no Featured (minimal) */}
          {variant === 'backdrop' && !minimal && (
            <>
              <div className="absolute top-2 left-2.5 z-10">
                <span className="text-[10px] font-bold text-white/90 tracking-wide drop-shadow-md">
                  {mediaType === 'movie' ? 'Filme' : 'Série'}
                </span>
              </div>
              <div className="absolute top-2 right-2.5 z-10">
                <span className="text-[10px] font-black tracking-tight text-white drop-shadow-md leading-none">
                  Star<span className="font-light text-white/90">moon</span>
                </span>
              </div>
            </>
          )}

          {/* Gradient Shadow Underneath Logo/Title */}
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300 pointer-events-none',
              variant === 'backdrop'
                ? (minimal ? 'opacity-0' : 'bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-100')
                : 'bg-black/20',
              variant === 'backdrop' ? undefined : (isHovered ? 'opacity-100' : 'opacity-0')
            )}
          />

          {/* Title or Logo overlay (Only for backdrop variant) */}
          {variant === 'backdrop' && !minimal && (
            <div
              className="absolute bottom-0 left-0 right-0 p-4 z-10 transition-opacity duration-300 pointer-events-none opacity-100"
            >
              {logoUrl ? (
                <div className="relative h-12 md:h-14 w-3/4 max-w-[180px]">
                  <Image 
                    src={logoUrl} 
                    alt={title} 
                    fill
                    className="object-contain object-bottom drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
                    sizes="(max-width: 768px) 150px, 200px"
                  />
                </div>
              ) : (
                <div>
                  <h3 className="font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2 text-lg md:text-xl">
                    {title}
                  </h3>
                  {year && (
                    <p className="text-xs text-white/80 font-medium mt-1 drop-shadow-md">{year}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title below card (Always visible for posters) */}
      {variant === 'poster' && !square && (
        <div className="mt-2.5 px-1">
          <h3 className="text-sm font-bold text-white group-hover:text-white/70 transition-colors line-clamp-1 leading-snug">
            {title}
          </h3>
          {year && (
            <p className="text-xs text-zinc-400 font-medium mt-0.5">{year}</p>
          )}
        </div>
      )}
    </Link>
  );
}

// Compact card variant for grids
export function ContentCardCompact({
  content,
  className,
}: {
  content: Content;
  className?: string;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const mediaType = content.media_type || (content.first_air_date ? 'tv' : 'movie');
  const title = content.title || content.name || 'Sem título';
  const posterUrl = content.poster_path
    ? tmdb.getImageUrl(content.poster_path, 'w780')
    : null;

  const href = `/watch/${mediaType}/${content.id}`;

  return (
    <Link href={href} prefetch={true} className={cn('block group', className)}>
      <div className="poster-card aspect-[2/3]">
        <div className="poster-card__media">
          {!imageLoaded && <div className="absolute inset-0 skeleton" />}
          {posterUrl && (
            <img
              src={posterUrl}
              alt={title}
              className={cn(
                'w-full h-full object-cover object-top',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
            />
          )}
        </div>
      </div>
    </Link>
  );
}
