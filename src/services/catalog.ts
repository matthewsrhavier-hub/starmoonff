import type { Content } from '@/types/content';
import { getCustomMovies, getCustomSeries } from '@/services/customContent';
import { tmdb } from '@/services/tmdb';

export type CatalogBundle = {
  /** Filmes que você adicionou no admin/Supabase */
  customMovies: Content[];
  /** Séries que você adicionou no admin/Supabase */
  customSeries: Content[];
  /** Catálogo para fileiras (seus itens + TMDB, sem duplicar) */
  browseMovies: Content[];
  browseSeries: Content[];
};

function withMediaType(items: Content[], mediaType: 'movie' | 'tv'): Content[] {
  return items.map((item) => ({
    ...item,
    media_type: item.media_type || mediaType,
  }));
}

function uniqueById(items: Content[]): Content[] {
  const map = new Map<number, Content>();
  for (const item of items) {
    if (item?.id != null && !map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

async function loadTmdbMovies(): Promise<Content[]> {
  const [trending, popular1, popular2, topRated, nowPlaying] = await Promise.all([
    tmdb.getTrending('movie', 'week'),
    tmdb.getPopular('movie', 1),
    tmdb.getPopular('movie', 2),
    tmdb.getTopRated('movie', 1),
    tmdb.getNowPlaying(1),
  ]);

  return uniqueById(
    withMediaType(
      [
        ...(trending.results || []),
        ...(popular1.results || []),
        ...(popular2.results || []),
        ...(topRated.results || []),
        ...(nowPlaying.results || []),
      ],
      'movie'
    )
  );
}

async function loadTmdbSeries(): Promise<Content[]> {
  const [trending, popular1, popular2, topRated, onAir] = await Promise.all([
    tmdb.getTrending('tv', 'week'),
    tmdb.getPopular('tv', 1),
    tmdb.getPopular('tv', 2),
    tmdb.getTopRated('tv', 1),
    tmdb.getOnTheAir(1),
  ]);

  return uniqueById(
    withMediaType(
      [
        ...(trending.results || []),
        ...(popular1.results || []),
        ...(popular2.results || []),
        ...(topRated.results || []),
        ...(onAir.results || []),
      ],
      'tv'
    )
  );
}

function mergePreferCustom(custom: Content[], fromTmdb: Content[]): Content[] {
  const customIds = new Set(custom.map((item) => item.id));
  return [...custom, ...fromTmdb.filter((item) => !customIds.has(item.id))];
}

/** Filmes adicionados (sem misturar TMDB). */
export async function loadCatalogMovies(): Promise<Content[]> {
  try {
    const custom = await getCustomMovies();
    if (custom.length > 0) return custom;
  } catch (err) {
    console.error('[catalog] Falha no custom movies:', err);
  }

  try {
    return await loadTmdbMovies();
  } catch (err) {
    console.error('[catalog] Falha no TMDB movies:', err);
    return [];
  }
}

/** Séries adicionadas (sem misturar TMDB). */
export async function loadCatalogSeries(): Promise<Content[]> {
  try {
    const custom = await getCustomSeries();
    if (custom.length > 0) return custom;
  } catch (err) {
    console.error('[catalog] Falha no custom series:', err);
  }

  try {
    return await loadTmdbSeries();
  } catch (err) {
    console.error('[catalog] Falha no TMDB series:', err);
    return [];
  }
}

/** Home: separa o que você adicionou do browse TMDB. */
export async function loadHomeCatalog(): Promise<CatalogBundle> {
  const [customMovies, customSeries, tmdbMovies, tmdbSeries] = await Promise.all([
    getCustomMovies().catch((err) => {
      console.error('[catalog] Falha no custom movies:', err);
      return [] as Content[];
    }),
    getCustomSeries().catch((err) => {
      console.error('[catalog] Falha no custom series:', err);
      return [] as Content[];
    }),
    loadTmdbMovies().catch((err) => {
      console.error('[catalog] Falha no TMDB movies:', err);
      return [] as Content[];
    }),
    loadTmdbSeries().catch((err) => {
      console.error('[catalog] Falha no TMDB series:', err);
      return [] as Content[];
    }),
  ]);

  return {
    customMovies,
    customSeries,
    browseMovies: mergePreferCustom(customMovies, tmdbMovies),
    browseSeries: mergePreferCustom(customSeries, tmdbSeries),
  };
}
