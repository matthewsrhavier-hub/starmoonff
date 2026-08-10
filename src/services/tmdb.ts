import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE, CACHE_TTL } from '@/lib/constants';
import type { Content, ContentDetails, SeasonDetails, TMDBResponse, SearchResult } from '@/types/content';

// Cache em memória com TTL
const cache = new Map<string, { data: unknown; timestamp: number }>();

async function fetchWithCache<T>(url: string): Promise<T> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  // Limpeza profunda da chave para evitar aspas ou espaços do Netlify
  const apiKey = TMDB_API_KEY.trim().replace(/^"|"$/g, '');
  const isToken = apiKey.length > 50;
  const finalHeaders: any = {
    'accept': 'application/json'
  };
  
  let finalUrl = url;
  if (isToken) {
    // Se for Tokenv4 longo (começa com eyJ), usa Bearer
    finalHeaders['Authorization'] = `Bearer ${apiKey}`;
  } else {
    // Se for Chavev3 curta, coloca na URL (mesmo que já tenha outros parâmetros)
    const separator = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${separator}api_key=${apiKey}`;
  }

  try {
    const response = await fetch(finalUrl, { 
      next: { revalidate: 600 },
      headers: finalHeaders
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[TMDB] Falha na requisição: ${response.status} - ${finalUrl}`);
      console.error(`[TMDB] Resposta do Servidor:`, errText);
      throw new Error(`Erro TMDB: ${response.status}`);
    }

    const data = await response.json();
    cache.set(url, { data, timestamp: Date.now() });
    return data as T;
  } catch (error) {
    console.error(`[TMDB] Erro fatal de conexão para ${finalUrl}:`, error);
    throw error;
  }
}

