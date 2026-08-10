export type SubtitleCue = {
  start: number;
  end: number;
  text: string;
};

export type SubtitleLanguageOption = {
  /** Código canônico (ex.: pob, eng, spa) */
  code: string;
  label: string;
  flag: string;
  /** URL do arquivo SRT/VTT no provedor */
  url: string;
};

type LangMeta = {
  code: string;
  label: string;
  flag: string;
  aliases: string[];
};

/** Idiomas/países suportados na UI (aliases → código canônico). */
export const SUBTITLE_LANG_CATALOG: LangMeta[] = [
  { code: 'pob', label: 'Português (Brasil)', flag: '🇧🇷', aliases: ['pob', 'pb', 'pt-br', 'ptbr', 'brazilian'] },
  { code: 'por', label: 'Português (Portugal)', flag: '🇵🇹', aliases: ['por', 'pt', 'pt-pt'] },
  { code: 'eng', label: 'English', flag: '🇺🇸', aliases: ['eng', 'en', 'en-us', 'en-gb'] },
  { code: 'spa', label: 'Español', flag: '🇪🇸', aliases: ['spa', 'es', 'esp', 'es-es', 'es-mx', 'mexican'] },
  { code: 'fre', label: 'Français', flag: '🇫🇷', aliases: ['fre', 'fra', 'fr', 'french'] },
  { code: 'ger', label: 'Deutsch', flag: '🇩🇪', aliases: ['ger', 'deu', 'de', 'german'] },
  { code: 'ita', label: 'Italiano', flag: '🇮🇹', aliases: ['ita', 'it', 'italian'] },
  { code: 'jpn', label: '日本語', flag: '🇯🇵', aliases: ['jpn', 'ja', 'jp', 'japanese'] },
  { code: 'kor', label: '한국어', flag: '🇰🇷', aliases: ['kor', 'ko', 'korean'] },
  { code: 'chi', label: '中文', flag: '🇨🇳', aliases: ['chi', 'zho', 'zh', 'zht', 'zhe', 'chinese', 'zh-cn', 'zh-tw'] },
  { code: 'rus', label: 'Русский', flag: '🇷🇺', aliases: ['rus', 'ru', 'russian'] },
  { code: 'ara', label: 'العربية', flag: '🇸🇦', aliases: ['ara', 'ar', 'arabic'] },
  { code: 'tur', label: 'Türkçe', flag: '🇹🇷', aliases: ['tur', 'tr', 'turkish'] },
  { code: 'hin', label: 'हिन्दी', flag: '🇮🇳', aliases: ['hin', 'hi', 'hindi'] },
  { code: 'nld', label: 'Nederlands', flag: '🇳🇱', aliases: ['nld', 'dut', 'nl', 'dutch'] },
  { code: 'pol', label: 'Polski', flag: '🇵🇱', aliases: ['pol', 'pl', 'polish'] },
  { code: 'swe', label: 'Svenska', flag: '🇸🇪', aliases: ['swe', 'sv', 'swedish'] },
  { code: 'nor', label: 'Norsk', flag: '🇳🇴', aliases: ['nor', 'no', 'nob', 'nno', 'norwegian'] },
  { code: 'dan', label: 'Dansk', flag: '🇩🇰', aliases: ['dan', 'da', 'danish'] },
  { code: 'fin', label: 'Suomi', flag: '🇫🇮', aliases: ['fin', 'fi', 'finnish'] },
  { code: 'hun', label: 'Magyar', flag: '🇭🇺', aliases: ['hun', 'hu', 'hungarian'] },
  { code: 'cze', label: 'Čeština', flag: '🇨🇿', aliases: ['cze', 'ces', 'cs', 'czech'] },
  { code: 'ron', label: 'Română', flag: '🇷🇴', aliases: ['ron', 'rum', 'ro', 'romanian'] },
  { code: 'tha', label: 'ไทย', flag: '🇹🇭', aliases: ['tha', 'th', 'thai'] },
  { code: 'vie', label: 'Tiếng Việt', flag: '🇻🇳', aliases: ['vie', 'vi', 'vietnamese'] },
  { code: 'ind', label: 'Indonesia', flag: '🇮🇩', aliases: ['ind', 'id', 'indonesian'] },
  { code: 'heb', label: 'עברית', flag: '🇮🇱', aliases: ['heb', 'he', 'hebrew'] },
  { code: 'ell', label: 'Ελληνικά', flag: '🇬🇷', aliases: ['ell', 'gre', 'el', 'greek'] },
  { code: 'ukr', label: 'Українська', flag: '🇺🇦', aliases: ['ukr', 'uk', 'ukrainian'] },
  { code: 'hrv', label: 'Hrvatski', flag: '🇭🇷', aliases: ['hrv', 'hr', 'croatian'] },
  { code: 'srp', label: 'Srpski', flag: '🇷🇸', aliases: ['srp', 'sr', 'serbian'] },
  { code: 'bos', label: 'Bosanski', flag: '🇧🇦', aliases: ['bos', 'bs', 'bosnian'] },
  { code: 'mac', label: 'Македонски', flag: '🇲🇰', aliases: ['mac', 'mk', 'mkd', 'macedonian'] },
  { code: 'bul', label: 'Български', flag: '🇧🇬', aliases: ['bul', 'bg', 'bulgarian'] },
  { code: 'slv', label: 'Slovenščina', flag: '🇸🇮', aliases: ['slv', 'sl', 'slovenian'] },
  { code: 'slo', label: 'Slovenčina', flag: '🇸🇰', aliases: ['slo', 'slk', 'sk', 'slovak'] },
  { code: 'est', label: 'Eesti', flag: '🇪🇪', aliases: ['est', 'et', 'estonian'] },
  { code: 'lav', label: 'Latviešu', flag: '🇱🇻', aliases: ['lav', 'lv', 'latvian'] },
  { code: 'lit', label: 'Lietuvių', flag: '🇱🇹', aliases: ['lit', 'lt', 'lithuanian'] },
  { code: 'may', label: 'Bahasa Melayu', flag: '🇲🇾', aliases: ['may', 'msa', 'ms', 'malay'] },
  { code: 'tgl', label: 'Filipino', flag: '🇵🇭', aliases: ['tgl', 'fil', 'tl', 'tagalog'] },
  { code: 'per', label: 'فارسی', flag: '🇮🇷', aliases: ['per', 'fas', 'fa', 'farsi', 'persian'] },
];

