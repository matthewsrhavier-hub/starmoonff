/**
 * DNS Resolver usando Cloudflare DNS over HTTPS
 * Contorna bloqueios de DNS local
 */

import https from 'https';
import zlib from 'zlib';

interface DNSAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DNSResponse {
  Status: number;
  Answer?: DNSAnswer[];
}

// Cache de DNS
const dnsCache = new Map<string, { ip: string; expires: number }>();

/**
 * Resolve um hostname usando Cloudflare DNS over HTTPS
 */
export async function resolveWithCloudflare(hostname: string): Promise<string | null> {
  // Verificar cache
  const cached = dnsCache.get(hostname);
  if (cached && cached.expires > Date.now()) {
    return cached.ip;
  }

  return new Promise((resolve) => {
    https.get(
      `https://1.1.1.1/dns-query?name=${hostname}&type=A`,
      { headers: { Accept: 'application/dns-json' } },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json: DNSResponse = JSON.parse(data);
            const aRecord = json.Answer?.find((a) => a.type === 1);

            if (aRecord) {
              const ip = aRecord.data;
              const ttl = Math.max(aRecord.TTL * 1000, 60000); // mínimo 1 minuto

              dnsCache.set(hostname, {
                ip,
                expires: Date.now() + ttl,
              });

              resolve(ip);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      }
    ).on('error', () => resolve(null));
  });
}

/**
 * Faz uma requisição HTTPS usando IP resolvido via Cloudflare DNS
 */
export function fetchWithResolvedDNS(
  url: string,
  resolvedIP: string,
  options: { followRedirects?: boolean; maxRedirects?: number; referer?: string } = {}
): Promise<{ status: number; body: string; headers: Record<string, string | string[] | undefined>; redirect?: string }> {
  return fetchWithResolvedDNSBinary(url, resolvedIP, options).then((result) => ({
    status: result.status,
    body: result.body.toString('utf-8'),
    headers: result.headers,
    redirect: result.redirect,
  }));
}

/**
 * Mesmo que fetchWithResolvedDNS, mas preserva o body binário (JS/CSS/TS/imagens).
 */
export function fetchWithResolvedDNSBinary(
  url: string,
  resolvedIP: string,
  options: { followRedirects?: boolean; maxRedirects?: number; referer?: string } = {}
): Promise<{ status: number; body: Buffer; headers: Record<string, string | string[] | undefined>; redirect?: string }> {
  const { followRedirects = false, referer } = options;

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: resolvedIP,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        Host: urlObj.hostname,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        Referer: referer || 'https://superflix.app/',
        Origin: referer ? new URL(referer).origin : 'https://superflix.app',
      },
      rejectUnauthorized: false,
      servername: urlObj.hostname,
    };

    const req = https.request(reqOptions, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const encoding = res.headers['content-encoding'];

        let bodyPromise: Promise<Buffer>;

        if (encoding === 'gzip') {
          bodyPromise = new Promise((resolveBody, rejectBody) => {
            zlib.gunzip(buffer, (err, result) => {
              if (err) rejectBody(err);
              else resolveBody(result);
            });
          });
        } else if (encoding === 'deflate') {
          bodyPromise = new Promise((resolveBody, rejectBody) => {
            zlib.inflate(buffer, (err, result) => {
              if (err) rejectBody(err);
              else resolveBody(result);
            });
          });
        } else if (encoding === 'br') {
          bodyPromise = new Promise((resolveBody, rejectBody) => {
            zlib.brotliDecompress(buffer, (err, result) => {
              if (err) rejectBody(err);
              else resolveBody(result);
            });
          });
        } else {
          bodyPromise = Promise.resolve(buffer);
        }

        bodyPromise.then((body) => {
          const result = {
            status: res.statusCode || 0,
            body,
            headers: res.headers as Record<string, string | string[] | undefined>,
            redirect: res.headers.location as string | undefined,
          };

          if (followRedirects && res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            resolve(result);
          } else {
            resolve(result);
          }
        }).catch((err) => {
          reject(err);
        });
      });
    });

    req.on('error', (e) => reject(e));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

/**
 * Limpa o cache de DNS
 */
export function clearDNSCache(): void {
  dnsCache.clear();
}

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Fetch upstream: primeiro fetch nativo (funciona na Vercel),
 * depois fallback via DNS Cloudflare (útil em redes locais bloqueadas).
 */
export async function fetchUpstreamText(
  url: string,
  options: { referer?: string } = {}
): Promise<{ status: number; body: string; headers: Record<string, string | string[] | undefined>; finalUrl: string }> {
  const referer = options.referer || 'https://superflix.app/';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': DEFAULT_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        Referer: referer,
      },
      redirect: 'follow',
      cache: 'no-store',
    });

    const body = await response.text();
    if (response.ok || body.length > 0) {
      const headers: Record<string, string | string[] | undefined> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return {
        status: response.status,
        body,
        headers,
        finalUrl: response.url || url,
      };
    }
  } catch (err) {
    console.warn('[Upstream] Native fetch failed, trying DNS resolver:', err);
  }

  const hostname = new URL(url).hostname;
  const resolvedIP = await resolveWithCloudflare(hostname);
  if (!resolvedIP) {
    throw new Error(`DNS resolution failed for ${hostname}`);
  }

  const result = await fetchWithResolvedDNS(url, resolvedIP, { referer });
  return {
    status: result.status,
    body: result.body,
    headers: result.headers,
    finalUrl: result.redirect || url,
  };
}

export async function fetchUpstreamBinary(
  url: string,
  options: { referer?: string } = {}
): Promise<{ status: number; body: Buffer; headers: Record<string, string | string[] | undefined>; finalUrl: string }> {
  const referer = options.referer || 'https://superflix.app/';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': DEFAULT_UA,
        Accept: '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        Referer: referer,
      },
      redirect: 'follow',
      cache: 'no-store',
    });

    const body = Buffer.from(await response.arrayBuffer());
    if (response.ok || body.length > 0) {
      const headers: Record<string, string | string[] | undefined> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return {
        status: response.status,
        body,
        headers,
        finalUrl: response.url || url,
      };
    }
  } catch (err) {
    console.warn('[Upstream] Native binary fetch failed, trying DNS resolver:', err);
  }

  const hostname = new URL(url).hostname;
  const resolvedIP = await resolveWithCloudflare(hostname);
  if (!resolvedIP) {
    throw new Error(`DNS resolution failed for ${hostname}`);
  }

  const result = await fetchWithResolvedDNSBinary(url, resolvedIP, { referer });
  return {
    status: result.status,
    body: result.body,
    headers: result.headers,
    finalUrl: result.redirect || url,
  };
}
