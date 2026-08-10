/**
 * Serviço para buscar conteúdo da tabela custom_content do Supabase
 * e enriquecer com dados do TMDB (poster, backdrop, título, etc.)
 */
// Removido import direto de SQL para evitar erro de build no client
// import { sql } from '@/lib/db';
import { tmdb } from './tmdb';
import type { Content } from '@/types/content';

const isClient = typeof window !== 'undefined';

export interface CustomContentRow {
  id: number;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  player_code: string;
  is_kids?: boolean;
  is_featured?: boolean;
  title?: string;
  created_at?: string;
}

export interface CustomContentItem extends Content {
  player_code: string;
  is_kids?: boolean;
  is_featured?: boolean;
}

// Cache simples em memória
let contentCache: CustomContentItem[] | null = null;
let lastFetched: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca todos os itens do custom_content e enriquece com dados do TMDB
 */
export async function getCustomContent(): Promise<CustomContentItem[]> {
  if (isClient) {
    // No cliente, buscamos via API para evitar dependencias do Node.js (pg, dns)
    try {
      const response = await fetch('/api/content/custom');
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      console.error('[customContent] Erro ao buscar via API:', err);
      return [];
    }
  }

  // No servidor, podemos usar SQL direto
  const { sql } = await import('@/lib/db');
  
  const now = Date.now();
  if (contentCache && (now - lastFetched < CACHE_DURATION)) {
    return contentCache;
  }

  const { rows: data } = await sql<CustomContentRow>`
    SELECT * FROM custom_content ORDER BY id DESC
  `;

  if (!data || data.length === 0) return [];

  // Enriquecer cada item com dados do TMDB em paralelo
  const enriched = await Promise.allSettled(
    data.map(async (row: CustomContentRow) => {
      try {
        const details = await tmdb.getDetails(row.media_type, row.tmdb_id);
        const item: CustomContentItem = {
          id: row.tmdb_id,
          title: details.title,
          name: details.name,
          overview: details.overview || '',
          poster_path: details.poster_path,
          backdrop_path: details.backdrop_path,
          vote_average: details.vote_average || 0,
          vote_count: details.vote_count || 0,
          popularity: details.popularity || 0,
          release_date: details.release_date,
          first_air_date: details.first_air_date,
          media_type: row.media_type,
          genre_ids: details.genres?.map((g: { id: number }) => g.id) || [],
          player_code: row.player_code,
          is_kids: row.is_kids,
          is_featured: row.is_featured,
        };
        return item;
      } catch (err) {
        console.error(`[custom_content] Erro ao buscar TMDB ${row.tmdb_id}:`, err);
        // Fallback mínimo se o TMDB falhar
        const fallback: CustomContentItem = {
          id: row.tmdb_id,
          title: row.title || `ID: ${row.tmdb_id}`,
          overview: '',
          poster_path: null,
          backdrop_path: null,
          vote_average: 0,
          vote_count: 0,
          popularity: 0,
          media_type: row.media_type,
          player_code: row.player_code,
          is_kids: row.is_kids,
          is_featured: row.is_featured,
        };
        return fallback;
      }
    })
  );

  const finalized = enriched
    .filter((r): r is PromiseFulfilledResult<CustomContentItem> => r.status === 'fulfilled')
    .map(r => r.value);

  // Guardar no cache para futuras buscas
  contentCache = finalized;
  lastFetched = Date.now();

  return finalized;
}

/**
 * Busca apenas filmes (media_type = 'movie') do custom_content
 */
export async function getCustomMovies(): Promise<CustomContentItem[]> {
  const all = await getCustomContent();
  return all.filter(item => item.media_type === 'movie');
}

/**
 * Busca apenas séries (media_type = 'tv') do custom_content
 */
export async function getCustomSeries(): Promise<CustomContentItem[]> {
  const all = await getCustomContent();
  return all.filter(item => item.media_type === 'tv');
}

/**
 * Busca o player_code de um conteúdo específico pelo tmdb_id e media_type
 * Retorna null se não encontrado
 */
export async function getPlayerCode(
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<string | null> {
  if (isClient) {
    // No cliente, usamos a API pública que criamos
    try {
      const response = await fetch(`/api/content/custom?tmdbId=${tmdbId}&mediaType=${mediaType}`);
      if (!response.ok) return null;
      const data = await response.json();
      return data.player_code || null;
    } catch (err) {
      console.error('[customContent] Erro ao buscar player_code no client:', err);
      return null;
    }
  }

  // No servidor, usamos SQL direto
  const { sql } = await import('@/lib/db');
  
  const { rows } = await sql<{ player_code: string }>`
    SELECT player_code FROM custom_content 
    WHERE tmdb_id = ${tmdbId} AND media_type = ${mediaType}
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  return rows[0].player_code || null;
}
