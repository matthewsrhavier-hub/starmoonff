'use client';

import { useState, useEffect, useMemo } from 'react';
import { tmdb } from '@/services/tmdb';
import { loadCatalogSeries } from '@/services/catalog';
import { HeroSection, SkeletonHero } from '@/components/content/HeroSection';
import { CatalogPageBody, CatalogSection } from '@/components/content/CatalogSection';
import { ContentGrid } from '@/components/content/ContentGrid';
import { Select } from '@/components/ui/Select';
import type { Content, Genre } from '@/types/content';

export default function SeriesPage() {
  const [mySeries, setMySeries] = useState<Content[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCatalogSeries()
      .then((data) => {
        setMySeries(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });

    tmdb.getGenres('tv').then(data => setGenres(data.genres || [])).catch(console.error);
  }, []);

  const filteredSeries = mySeries.filter((m) => {
    if (selectedGenre && !m.genre_ids?.includes(Number(selectedGenre))) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'vote_average.desc') return (b.vote_average || 0) - (a.vote_average || 0);
    if (sortBy === 'first_air_date.desc') {
      return new Date(b.first_air_date || 0).getTime() - new Date(a.first_air_date || 0).getTime();
    }
    return 0;
  });

  const heroItems = useMemo(() => {
    return [...mySeries]
      .sort((a, b) => (b.first_air_date || '').localeCompare(a.first_air_date || ''))
      .slice(0, 7);
  }, [mySeries]);

  const sortOptions = [
    { value: 'popularity.desc', label: 'Popularidade' },
    { value: 'vote_average.desc', label: 'Melhor Avaliação' },
    { value: 'first_air_date.desc', label: 'Mais Recentes' },
  ];

  const genreOptions = [
    { value: '', label: 'Todos os Gêneros' },
    ...genres.map((g) => ({ value: String(g.id), label: g.name })),
  ];

  return (
    <div className="streaming-shell relative">
      {isLoading ? (
        <SkeletonHero />
      ) : heroItems.length > 0 ? (
        <HeroSection items={heroItems} autoRotate tagline="Séries em destaque" />
      ) : null}

      <CatalogPageBody>
        <CatalogSection
          title="Todas as Séries"
          action={
            <div className="flex flex-col sm:flex-row gap-3">
              <Select options={genreOptions} value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="w-full sm:w-48" />
              <Select options={sortOptions} value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-48" />
            </div>
          }
        >
          <ContentGrid items={filteredSeries} isLoading={isLoading} columns={6} emptyMessage="Nenhuma série encontrada no seu catálogo" />
        </CatalogSection>
      </CatalogPageBody>
    </div>
  );
}
