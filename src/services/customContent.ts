import type { Content } from '@/types/content';

export interface CustomContentItem extends Content {
  player_code: string;
  is_kids?: boolean;
  is_featured?: boolean;
}

let contentCache: CustomContentItem[] | null = null;
let lastFetched: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Busca todos os itens do custom_content através da API Next.js segura
 */
/** Retorna cache em memória (síncrono) para pintar a home sem skeleton. */
export function getCachedCustomContent(): CustomContentItem[] | null {
  return contentCache;
}

export async function getCustomContent(): Promise<CustomContentItem[]> {
  const now = Date.now();
  if (contentCache && (now - lastFetched < CACHE_DURATION)) {
    return contentCache;
  }

  try {
    const response = await fetch('/api/content/custom');
    if (!response.ok) return [];
    const data = await response.json();
    
    contentCache = data;
    lastFetched = Date.now();
    return data;
  } catch (err) {
    console.error('[custom_content] Erro ao buscar da API:', err);
    return [];
  }
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
  try {
    const response = await fetch(`/api/content/custom?tmdbId=${tmdbId}&mediaType=${mediaType}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.player_code || null;
  } catch (err) {
    console.error('[custom_content] Erro ao buscar player_code da API:', err);
    return null;
  }
}
