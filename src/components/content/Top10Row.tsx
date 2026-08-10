'use client';

import Link from 'next/link';
import { tmdb } from '@/services/tmdb';
import { getRankNumberImage } from '@/lib/rankNumbers';
import { cn } from '@/lib/utils';
import type { Content } from '@/types/content';

interface Top10RowProps {
  title?: string;
  items: Content[];
  className?: string;
}

export function Top10Row({ title = 'Top 10', items, className }: Top10RowProps) {
  const top = items.slice(0, 10);
  if (top.length === 0) return null;

  return (
    <section className={cn('mb-8 md:mb-10', className)}>
      <div className="flex items-center justify-between mb-3 md:mb-4 px-0">
        <h2 className="text-[15px] md:text-lg font-semibold text-white">{title}</h2>
      </div>

      <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scrollbar-hide pt-1 pb-3 scroll-smooth -mx-1 px-1">
        {top.map((item, index) => {
          const rank = index + 1;
          const rankSrc = getRankNumberImage(rank);
          const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
          const href = `/watch/${mediaType}/${item.id}`;
          const poster = item.poster_path
            ? tmdb.getImageUrl(item.poster_path, 'w500')
            : null;
          const name = item.title || item.name || 'Sem título';

          return (
            <Link
              key={`${mediaType}-${item.id}`}
              href={href}
              className="group flex-shrink-0 flex items-end gap-0 md:gap-1"
            >
              {rankSrc && (
                <img
                  src={rankSrc}
                  alt={`${rank}`}
                  className="h-14 sm:h-16 md:h-[4.5rem] lg:h-20 w-auto object-contain select-none shrink-0 mb-0.5 -mr-0.5"
                  loading="lazy"
                />
              )}

              <div
                className={cn(
                  'w-[86px] sm:w-[95px] md:w-[115px] lg:w-[128px] aspect-[2/3]',
                  'rounded-lg sm:rounded-xl bg-[#1a1a1a]',
                  'border border-white/18 transition-colors duration-300',
                  'group-hover:border-white/45'
                )}
              >
                <div className="w-full h-full rounded-[7px] sm:rounded-[11px] overflow-hidden">
                  {poster ? (
                    <img
                      src={poster}
                      alt={name}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-white/40 p-2 text-center">
                      {name}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
