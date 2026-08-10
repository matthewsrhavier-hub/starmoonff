import { NextRequest, NextResponse } from 'next/server';
import { fetchUpstreamBinary } from '@/lib/dns-resolver';
import { isAllowedProxyUrl } from '@/lib/proxyDomains';

function isAllowedDomain(url: string): boolean {
  return isAllowedProxyUrl(url, 'asset');
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  console.log('[Asset Proxy] ========== NOVA REQUISIÇÃO ==========');
  console.log('[Asset Proxy] URL solicitada:', url);

  if (!url) {
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
  }

  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
  }

  if (!isAllowedDomain(url)) {
    console.log('[Asset Proxy] ERRO: Domínio não permitido:', url);
    return NextResponse.json({ error: 'Domínio não permitido' }, { status: 403 });
  }

  try {
    const result = await fetchUpstreamBinary(url, {
      referer: 'https://superflix.app/',
    });

    let contentType = 'application/octet-stream';
    const headerContentType = result.headers['content-type'];
    if (headerContentType) {
      contentType = Array.isArray(headerContentType) ? headerContentType[0] : headerContentType;
    } else {
      const path = urlObj.pathname.toLowerCase();
      if (path.endsWith('.js')) contentType = 'application/javascript';
      else if (path.endsWith('.css')) contentType = 'text/css';
      else if (path.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
      else if (path.endsWith('.ts')) contentType = 'video/mp2t';
      else if (path.endsWith('.json')) contentType = 'application/json';
      else if (path.endsWith('.png')) contentType = 'image/png';
      else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) contentType = 'image/jpeg';
      else if (path.endsWith('.gif')) contentType = 'image/gif';
      else if (path.endsWith('.svg')) contentType = 'image/svg+xml';
      else if (path.endsWith('.woff') || path.endsWith('.woff2')) contentType = 'font/woff2';
    }

    return new NextResponse(new Uint8Array(result.body), {
      status: result.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[Asset Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Erro ao acessar recurso', details: String(error) },
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