const DEFAULT_LANG_PRIORITY = [
  'pob',
  'por',
  'eng',
  'spa',
  'fre',
  'ger',
  'ita',
  'jpn',
  'kor',
  'chi',
];

function parseTimestamp(raw: string): number {
  const clean = raw.trim().split(/\s/)[0]?.replace(',', '.') || '';
  const parts = clean.split(':').map(Number);
  if (parts.some((n) => !Number.isFinite(n))) return NaN;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return NaN;
}

/** Extrai cues de um VTT (também aceita SRT já convertido). */
export function parseVttCues(vtt: string): SubtitleCue[] {
  const body = String(vtt || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^WEBVTT[^\n]*\n*/, '');

  const cues: SubtitleCue[] = [];
  for (const block of body.split(/\n\n+/)) {
    const lines = block
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !/^NOTE\b/i.test(l) && !/^STYLE\b/i.test(l));
    if (lines.length === 0) continue;
    const timeIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeIdx < 0) continue;
    const [startRaw, endRaw] = lines[timeIdx].split('-->');
    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    const text = lines
      .slice(timeIdx + 1)
      .join('\n')
      .replace(/<\/?[^>]+>/g, '')
      .replace(/\{\\an\d\}/gi, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .trim();
    if (!text) continue;
    cues.push({ start, end, text });
  }

  cues.sort((a, b) => a.start - b.start);
  return cues;
}

export function findActiveCue(cues: SubtitleCue[], timeSec: number): SubtitleCue | null {
  if (!cues.length || !Number.isFinite(timeSec)) return null;
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (timeSec >= cue.start && timeSec <= cue.end) return cue;
    if (cue.start > timeSec) break;
  }
  return null;
}

/** Converte SRT (OpenSubtitles) para WebVTT (HTML5 track). */
export function srtToVtt(srt: string): string {
  let content = String(srt || '')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!content) return 'WEBVTT\n\n';

  content = content.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  content = content.replace(/^\d+\n(?=\d{2}:\d{2}:\d{2})/gm, '');
  content = content.replace(/\{\\an\d\}/gi, '').replace(/\{\\[^}]+\}/g, '');

  if (!content.startsWith('WEBVTT')) {
    content = `WEBVTT\n\n${content}`;
  }

  return content;
}

export type StremioSubtitle = {
  id?: string;
  url: string;
  lang?: string;
  SubEncoding?: string;
};

export function normalizeLangCode(raw?: string | null): string | null {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  if (!key) return null;
  for (const lang of SUBTITLE_LANG_CATALOG) {
    if (lang.code === key || lang.aliases.includes(key)) return lang.code;
  }
  // códigos curtos desconhecidos: mantém como está
  return key.length <= 8 ? key : null;
}

export function getLangMeta(code: string): Pick<LangMeta, 'code' | 'label' | 'flag'> {
  const found = SUBTITLE_LANG_CATALOG.find((l) => l.code === code);
  if (found) return { code: found.code, label: found.label, flag: found.flag };
  return { code, label: code.toUpperCase(), flag: '🌐' };
}

