import { NextRequest, NextResponse } from 'next/server';
import { sql, isOfflineMode, inMemoryData } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const profileId = String(request.nextUrl.searchParams.get('profile_id') || 'default');

    if (isOfflineMode) {
      const seen = new Set<string>();
      const continueWatching = inMemoryData.watchHistory
        .filter(
          (h) =>
            h.user_id === user.userId &&
            String(h.profile_id || 'default') === profileId &&
            h.progress > 0 &&
            h.progress < 0.95
        )
        .sort((a, b) => new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime())
        .filter((h) => {
          const key = `${h.media_type}-${h.tmdb_id}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 20)
        .map((h) => ({
          ...h,
          updated_at: new Date(h.watched_at).getTime(),
        }));
      return NextResponse.json(continueWatching);
    }

    // 1 linha por título (último episódio/progresso) — evita várias entradas da mesma série
    const result = await sql`
      SELECT DISTINCT ON (media_type, tmdb_id) *
      FROM watch_history
      WHERE user_id = ${user.userId}
        AND progress > 0
        AND progress < 0.95
      ORDER BY media_type, tmdb_id, watched_at DESC
      LIMIT 40
    `;

    const rows = [...result.rows].sort(
      (a: any, b: any) =>
        new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime()
    );

    return NextResponse.json(
      rows.slice(0, 20).map((row: any) => ({
        ...row,
        profile_id: profileId,
        updated_at: new Date(row.watched_at).getTime(),
      }))
    );
  } catch (error) {
    console.error('Get continue watching error:', error);
    return NextResponse.json({ error: 'Erro ao buscar continuar assistindo' }, { status: 500 });
  }
}
