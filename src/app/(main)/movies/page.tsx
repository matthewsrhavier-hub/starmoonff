'use client';

import { useState, useEffect, useMemo } from 'react';
import { tmdb } from '@/services/tmdb';
import { getCustomMovies } from '@/services/customContent';
import { HeroSection, SkeletonHero } from '@/components/content/HeroSection';
import { CatalogPageBody, CatalogSection } from '@/components/content/CatalogSection';
import { ContentGrid } from '@/components/content/ContentGrid';
import { Select } from '@/components/ui/Select';
import type { Content, Genre } from '@/types/content';

export default function MoviesPage() {
  const [myMovies, setMyMovies] = useState<Content[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCustomMovies().then((data) => {
      setMyMovies(data);
      setIsLoading(false);
    }).catch(console.error);

    tmdb.getGenres('movie').then(data => setGenres(data.genres || [])).catch(console.error);
  }, []);

  const filteredMovies = myMovies.filter((m) => {
    if (selectedGenre && !m.genre_ids?.includes(Number(selectedGenre))) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'vote_average.desc') return (b.vote_average || 0) - (a.vote_average || 0);
    if (sortBy === 'release_date.desc') {
      return new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime();
    }
    return 0;
  });

  const heroItems = useMemo(() => {
    return [...myMovies]
      .sort((a, b) => (b.release_date || '').localeCompare(a.release_date || ''))
      .slice(0, 7);
  }, [myMovies]);

  const sortOptions = [
    { value: 'popularity.desc', label: 'Popularidade' },
    { value: 'vote_average.desc', label: 'Melhor Avaliação' },
    { value: 'release_date.desc', label: 'Mais Recentes' },
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
        <HeroSection items={heroItems} autoRotate tagline="Filmes em destaque" />
      ) : null}

      <CatalogPageBody>
        <CatalogSection
          title="Todos os Filmes"
          action={
            <div className="flex flex-col sm:flex-row gap-3">
              <Select options={genreOptions} value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="w-full sm:w-48" />
              <Select options={sortOptions} value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-48" />
            </div>
          }
        >
          <ContentGrid items={filteredMovies} isLoading={isLoading} columns={6} emptyMessage="Nenhum filme encontrado no seu catálogo" />
        </CatalogSection>
      </CatalogPageBody>
    </div>
  );
}