/** Uma entrada por idioma (primeira URL de cada língua). */
export function listAvailableLanguages(subs: StremioSubtitle[]): SubtitleLanguageOption[] {
  if (!Array.isArray(subs) || subs.length === 0) return [];

  const byCode = new Map<string, SubtitleLanguageOption>();

  for (const sub of subs) {
    if (!sub?.url) continue;
    const code = normalizeLangCode(sub.lang);
    if (!code || byCode.has(code)) continue;
    const meta = getLangMeta(code);
    byCode.set(code, {
      code: meta.code,
      label: meta.label,
      flag: meta.flag,
      url: sub.url,
    });
  }

  const items = Array.from(byCode.values());
  items.sort((a, b) => {
    const ai = DEFAULT_LANG_PRIORITY.indexOf(a.code);
    const bi = DEFAULT_LANG_PRIORITY.indexOf(b.code);
    const aRank = ai === -1 ? 999 : ai;
    const bRank = bi === -1 ? 999 : bi;
    if (aRank !== bRank) return aRank - bRank;
    return a.label.localeCompare(b.label, 'pt-BR');
  });

  return items;
}

/**
 * Legendas de um idioma.
 * - Com preferredLang: só esse idioma (sem fallback silencioso para PT/EN).
 * - Sem preferredLang: usa prioridade padrão.
 */
export function listSubtitlesForLang(
  subs: StremioSubtitle[],
  preferredLang?: string | null
): StremioSubtitle[] {
  if (!Array.isArray(subs) || subs.length === 0) return [];

  const preferred = normalizeLangCode(preferredLang);
  if (preferred) {
    return subs.filter((s) => normalizeLangCode(s.lang) === preferred && Boolean(s.url));
  }

  for (const code of DEFAULT_LANG_PRIORITY) {
    const matches = subs.filter((s) => normalizeLangCode(s.lang) === code && s.url);
    if (matches.length) return matches;
  }

  return subs.filter((s) => Boolean(s.url));
}

export function pickBestSubtitle(
  subs: StremioSubtitle[],
  preferredLang?: string | null
): StremioSubtitle | null {
  return listSubtitlesForLang(subs, preferredLang)[0] || null;
}

/** Decodifica bytes da legenda com o encoding informado pelo provedor. */
export function decodeSubtitleBytes(
  buffer: ArrayBuffer,
  encodingHint?: string | null
): string {
  const hint = String(encodingHint || 'UTF-8').trim().toUpperCase();
  const candidates = [
    hint,
    hint === 'UTF8' ? 'UTF-8' : '',
    'UTF-8',
    'windows-1252',
    'iso-8859-1',
  ].filter(Boolean);

  // Mapas comuns do OpenSubtitles → labels do TextDecoder
  const map: Record<string, string> = {
    UTF8: 'utf-8',
    'UTF-8': 'utf-8',
    ASCII: 'utf-8',
    CP1252: 'windows-1252',
    WINDOWS1252: 'windows-1252',
    'WINDOWS-1252': 'windows-1252',
    CP1251: 'windows-1251',
    'WINDOWS-1251': 'windows-1251',
    CP1250: 'windows-1250',
    'WINDOWS-1250': 'windows-1250',
    CP1256: 'windows-1256',
    ISO88591: 'iso-8859-1',
    'ISO-8859-1': 'iso-8859-1',
    LATIN1: 'iso-8859-1',
    GB18030: 'gb18030',
  };

  for (const raw of candidates) {
    const label = map[raw.replace(/[^A-Z0-9-]/g, '')] || map[raw] || raw.toLowerCase();
    try {
      const text = new TextDecoder(label, { fatal: false }).decode(buffer);
      if (text && !text.includes('\uFFFD\uFFFD')) return text;
      if (text) return text;
    } catch {
      /* tenta próximo */
    }
  }

  return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
}

export function pickLanguageOption<T extends { code: string }>(
  options: T[],
  preferredLang?: string | null
): T | null {
  if (!options.length) return null;
  const preferred = normalizeLangCode(preferredLang);
  if (preferred) {
    const match = options.find((o) => o.code === preferred);
    if (match) return match;
  }
  for (const code of DEFAULT_LANG_PRIORITY) {
    const match = options.find((o) => o.code === code);
    if (match) return match;
  }
  return options[0];
}

export function buildStremioSearchUrl(opts: {
  imdbId: string;
  mediaType: 'movie' | 'tv';
  season?: number;
  episode?: number;
}): string {
  const imdb = opts.imdbId.startsWith('tt') ? opts.imdbId : `tt${opts.imdbId}`;
  if (opts.mediaType === 'tv') {
    const s = Math.max(1, Number(opts.season) || 1);
    const e = Math.max(1, Number(opts.episode) || 1);
    return `https://opensubtitles-v3.strem.io/subtitles/series/${imdb}:${s}:${e}.json`;
  }
  return `https://opensubtitles-v3.strem.io/subtitles/movie/${imdb}.json`;
}
