'use client';

import { useState, useEffect } from 'react';
import { ContentGrid } from './ContentGrid';
import { tmdb } from '@/services/tmdb';
import { getCustomContent } from '@/services/customContent';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import type { Content } from '@/types/content';

interface SearchResultsProps {
  query: string;
  onFavorite?: (content: Content) => void;
  favorites?: number[];
}

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Pontuação de similaridade local (título / nome / overview). */
function scoreMatch(item: Content, query: string): number {
  const q = normalize(query);
  if (!q) return 0;

  const title = normalize(item.title || item.name || '');
  const overview = normalize(item.overview || '');
  const tokens = q.split(/\s+/).filter((t) => t.length > 0);

  if (!title) return 0;
  if (title === q) return 100;
  if (title.startsWith(q)) return 92;
  if (title.includes(q)) return 85;

  const words = title.split(/[^a-z0-9]+/).filter(Boolean);
  if (words.some((w) => w.startsWith(q) || q.startsWith(w) && w.length >= 3)) return 78;

  const allTokens = tokens.every((tok) => title.includes(tok));
  if (allTokens && tokens.length > 0) return 72;

  const hitCount = tokens.filter((tok) => title.includes(tok)).length;
  if (hitCount > 0) return 50 + hitCount * 8;

  // overview / sinopse — útil para nomes de personagens (ex.: "aang")
  if (q.length >= 3 && overview.includes(q)) return 45;

  // sequência de caracteres (fuzzy leve): a-a-n-g dentro do título
  if (q.length >= 3) {
    let ti = 0;
    for (let i = 0; i < title.length && ti < q.length; i++) {
      if (title[i] === q[ti]) ti++;
    }
    if (ti === q.length) return 35;
  }

  return 0;
}

export function SearchResults({ query, onFavorite, favorites = [] }: SearchResultsProps) {
  const [results, setResults] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    if (query && query.trim().length > 0) {
      performSearch();
    } else {
      setResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const q = query.trim();
      const catalog = await getCustomContent();
      const scores = new Map<string, number>();
      const items = new Map<string, Content>();

      const addHit = (item: Content, score: number) => {
        const key = `${item.media_type}-${item.id}`;
        const prev = scores.get(key) || 0;
        if (score > prev) {
          scores.set(key, score);
          items.set(key, item);
        }
      };

      // 1) Catálogo local — títulos / sinopses semelhantes
      for (const item of catalog) {
        const score = scoreMatch(item, q);
        if (score > 0) addHit(item, score);
      }

      // 2) TMDB — títulos/personagens parecidos cruzados com o catálogo
      try {
        const tmdbRes = await tmdb.search(q);
        const catalogByKey = new Map(catalog.map((c) => [`${c.media_type}-${c.id}`, c]));

        for (const hit of tmdbRes.results || []) {
          if (hit.media_type !== 'movie' && hit.media_type !== 'tv') continue;
          const key = `${hit.media_type}-${hit.id}`;
          const local = catalogByKey.get(key);
          if (local) addHit(local, 88);
        }
      } catch {
        // TMDB opcional — segue só com match local
      }

      // 3) Se ainda pouco resultado, busca por cada palavra da query
      if (items.size < 8) {
        const tokens = normalize(q)
          .split(/\s+/)
          .filter((t) => t.length >= 3);
        for (const tok of tokens) {
          for (const item of catalog) {
            const score = scoreMatch(item, tok);
            if (score >= 45) addHit(item, score - 5);
          }
        }
      }

      const ranked = Array.from(items.entries())
        .sort(
          ([ka, a], [kb, b]) =>
            (scores.get(kb) || 0) - (scores.get(ka) || 0) ||
            (b.popularity || 0) - (a.popularity || 0)
        )
        .map(([, item]) => item);

      setResults(ranked);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults =
    filter === 'all'
      ? results
      : results.filter((item) => item.media_type === filter);

  const movieCount = results.filter((r) => r.media_type === 'movie').length;
  const tvCount = results.filter((r) => r.media_type === 'tv').length;

  if (!query || query.trim().length === 0) {
    return null;
  }

  return (
    <div>
      <h1 className="text-headline text-white mb-1">
        Resultados para &ldquo;{query}&rdquo;
      </h1>
      <p className="text-[var(--text-secondary)] text-sm mb-4">
        {results.length} {results.length === 1 ? 'título encontrado' : 'títulos encontrados'}
      </p>

      <Tabs defaultValue="all" onChange={(value) => setFilter(value as 'all' | 'movie' | 'tv')}>
        <TabsList className="mb-5">
          <TabsTrigger value="all">Todos ({results.length})</TabsTrigger>
          <TabsTrigger value="movie">Filmes ({movieCount})</TabsTrigger>
          <TabsTrigger value="tv">Séries ({tvCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ContentGrid
            items={filteredResults}
            isLoading={isLoading}
            showType={true}
            columns={6}
            onFavorite={onFavorite}
            favorites={favorites}
            emptyMessage="Nenhum resultado encontrado"
          />
        </TabsContent>

        <TabsContent value="movie">
          <ContentGrid
            items={filteredResults}
            isLoading={isLoading}
            columns={6}
            onFavorite={onFavorite}
            favorites={favorites}
            emptyMessage="Nenhum filme encontrado"
          />
        </TabsContent>

        <TabsContent value="tv">
          <ContentGrid
            items={filteredResults}
            isLoading={isLoading}
            columns={6}
            onFavorite={onFavorite}
            favorites={favorites}
            emptyMessage="Nenhuma série encontrada"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
