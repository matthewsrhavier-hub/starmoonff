/** Domínios usados pelos proxies de embed / HLS / assets. */

export const PROXY_STREAM_DOMAINS = [
  'superflixapi.best',
  'superflixapi.cv',
  'superflixapi.run',
  'superflixapi.buzz',
  'superflixapi.top',
  'cdn.superflixapi.best',
  'stream.superflixapi.best',
  'cdn.superflixapi.cv',
  'stream.superflixapi.cv',
  'cdn.superflixapi.run',
  'stream.superflixapi.run',
  'embedtv.best',
  'www1.embedtv.best',
  'cdn.embedtv.best',
  'stream.embedtv.best',
] as const;

export const PROXY_ASSET_EXTRA_DOMAINS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'unpkg.com',
  'akamaihd.net',
  'cloudfront.net',
  'fastly.net',
] as const;

const STREAM_HOST_RE =
  /^(?:[a-z0-9-]+\.)*(?:superflixapi\.[a-z0-9.-]+|embedtv\.best)$/i;

function hostMatchesList(hostname: string, domains: readonly string[]): boolean {
  const host = hostname.toLowerCase();
  return domains.some((domain) => host === domain || host.endsWith('.' + domain));
}

export function isAllowedStreamHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (STREAM_HOST_RE.test(host)) return true;
  return hostMatchesList(host, PROXY_STREAM_DOMAINS);
}

export function isAllowedAssetHost(hostname: string): boolean {
  if (isAllowedStreamHost(hostname)) return true;
  return hostMatchesList(hostname, PROXY_ASSET_EXTRA_DOMAINS);
}

export function isAllowedProxyUrl(url: string, kind: 'stream' | 'asset' = 'stream'): boolean {
  try {
    const hostname = new URL(url).hostname;
    return kind === 'asset' ? isAllowedAssetHost(hostname) : isAllowedStreamHost(hostname);
  } catch {
    return false;
  }
}