export const tmdb = {
  getImageUrl(path: string | null, size: string = 'w500'): string {
    if (!path) return '/icons/icon-192.png';
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },

  async getTrending(
    mediaType: 'movie' | 'tv' | 'all' = 'all',
    timeWindow: 'day' | 'week' = 'week'
  ): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?language=pt-BR`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getPopular(mediaType: 'movie' | 'tv', page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/${mediaType}/popular?language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getTopRated(mediaType: 'movie' | 'tv', page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/${mediaType}/top_rated?language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getNowPlaying(page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/movie/now_playing?language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getUpcoming(page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/movie/upcoming?language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getOnTheAir(page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/tv/on_the_air?language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getDetails(mediaType: 'movie' | 'tv', id: number): Promise<ContentDetails> {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}?language=pt-BR&append_to_response=videos,credits,similar,external_ids,images`;
    return fetchWithCache<ContentDetails>(url);
  },

  /**
   * Busca a logo oficial do filme/série no TMDB.
   * Prioridade: português → inglês → sem idioma → primeiro disponível
   * Retorna a URL completa da imagem ou null se não encontrar.
   */
  async getLogo(mediaType: 'movie' | 'tv', id: number): Promise<string | null> {
    try {
      // include_image_language: sem filtro de língua para pegar todos os logos
      const url = `${TMDB_BASE_URL}/${mediaType}/${id}/images?include_image_language=pt,en,null`;
      const data = await fetchWithCache<{ logos?: { file_path: string; iso_639_1: string | null; vote_average: number }[] }>(url);
      const logos = data.logos || [];
      if (logos.length === 0) return null;

      // Preferir logo em português com maior voto
      const ptLogo = logos
        .filter(l => l.iso_639_1 === 'pt')
        .sort((a, b) => b.vote_average - a.vote_average)[0];
      if (ptLogo) return `${TMDB_IMAGE_BASE}/w500${ptLogo.file_path}`;

      // Secundário: inglês com maior voto
      const enLogo = logos
        .filter(l => l.iso_639_1 === 'en')
        .sort((a, b) => b.vote_average - a.vote_average)[0];
      if (enLogo) return `${TMDB_IMAGE_BASE}/w500${enLogo.file_path}`;

      // Fallback: qualquer logo com maior voto, preferindo as sem idioma definido
      const best = logos.sort((a, b) => {
        if (a.iso_639_1 === null && b.iso_639_1 !== null) return -1;
        if (a.iso_639_1 !== null && b.iso_639_1 === null) return 1;
        return b.vote_average - a.vote_average;
      })[0];
      if (best) return `${TMDB_IMAGE_BASE}/w500${best.file_path}`;

      return null;
    } catch {
      return null;
    }
  },


  async getSeasonDetails(tvId: number, seasonNumber: number): Promise<SeasonDetails> {
    const url = `${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?language=pt-BR`;
    return fetchWithCache<SeasonDetails>(url);
  },

  async search(query: string, page: number = 1): Promise<TMDBResponse<SearchResult>> {
    const url = `${TMDB_BASE_URL}/search/multi?language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
    return fetchWithCache<TMDBResponse<SearchResult>>(url);
  },

  async searchMovies(query: string, page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/search/movie?language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async searchTv(query: string, page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/search/tv?language=pt-BR&query=${encodeURIComponent(query)}&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getGenres(mediaType: 'movie' | 'tv'): Promise<{ genres: { id: number; name: string }[] }> {
    const url = `${TMDB_BASE_URL}/genre/${mediaType}/list?language=pt-BR`;
    return fetchWithCache(url);
  },

  async discoverByGenre(
    mediaType: 'movie' | 'tv',
    genreId: number,
    page: number = 1
  ): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/discover/${mediaType}?language=pt-BR&with_genres=${genreId}&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async discover(
    mediaType: 'movie' | 'tv',
    options: {
      page?: number;
      sort_by?: string;
      with_genres?: string;
      year?: number;
    } = {}
  ): Promise<TMDBResponse<Content>> {
    const { page = 1, sort_by = 'popularity.desc', with_genres, year } = options;
    let url = `${TMDB_BASE_URL}/discover/${mediaType}?language=pt-BR&page=${page}&sort_by=${sort_by}`;
    if (with_genres) {
      url += `&with_genres=${with_genres}`;
    }
    if (year) {
      url +=
        mediaType === 'movie'
          ? `&primary_release_year=${year}`
          : `&first_air_date_year=${year}`;
    }
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getAnime(page: number = 1, sortBy: string = 'popularity.desc'): Promise<TMDBResponse<Content>> {
    // Animes são séries japonesas de animação (genre_id: 16 = Animation, origin_country: JP)
    const url = `${TMDB_BASE_URL}/discover/tv?language=pt-BR&with_genres=16&with_origin_country=JP&sort_by=${sortBy}&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getSimilar(mediaType: 'movie' | 'tv', id: number, page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}/similar?language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getRecommendations(mediaType: 'movie' | 'tv', id: number, page: number = 1): Promise<TMDBResponse<Content>> {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}/recommendations?language=pt-BR&page=${page}`;
    return fetchWithCache<TMDBResponse<Content>>(url);
  },

  async getExternalIds(mediaType: 'movie' | 'tv', id: number): Promise<{ imdb_id: string | null }> {
    const url = `${TMDB_BASE_URL}/${mediaType}/${id}/external_ids`;
    return fetchWithCache(url);
  },

  // Helper to get title regardless of media type
  getTitle(content: Content): string {
    return content.title || content.name || 'Sem título';
  },

  // Helper to get release date regardless of media type
  getReleaseDate(content: Content): string | undefined {
    return content.release_date || content.first_air_date;
  },

  // Helper to get year from content
  getYear(content: Content): string {
    const date = this.getReleaseDate(content);
    return date ? new Date(date).getFullYear().toString() : '';
  },
};

export const superflixApi = {
  // URL base sem proxy
  // Filmes: usam IMDb ID (formato: tt1234567)
  // Séries: usam TMDB ID
  getDirectUrl(type: 'movie' | 'tv', id: string, season?: number, episode?: number): string {
    // Host atual do embed ( .cv / .rest redirecionam para cá )
    const baseUrl = 'https://superflixapi.best';
    if (type === 'movie') {
      // Filmes precisam do IMDb ID com prefixo 'tt'
      // Se já tem 'tt', usa diretamente; senão, assume que é TMDB ID e não vai funcionar
      return `${baseUrl}/filme/${id}`;
    }
    // Séries usam TMDB ID
    return `${baseUrl}/serie/${id}/${season}/${episode}`;
  },

  /**
   * Vercel: Superflix bloqueia o IP do server (proxy 403).
   * Sempre usa /player.html no browser (embed direto com referrer).
   */
  getPlayerUrl(type: 'movie' | 'tv', id: string, season?: number, episode?: number): string {
    const directUrl = this.getDirectUrl(type, id, season, episode);
    return `/player.html?url=${encodeURIComponent(directUrl)}`;
  },

  getEmbedUrl(type: 'movie' | 'tv', id: string, season?: number, episode?: number): string {
    return this.getPlayerUrl(type, id, season, episode);
  },
};
