import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { tmdb } from '@/services/tmdb';
import type { Content } from '@/types/content';

export const dynamic = 'force-dynamic';

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

// GET /api/content/custom — lista todo o catálogo customizado enriquecido com TMDB
// GET /api/content/custom?tmdbId=xxx&mediaType=movie — retorna um player_code específico
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tmdbId = searchParams.get('tmdbId');
    const mediaType = searchParams.get('mediaType');

    // Busca de player_code específico
    if (tmdbId && mediaType) {
      const { data, error } = await supabase
        .from('custom_content')
        .select('player_code')
        .eq('tmdb_id', Number(tmdbId))
        .eq('media_type', mediaType)
        .maybeSingle();

      if (error) {
        console.warn('[/api/content/custom] Erro ao buscar player_code do banco:', error.message);
        return NextResponse.json({ player_code: null }, { status: 200 });
      }

      return NextResponse.json({ player_code: data?.player_code || null });
    }

    // Busca de todo o catálogo
    const { data, error } = await supabase
      .from('custom_content')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('[/api/content/custom] Erro ao buscar:', error.message);
      return NextResponse.json([], { status: 200 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Enriquecer com dados do TMDB em paralelo
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
        } catch (err: any) {
          // Fallback mínimo se o TMDB falhar
          console.error(`[TMDB_ERROR] Falha ao enriquecer ${row.media_type} ID:${row.tmdb_id}. Verifique se o ID existe no TMDB. Erro: ${err.message}`);
          return {
            id: row.tmdb_id,
            title: row.title || `Erro ID: ${row.tmdb_id}`,
            overview: 'Erro: Não foi possível carregar os detalhes deste conteúdo do TMDB.',
            poster_path: null,
            backdrop_path: null,
            vote_average: 0,
            vote_count: 0,
            popularity: 0,
            media_type: row.media_type,
            player_code: row.player_code,
            is_kids: row.is_kids,
            is_featured: row.is_featured,
          } as CustomContentItem;
        }
      })
    );

    const finalized = enriched
      .filter((r): r is PromiseFulfilledResult<CustomContentItem> => r.status === 'fulfilled')
      .map(r => r.value);

    return NextResponse.json(finalized, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (err: any) {
    console.error('[/api/content/custom] Erro interno:', err.message);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/content/custom — adiciona ou edita um filme/série no catálogo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tmdb_id, media_type, player_code, title } = body;

    if (!tmdb_id || !media_type || player_code === undefined) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const payload = {
      tmdb_id: Number(tmdb_id),
      media_type,
      player_code,
      title,
    };

    // Tenta usar primeiro o cliente administrativo (service_role)
    const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
    let db = supabaseAdmin;

    // Fallback para o cliente padrão caso a service_role key não esteja definida
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      db = supabase;
    }

    const { data, error } = await db
      .from('custom_content')
      .upsert(payload, { onConflict: 'tmdb_id' })
      .select()
      .maybeSingle();

    if (error) {
      console.error('[/api/content/custom POST] Erro Supabase:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[/api/content/custom POST] Erro interno:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
