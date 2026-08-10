'use client';

import { useState, useEffect, useMemo } from 'react';
import { HeroSection, SkeletonHero } from '@/components/content/HeroSection';
import { CatalogPageBody, CatalogSection } from '@/components/content/CatalogSection';
import { ContentGrid } from '@/components/content/ContentGrid';
import { StreamingProviders } from '@/components/content/StreamingProviders';
import { ContinueWatchingRow } from '@/components/content/ContinueWatchingRow';
import { SkeletonRow } from '@/components/content/CategoryRow';
import { Top10Row } from '@/components/content/Top10Row';
import { GENRES, TV_GENRES } from '@/lib/constants';
import type { CatalogBundle } from '@/services/catalog';
import type { Content } from '@/types/content';

function isBlockedTitle(item: Content) {
  const title = `${item.title || ''} ${item.name || ''}`.toLowerCase();
  return title.includes('diabo') || title.includes('devil') || title.includes('boca do');
}

function byGenre(items: Content[], genreId: number) {
  return items.filter((item) => item.genre_ids?.includes(genreId));
}

function recentFirst(items: Content[]) {
  return [...items].sort((a, b) => {
    const dateA = a.release_date || a.first_air_date || '';
    const dateB = b.release_date || b.first_air_date || '';
    return dateB.localeCompare(dateA);
  });
}

function topRated(items: Content[]) {
  return [...items]
    .filter((item) => (item.vote_average || 0) > 0)
    .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
}

function preferCustomThenBrowse(custom: Content[], browse: Content[], limit: number) {
  if (custom.length >= limit) return custom.slice(0, limit);
  const ids = new Set(custom.map((item) => item.id));
  return [...custom, ...browse.filter((item) => !ids.has(item.id))].slice(0, limit);
}

export default function HomePage() {
  const [data, setData] = useState<CatalogBundle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { loadHomeCatalog } = await import('@/services/catalog');
        const catalog = await loadHomeCatalog();
        if (!cancelled) setData(catalog);
      } catch (err) {
        console.error('Erro ao carregar catálogo:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const customMovies = useMemo(
    () => (data?.customMovies || []).filter((item) => !isBlockedTitle(item)),
    [data]
  );
  const customSeries = useMemo(
    () => (data?.customSeries || []).filter((item) => !isBlockedTitle(item)),
    [data]
  );
  const movies = useMemo(
    () => (data?.browseMovies || []).filter((item) => !isBlockedTitle(item)),
    [data]
  );
  const series = useMemo(
    () => (data?.browseSeries || []).filter((item) => !isBlockedTitle(item)),
    [data]
  );

  const added = useMemo(
    () => recentFirst([...customMovies, ...customSeries]),
    [customMovies, customSeries]
  );

  const heroItems = useMemo(
    () => preferCustomThenBrowse(added, recentFirst([...movies, ...series]), 5),
    [added, movies, series]
  );

  const featured = useMemo(
    () => preferCustomThenBrowse(added, topRated([...movies, ...series]), 12),
    [added, movies, series]
  );

  const top10 = useMemo(
    () => preferCustomThenBrowse(added, topRated([...movies, ...series]), 10),
    [added, movies, series]
  );

  const rows = useMemo(() => {
    const list: { title: string; href?: string; items: Content[]; variant?: 'poster' | 'backdrop' }[] = [
      {
        title: 'Adicionados',
        href: '/movies',
        items: added.slice(0, 24),
      },
      {
        title: 'Filmes',
        href: '/movies',
        items: (customMovies.length > 0 ? customMovies : movies).slice(0, 18),
      },
      {
        title: 'Séries',
        href: '/series',
        items: (customSeries.length > 0 ? customSeries : series).slice(0, 18),
      },
      {
        title: 'Lançamentos',
        items: recentFirst(movies).slice(0, 18),
      },
      {
        title: 'Ação',
        href: '/movies',
        items: byGenre(movies, GENRES.action).slice(0, 18),
      },
      {
        title: 'Aventura',
        href: '/movies',
        items: byGenre(movies, GENRES.adventure).slice(0, 18),
      },
      {
        title: 'Comédia',
        href: '/movies',
        items: byGenre(movies, GENRES.comedy).slice(0, 18),
      },
      {
        title: 'Drama',
        href: '/movies',
        items: byGenre(movies, GENRES.drama).slice(0, 18),
      },
      {
        title: 'Terror',
        href: '/movies',
        items: byGenre(movies, GENRES.horror).slice(0, 18),
      },
      {
        title: 'Ficção científica',
        href: '/movies',
        items: byGenre(movies, GENRES.sciFi).slice(0, 18),
      },
      {
        title: 'Fantasia',
        href: '/movies',
        items: byGenre(movies, GENRES.fantasy).slice(0, 18),
      },
      {
        title: 'Romance',
        href: '/movies',
        items: byGenre(movies, GENRES.romance).slice(0, 18),
      },
      {
        title: 'Suspense',
        href: '/movies',
        items: byGenre(movies, GENRES.thriller).slice(0, 18),
      },
      {
        title: 'Animação',
        href: '/movies',
        items: byGenre(movies, GENRES.animation).slice(0, 18),
      },
      {
        title: 'Família',
        href: '/movies',
        items: byGenre(movies, GENRES.family).slice(0, 18),
      },
      {
        title: 'Crime',
        href: '/movies',
        items: byGenre(movies, GENRES.crime).slice(0, 18),
      },
      {
        title: 'Documentários',
        href: '/movies',
        items: byGenre(movies, GENRES.documentary).slice(0, 18),
      },
      {
        title: 'Séries de ação e aventura',
        href: '/series',
        items: byGenre(series, TV_GENRES.actionAdventure).slice(0, 18),
      },
      {
        title: 'Séries de drama',
        href: '/series',
        items: byGenre(series, TV_GENRES.drama).slice(0, 18),
      },
      {
        title: 'Animes e animação',
        href: '/series',
        items: byGenre(series, TV_GENRES.animation).slice(0, 18),
      },
      {
        title: 'Melhores avaliações',
        items: topRated(movies).slice(0, 18),
      },
    ];

    return list.filter((row) => row.items.length > 0);
  }, [added, customMovies, customSeries, movies, series]);

  if (isLoading) {
    return (
      <div className="streaming-shell">
        <SkeletonHero />
        <CatalogPageBody>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </CatalogPageBody>
      </div>
    );
  }

  return (
    <div className="streaming-shell">
      {heroItems.length > 0 && (
        <HeroSection
          items={heroItems}
          autoRotate
          rotateInterval={8000}
          tagline="Novos episódios toda semana"
        />
      )}

      <CatalogPageBody>
        <div className="mb-5 md:mb-6">
          <StreamingProviders />
        </div>

        <ContinueWatchingRow />

        {featured.length > 0 && (
          <CatalogSection title="Featured">
            <ContentGrid items={featured} variant="backdrop" layout="row" minimal />
          </CatalogSection>
        )}

        {top10.length > 0 && <Top10Row title="Top 10" items={top10} />}

        {rows.map((row) => (
          <CatalogSection key={row.title} title={row.title} href={row.href}>
            <ContentGrid
              items={row.items}
              variant={row.variant || 'poster'}
              layout="row"
              minimal={row.variant === 'backdrop'}
            />
          </CatalogSection>
        ))}
      </CatalogPageBody>
    </div>
  );
}
