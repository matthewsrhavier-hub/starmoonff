import { NextResponse } from 'next/server';
import { tmdb } from '@/services/tmdb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const year = 2026;

    const [movies2026, tv2026] = await Promise.all([
      tmdb.discover('movie', { year, sort_by: 'popularity.desc', page: 1 }),
      tmdb.discover('tv', { year, sort_by: 'popularity.desc', page: 1 }),
    ]);

    let results = [...(movies2026.results || []), ...(tv2026.results || [])].filter(
      (item) => item.poster_path
    );

    // Fallback se 2026 ainda vier vazio
    if (results.length < 8) {
      const [popularMovies, upcoming, popularTv] = await Promise.all([
        tmdb.getPopular('movie', 1),
        tmdb.getUpcoming(1),
        tmdb.getPopular('tv', 1),
      ]);

      results = [
        ...results,
        ...(upcoming.results || []),
        ...(popularMovies.results || []),
        ...(popularTv.results || []),
      ].filter((item) => item.poster_path);
    }

    const seen = new Set<string>();
    const posters = results
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .map((item) => {
        const key = `${item.media_type || 'item'}-${item.id}`;
        if (seen.has(key) || seen.has(String(item.id))) return null;
        seen.add(key);
        seen.add(String(item.id));
        return {
          id: item.id,
          title: tmdb.getTitle(item),
          src: tmdb.getImageUrl(item.poster_path, 'w342'),
        };
      })
      .filter(Boolean)
      .slice(0, 20);

    return NextResponse.json({ posters, year });
  } catch (error: any) {
    console.error('[/api/tmdb/posters]', error?.message || error);
    return NextResponse.json(
      { posters: [], error: 'Falha ao buscar posters no TMDB' },
      { status: 500 }
    );
  }
}
