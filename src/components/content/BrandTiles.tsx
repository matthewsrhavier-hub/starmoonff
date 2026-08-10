'use client';

import Link from 'next/link';
import { Film, Tv, Radio, Zap, Sparkles, Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';

const tiles = [
  {
    href: '/movies',
    label: 'Filmes',
    icon: Film,
    gradient: 'from-[#1a1a1a] via-[#141414] to-[#0a0a0a]',
    accent: 'text-white',
  },
  {
    href: '/series',
    label: 'Séries',
    icon: Tv,
    gradient: 'from-[#1a1a1a] via-[#141414] to-[#0a0a0a]',
    accent: 'text-white',
  },
  {
    href: '/tv',
    label: 'TV ao Vivo',
    icon: Radio,
    gradient: 'from-[#1a1a1a] via-[#141414] to-[#0a0a0a]',
    accent: 'text-white',
  },
  {
    href: '/movies',
    label: 'Ação',
    icon: Zap,
    gradient: 'from-[#1a1a1a] via-[#141414] to-[#0a0a0a]',
    accent: 'text-white',
  },
  {
    href: '/movies',
    label: 'Cinema',
    icon: Clapperboard,
    gradient: 'from-[#1a1a1a] via-[#141414] to-[#0a0a0a]',
    accent: 'text-white',
  },
  {
    href: '/',
    label: 'Animação',
    icon: Sparkles,
    gradient: 'from-[#1a1a1a] via-[#141414] to-[#0a0a0a]',
    accent: 'text-white',
  },
];

export function BrandTiles() {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 mb-12">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link
            key={tile.label}
            href={tile.href}
            className={cn(
              'group relative aspect-[16/10] rounded-xl overflow-hidden',
              'bg-gradient-to-br border border-white/[0.06]',
              'hover:border-white/15 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300',
              tile.gradient
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/[0.03]" />
            <div className="relative h-full flex flex-col items-center justify-center gap-2 p-3">
              <Icon
                size={22}
                strokeWidth={1.5}
                className={cn('opacity-70 group-hover:opacity-100 transition-opacity', tile.accent)}
              />
              <span className="text-[10px] md:text-xs font-bold text-white/90 tracking-wide text-center leading-tight">
                {tile.label}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
