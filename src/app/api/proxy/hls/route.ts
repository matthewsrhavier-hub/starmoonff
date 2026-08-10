import { NextRequest, NextResponse } from 'next/server';
import { fetchUpstreamBinary, fetchUpstreamText } from '@/lib/dns-resolver';
import { isAllowedProxyUrl } from '@/lib/proxyDomains';

function isAllowedDomain(url: string): boolean {
  return isAllowedProxyUrl(url, 'stream');
}

function shouldProxyUrl(url: string): boolean {
  return isAllowedDomain(url);
}

function rewriteM3U8(content: string, baseUrl: string): string {
  const baseUrlObj = new URL(baseUrl);
  const lines = content.split('\n');

  return lines
    .map((line) => {
      const trimmedLine = line.trim();

      // Ignorar linhas vazias e comentários que não são URLs
      if (!trimmedLine || trimmedLine.startsWith('#EXT')) {
        // Reescrever URIs em tags como #EXT-X-KEY
        if (trimmedLine.includes('URI="')) {
          return trimmedLine.replace(/URI="([^"]+)"/g, (match, uri) => {
            let absoluteUrl: string;
            if (uri.startsWith('http://') || uri.startsWith('https://')) {
              absoluteUrl = uri;
            } else if (uri.startsWith('/')) {
              absoluteUrl = `${baseUrlObj.origin}${uri}`;
            } else {
              const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
              absoluteUrl = basePath + uri;
            }

            if (shouldProxyUrl(absoluteUrl)) {
              return `URI="/api/proxy/hls?url=${encodeURIComponent(absoluteUrl)}"`;
            }
            return match;
          });
        }
        return line;
      }

      // Reescrever URLs de segmentos
      let absoluteUrl: string;
      if (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://')) {
        absoluteUrl = trimmedLine;
      } else if (trimmedLine.startsWith('/')) {
        absoluteUrl = `${baseUrlObj.origin}${trimmedLine}`;
      } else {
        // URL relativa
        const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
        absoluteUrl = basePath + trimmedLine;
      }

      if (shouldProxyUrl(absoluteUrl)) {
        // Para segmentos .ts, usar o proxy de asset
        if (absoluteUrl.endsWith('.ts') || absoluteUrl.includes('.ts?')) {
          return `/api/proxy/asset?url=${encodeURIComponent(absoluteUrl)}`;
        }
        // Para outros arquivos (sub-playlists .m3u8), usar o proxy HLS
        return `/api/proxy/hls?url=${encodeURIComponent(absoluteUrl)}`;
      }

      return line;
    })
    .join('\n');
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  console.log('[HLS Proxy] ========== NOVA REQUISIÇÃO ==========');
  console.log('[HLS Proxy] URL solicitada:', url);

  if (!url) {
    console.log('[HLS Proxy] ERRO: URL não fornecida');
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
  }

  if (!isAllowedDomain(url)) {
    console.log('[HLS Proxy] ERRO: Domínio não permitido:', url);
    return NextResponse.json({ error: 'Domínio não permitido' }, { status: 403 });
  }

  try {
    const urlObj = new URL(url);
    const looksLikeM3U8 = url.includes('.m3u8');

    if (looksLikeM3U8) {
      const result = await fetchUpstreamText(url, { referer: 'https://superflix.app/' });
      const contentType = result.headers['content-type'];
      const isM3U8 =
        looksLikeM3U8 ||
        (typeof contentType === 'string' &&
          (contentType.includes('mpegurl') ||
            contentType.includes('x-mpegurl') ||
            contentType.includes('vnd.apple.mpegurl')));

      if (isM3U8) {
        const rewrittenContent = rewriteM3U8(result.body, result.finalUrl || url);
        return new NextResponse(rewrittenContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    const result = await fetchUpstreamBinary(url, { referer: 'https://superflix.app/' });
    const headerContentType = result.headers['content-type'];
    const contentType =
      (Array.isArray(headerContentType) ? headerContentType[0] : headerContentType) ||
      (urlObj.pathname.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t');

    if (contentType.includes('mpegurl') || url.includes('.m3u8')) {
      const rewrittenContent = rewriteM3U8(result.body.toString('utf-8'), result.finalUrl || url);
      return new NextResponse(rewrittenContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new NextResponse(new Uint8Array(result.body), {
      status: result.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[HLS Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao acessar stream', details: String(error) },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
