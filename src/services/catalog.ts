import type { Content } from '@/types/content';
import { getCustomMovies, getCustomSeries } from '@/services/customContent';
import { tmdb } from '@/services/tmdb';

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

/** Filmes: catálogo próprio primeiro, completado com populares do TMDB. */
export async function loadCatalogMovies(): Promise<Content[]> {
  const [custom, fromTmdb] = await Promise.all([
    getCustomMovies().catch((err) => {
      console.error('[catalog] Falha no custom movies:', err);
      return [] as Content[];
    }),
    loadTmdbMovies().catch((err) => {
      console.error('[catalog] Falha no TMDB movies:', err);
      return [] as Content[];
    }),
  ]);

  const customIds = new Set(custom.map((item) => item.id));
  return [...custom, ...fromTmdb.filter((item) => !customIds.has(item.id))];
}

/** Séries: catálogo próprio primeiro, completado com populares do TMDB. */
export async function loadCatalogSeries(): Promise<Content[]> {
  const [custom, fromTmdb] = await Promise.all([
    getCustomSeries().catch((err) => {
      console.error('[catalog] Falha no custom series:', err);
      return [] as Content[];
    }),
    loadTmdbSeries().catch((err) => {
      console.error('[catalog] Falha no TMDB series:', err);
      return [] as Content[];
    }),
  ]);

  const customIds = new Set(custom.map((item) => item.id));
  return [...custom, ...fromTmdb.filter((item) => !customIds.has(item.id))];
}

/** Home: custom se existir; senão popular/trending do TMDB. */
export async function loadHomeCatalog(): Promise<{
  myCatalogMovies: Content[];
  myCatalogSeries: Content[];
}> {
  const [myCatalogMovies, myCatalogSeries] = await Promise.all([
    loadCatalogMovies(),
    loadCatalogSeries(),
  ]);
  return { myCatalogMovies, myCatalogSeries };
}
