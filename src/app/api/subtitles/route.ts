import { NextRequest, NextResponse } from 'next/server';
import {
  buildStremioSearchUrl,
  decodeSubtitleBytes,
  listAvailableLanguages,
  listSubtitlesForLang,
  normalizeLangCode,
  srtToVtt,
  type StremioSubtitle,
} from '@/lib/subtitles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_SUB_HOSTS = [
  'strem.io',
  'opensubtitles.org',
  'opensubtitles.com',
];

function isAllowedSubtitleUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return ALLOWED_SUB_HOSTS.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`)
    );
  } catch {
    return false;
  }
}

async function resolveImdbId(
  imdbId: string | null,
  tmdbId: number | null,
  mediaType: 'movie' | 'tv'
): Promise<string | null> {
  if (imdbId) {
    return imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`;
  }
  if (!tmdbId) return null;

  const token = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!token) return null;

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/external_ids`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        next: { revalidate: 86400 },
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { imdb_id?: string | null };
    return data.imdb_id || null;
  } catch {
    return null;
  }
}

async function fetchSubtitleCatalog(opts: {
  imdbId: string;
  mediaType: 'movie' | 'tv';
  season: number;
  episode: number;
}): Promise<StremioSubtitle[]> {
  const searchUrl = buildStremioSearchUrl(opts);
  const searchRes = await fetch(searchUrl, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 1800 },
  });
  if (!searchRes.ok) {
    throw new Error(`search_${searchRes.status}`);
  }
  const payload = (await searchRes.json()) as { subtitles?: StremioSubtitle[] };
  return payload.subtitles || [];
}

async function downloadAsVtt(
  fileUrl: string,
  encodingHint?: string | null
): Promise<string | null> {
  if (!isAllowedSubtitleUrl(fileUrl)) return null;

  try {
    const fileRes = await fetch(fileUrl, {
      headers: {
        Accept: 'text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 StarmoonSubtitles/1.0',
      },
      cache: 'no-store',
    });
    if (!fileRes.ok) return null;

    const buffer = await fileRes.arrayBuffer();
    if (!buffer || buffer.byteLength < 16) return null;

    const srt = decodeSubtitleBytes(buffer, encodingHint);
    const vtt = srtToVtt(srt);
    if (!vtt.includes('-->')) return null;
    return vtt;
  } catch {
    return null;
  }
}

async function downloadFirstWorking(
  candidates: StremioSubtitle[]
): Promise<{ vtt: string; lang: string } | null> {
  // Tenta até 8 arquivos do idioma (alguns links do provedor quebram)
  for (const candidate of candidates.slice(0, 8)) {
    const vtt = await downloadAsVtt(candidate.url, candidate.SubEncoding);
    if (vtt) {
      return {
        vtt,
        lang: normalizeLangCode(candidate.lang) || 'und',
      };
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mediaType = (searchParams.get('type') || 'movie') as 'movie' | 'tv';
  const season = Number(searchParams.get('season')) || 1;
  const episode = Number(searchParams.get('episode')) || 1;
  const tmdbId = Number(searchParams.get('tmdbId')) || null;
  const rawImdb = searchParams.get('imdbId') || searchParams.get('imdb');
  const wantList = searchParams.get('list') === '1';
  const preferredLang = normalizeLangCode(searchParams.get('lang'));
  const directUrl = searchParams.get('url');

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
  }

  const imdbId = await resolveImdbId(rawImdb, tmdbId, mediaType);
  if (!imdbId) {
    return NextResponse.json({ error: 'IMDb ID não encontrado' }, { status: 404 });
  }

  try {
    const subs = await fetchSubtitleCatalog({
      imdbId,
      mediaType,
      season,
      episode,
    });

    if (wantList) {
      const languages = listAvailableLanguages(subs).map(({ code, label, flag, url }) => ({
        code,
        label,
        flag,
        url,
      }));
      return NextResponse.json(
        { imdbId, languages },
        {
          headers: {
            'Cache-Control': 'public, max-age=600, stale-while-revalidate=3600',
          },
        }
      );
    }

    // 1) Tenta URL explícita do idioma clicado
    if (directUrl && isAllowedSubtitleUrl(directUrl)) {
      const directVtt = await downloadAsVtt(directUrl, searchParams.get('encoding'));
      if (directVtt) {
        return new NextResponse(directVtt, {
          status: 200,
          headers: {
            'Content-Type': 'text/vtt; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Subtitle-Lang': preferredLang || 'und',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    // 2) Tenta vários arquivos daquele idioma (sem cair em outro idioma)
    const allForLang = listSubtitlesForLang(subs, preferredLang);
    if (allForLang.length === 0) {
      return NextResponse.json(
        { error: preferredLang ? `Idioma indisponível: ${preferredLang}` : 'Nenhuma legenda' },
        { status: 404 }
      );
    }

    const downloaded = await downloadFirstWorking(allForLang);
    if (!downloaded) {
      return NextResponse.json({ error: 'Falha ao baixar legenda' }, { status: 502 });
    }

    return new NextResponse(downloaded.vtt, {
      status: 200,
      headers: {
        'Content-Type': 'text/vtt; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Subtitle-Lang': downloaded.lang,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Subtitles]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
