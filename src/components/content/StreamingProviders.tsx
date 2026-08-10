'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type Tab = 'movies' | 'tv';

const providers = [
  { id: 'netflix', name: 'Netflix', logo: '/providers/netflix.svg' },
  { id: 'disney', name: 'Disney+', logo: '/providers/disneyplus.svg' },
  { id: 'prime', name: 'Amazon Prime', logo: '/providers/primevideo.png' },
  { id: 'hulu', name: 'Hulu', logo: '/providers/hulu.png' },
  { id: 'max', name: 'Max', logo: '/providers/max.svg' },
  { id: 'apple', name: 'Apple TV+', logo: '/providers/appletv.svg' },
  { id: 'paramount', name: 'Paramount+', logo: '/providers/paramountplus.svg' },
  { id: 'peacock', name: 'Peacock', logo: '/providers/peacock.svg' },
  { id: 'hbo', name: 'HBO', logo: '/providers/hbo.svg' },
  { id: 'crunchyroll', name: 'Crunchyroll', logo: '/providers/crunchyroll.svg' },
  { id: 'starplus', name: 'Star+', logo: '/providers/starplus.svg' },
  { id: 'globoplay', name: 'Globoplay', logo: '/providers/globoplay.svg' },
  { id: 'plex', name: 'Plex', logo: '/providers/plex.svg' },
  { id: 'tubi', name: 'Tubi', logo: '/providers/tubi.svg' },
  { id: 'mubi', name: 'MUBI', logo: '/providers/mubi.svg' },
  { id: 'discovery', name: 'Discovery+', logo: '/providers/discoveryplus.svg' },
  { id: 'funimation', name: 'Funimation', logo: '/providers/funimation.svg' },
  { id: 'rakuten', name: 'Rakuten', logo: '/providers/rakuten.svg' },
  { id: 'vimeo', name: 'Vimeo', logo: '/providers/vimeo.svg' },
  { id: 'imdb', name: 'IMDb TV', logo: '/providers/imdb.svg' },
];

function ProviderLogo({ src, name, large }: { src: string; name: string; large?: boolean }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="text-white text-[11px] font-bold text-center leading-tight px-1">
        {name}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={cn(
        'w-auto object-contain',
        large
          ? 'max-h-12 md:max-h-14 max-w-[140px] md:max-w-[160px] scale-110'
          : 'max-h-9 md:max-h-11 max-w-[120px] md:max-w-[140px]'
      )}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export function StreamingProviders() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('movies');
  const [selected, setSelected] = useState('netflix');

  const handleSelect = (id: string) => {
    setSelected(id);
    router.push(tab === 'movies' ? '/movies' : '/series');
  };

  return (
    <section className="w-full">
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <span className="w-[3px] h-4 sm:h-5 rounded-full bg-white shrink-0" />
        <h2 className="text-xs sm:text-sm md:text-base font-bold text-white uppercase tracking-[0.12em]">
          Streaming Providers
        </h2>
      </div>

      <div className="inline-flex items-center p-1 rounded-full bg-[#141414] border border-white/10 mb-4 sm:mb-6">
        <button
          type="button"
          onClick={() => setTab('movies')}
          className={cn(
            'px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-9',
            tab === 'movies'
              ? 'bg-[#2a2a2a] text-white shadow-sm'
              : 'text-white/45 hover:text-white/70'
          )}
        >
          Filmes
        </button>
        <button
          type="button"
          onClick={() => setTab('tv')}
          className={cn(
            'px-4 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all min-h-9',
            tab === 'tv'
              ? 'bg-[#2a2a2a] text-white shadow-sm'
              : 'text-white/45 hover:text-white/70'
          )}
        >
          Séries
        </button>
      </div>

      <div className="flex gap-2.5 sm:gap-3 md:gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
        {providers.map((provider) => {
          const active = selected === provider.id;
          return (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleSelect(provider.id)}
              className={cn(
                'flex-shrink-0 w-[128px] sm:w-[148px] md:w-[168px] h-[64px] sm:h-[72px] md:h-[80px] rounded-xl',
                'bg-[#2f2f2f] border flex flex-row items-center justify-center gap-2.5 px-3',
                'transition-all duration-200 hover:bg-[#3a3a3a] hover:scale-[1.02] active:scale-[0.98]',
                active ? 'border-white/70' : 'border-white/15 hover:border-white/30'
              )}
            >
              <div className="h-12 md:h-14 flex-1 flex items-center justify-center min-w-0 overflow-visible">
                <ProviderLogo
                  src={provider.logo}
                  name={provider.name}
                  large={provider.id === 'prime'}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
