'use client';

import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from 'react';
import Hls from 'hls.js';
import { cn } from '@/lib/utils';
import {
  findActiveCue,
  parseVttCues,
  pickLanguageOption,
  type SubtitleCue,
} from '@/lib/subtitles';
import {
  AlertCircle,
  Maximize,
  Minimize,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  RotateCcw,
  RotateCw,
  PictureInPicture2,
  ArrowLeft,
  Loader2,
  SkipForward,
  Captions,
  CaptionsOff,
  ChevronDown,
} from 'lucide-react';

interface NextEpisodeInfo {
  season: number;
  episode: number;
  name?: string | null;
  stillUrl?: string | null;
}

interface VideoPlayerProps {
  playerCode: string;
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
  title?: string;
  posterUrl?: string;
  /** IMDb id (tt…) para legendas automáticas */
  imdbId?: string | null;
  /** TMDB id (fallback se não houver IMDb) */
  tmdbId?: number | null;
  nextEpisode?: NextEpisodeInfo | null;
  onNextEpisode?: () => void;
  /** Fração 0–1 salva anteriormente */
  initialProgress?: number;
  /** Tempo em segundos (prioridade sobre initialProgress) */
  initialTime?: number;
  /** Duração estimada (minutos ou segundos) — usada no iframe para gravar progresso */
  estimatedDuration?: number;
  onProgress?: (
    progress: number,
    currentTime: number,
    duration: number,
    meta?: { season?: number; episode?: number }
  ) => void;
  onEnded?: () => void;
  onClose?: () => void;
  className?: string;
  /** No celular, força layout horizontal (CSS + Screen Orientation API) */
  forceMobileLandscape?: boolean;
}

function extractPlayerSrc(
  playerCode: string | null | undefined,
  season?: number,
  episode?: number
): string {
  if (!playerCode) return '';
  const trimmed = playerCode.trim();
  let url = '';

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        const epMatch = parsed.find(
          (item: any) => Number(item.s) === Number(season) && Number(item.e) === Number(episode)
        );
        if (epMatch?.code) {
          const codeTrimmed = String(epMatch.code).trim();
          if (codeTrimmed.toLowerCase().startsWith('<iframe')) {
            const match = codeTrimmed.match(/src=["']([^"']+)["']/i);
            if (match?.[1]) url = match[1];
          } else {
            url = codeTrimmed;
          }
        }
      }
    } catch {
      /* ignore */
    }
  } else if (trimmed.toLowerCase().startsWith('<iframe')) {
    const match = trimmed.match(/src=["']([^"']+)["']/i);
    if (match?.[1]) url = match[1];
  } else {
    url = trimmed;
  }

  if (!url) return '';

  // autoplay só em embeds (iframe); MP4/HLS não precisam disso na URL
  const modeHint = detectMode(url);
  if (modeHint === 'iframe' && !url.includes('autoplay=')) {
    url += `${url.includes('?') ? '&' : '?'}autoplay=1`;
  }
  return url;
}

function detectMode(src: string): 'hls' | 'mp4' | 'iframe' {
  if (!src) return 'iframe';
  const lower = src.toLowerCase();

  // Páginas de embed / proxy nunca vão no <video>
  if (
    lower.includes('/api/proxy/embed') ||
    lower.includes('superflixapi.') ||
    lower.includes('/embed/') ||
    lower.includes('embed?') ||
    lower.startsWith('data:text/html')
  ) {
    return 'iframe';
  }

  // Olha o path (sem query) para evitar falso positivo tipo ?file=x.mp4 em página HTML
  let path = lower;
  try {
    path = new URL(src, 'http://localhost').pathname.toLowerCase();
  } catch {
    path = lower.split('?')[0].split('#')[0];
  }

  if (path.includes('.m3u8') || path.includes('/hls/')) return 'hls';
  if (path.endsWith('.mp4') || /\.mp4$/i.test(path)) return 'mp4';

  // URLs absolutas de stream com extensão na string completa (CDN raro)
  const bare = lower.split('?')[0];
  if (bare.endsWith('.m3u8')) return 'hls';
  if (bare.endsWith('.mp4')) return 'mp4';

  return 'iframe';
}

async function safeVideoPlay(video: HTMLVideoElement | null | undefined) {
  if (!video) return false;
  // Sem fonte ainda → evita NotSupportedError: "no supported sources"
  if (!video.currentSrc && !video.src) return false;
  try {
    await video.play();
    return true;
  } catch {
    return false;
  }
}

function formatTime(timeInSeconds: number) {
  if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) return '0:00';
  const hrs = Math.floor(timeInSeconds / 3600);
  const mins = Math.floor((timeInSeconds % 3600) / 60);
  const secs = Math.floor(timeInSeconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hrs > 0) return `${hrs}:${pad(mins)}:${pad(secs)}`;
  return `${mins}:${pad(secs)}`;
}

type CaptionSize = 'sm' | 'md' | 'lg';
type CaptionBg = 'off' | 'soft' | 'solid';
type CaptionColor = 'white' | 'yellow';

type CaptionStyle = {
  size: CaptionSize;
  bg: CaptionBg;
  color: CaptionColor;
};

const CAPTION_STYLE_KEY = 'starmoon_caption_style';
const CAPTION_LANG_KEY = 'starmoon_caption_lang';

const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  size: 'sm',
  bg: 'soft',
  color: 'white',
};

type CaptionLangOption = {
  code: string;
  label: string;
  flag: string;
  url?: string;
};

function loadPreferredCaptionLang(): string {
  if (typeof window === 'undefined') return 'pob';
  try {
    return localStorage.getItem(CAPTION_LANG_KEY) || 'pob';
  } catch {
    return 'pob';
  }
}

function savePreferredCaptionLang(code: string) {
  try {
    localStorage.setItem(CAPTION_LANG_KEY, code);
  } catch {
    /* ignore */
  }
}

const CAPTION_SIZE_CSS: Record<CaptionSize, string> = {
  sm: 'clamp(0.72rem, 1.5vw, 0.88rem)',
  md: 'clamp(0.88rem, 2vw, 1.05rem)',
  lg: 'clamp(1.05rem, 2.5vw, 1.3rem)',
};

const CAPTION_BG_CSS: Record<CaptionBg, string> = {
  off: 'transparent',
  soft: 'rgba(0, 0, 0, 0.45)',
  solid: 'rgba(0, 0, 0, 0.78)',
};

const CAPTION_COLOR_CSS: Record<CaptionColor, string> = {
  white: '#ffffff',
  yellow: '#ffe566',
};

function loadCaptionStyle(): CaptionStyle {
  if (typeof window === 'undefined') return DEFAULT_CAPTION_STYLE;
  try {
    const raw = localStorage.getItem(CAPTION_STYLE_KEY);
    if (!raw) return DEFAULT_CAPTION_STYLE;
    const parsed = JSON.parse(raw) as Partial<CaptionStyle>;
    return {
      size: parsed.size === 'md' || parsed.size === 'lg' ? parsed.size : 'sm',
      bg: parsed.bg === 'off' || parsed.bg === 'solid' ? parsed.bg : 'soft',
      color: parsed.color === 'yellow' ? 'yellow' : 'white',
    };
  } catch {
    return DEFAULT_CAPTION_STYLE;
  }
}

function CaptionSettingsPanel({
  style,
  onChangeStyle,
  languages,
  selectedLang,
  onSelectLang,
  loadingLang,
}: {
  style: CaptionStyle;
  onChangeStyle: (patch: Partial<CaptionStyle>) => void;
  languages: CaptionLangOption[];
  selectedLang: string | null;
  onSelectLang: (code: string) => void;
  loadingLang?: boolean;
}) {
  const [visualOpen, setVisualOpen] = useState(false);
  const selected = languages.find((l) => l.code === selectedLang) || null;

  return (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <p className="text-[11px] font-semibold text-white/90">Idioma</p>
          {selected && (
            <p className="text-[10px] text-white/40 truncate max-w-[9rem]">
              {selected.flag} {selected.label}
            </p>
          )}
        </div>

        {languages.length === 0 ? (
          <p className="text-[11px] text-white/40 px-0.5 py-2">
            {loadingLang ? 'Buscando idiomas…' : 'Nenhuma legenda disponível'}
          </p>
        ) : (
          <div className="max-h-40 overflow-y-auto rounded-xl bg-white/[0.04] p-1 scrollbar-hide">
            <div className="grid grid-cols-1 gap-0.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onSelectLang(lang.code)}
                  className={cn(
                    'w-full h-9 px-2.5 rounded-lg text-left text-[11px] font-semibold transition-colors inline-flex items-center gap-2',
                    selectedLang === lang.code
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  )}
                >
                  <span className="text-sm leading-none w-5 text-center shrink-0">
                    {lang.flag}
                  </span>
                  <span className="truncate">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="h-px bg-white/8" />

      <div>
        <button
          type="button"
          onClick={() => setVisualOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 rounded-xl px-1 py-1 hover:bg-white/[0.04] transition-colors"
          aria-expanded={visualOpen}
        >
          <div className="text-left">
            <p className="text-[11px] font-semibold text-white/90">Visual</p>
            <p className="text-[10px] text-white/35 mt-0.5">Tamanho, fundo e cor</p>
          </div>
          <ChevronDown
            size={16}
            className={cn(
              'text-white/45 shrink-0 transition-transform duration-200',
              visualOpen && 'rotate-180'
            )}
          />
        </button>

        {visualOpen && (
          <div className="mt-3 space-y-3.5">
            <div className="space-y-1">
              <p className="text-[10px] font-medium text-white/45 px-0.5">Tamanho</p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.04] p-1">
                {(
                  [
                    ['sm', 'A'],
                    ['md', 'A'],
                    ['lg', 'A'],
                  ] as const
                ).map(([value, label], i) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onChangeStyle({ size: value })}
                    className={cn(
                      'h-9 rounded-lg font-bold transition-colors',
                      i === 0 && 'text-[11px]',
                      i === 1 && 'text-[13px]',
                      i === 2 && 'text-[16px]',
                      style.size === value
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white/65 hover:bg-white/8 hover:text-white'
                    )}
                    aria-label={value === 'sm' ? 'Pequeno' : value === 'md' ? 'Médio' : 'Grande'}
                    title={value === 'sm' ? 'Pequeno' : value === 'md' ? 'Médio' : 'Grande'}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-medium text-white/45 px-0.5">Fundo</p>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.04] p-1">
                {(
                  [
                    ['off', 'Nenhum'],
                    ['soft', 'Suave'],
                    ['solid', 'Sólido'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onChangeStyle({ bg: value })}
                    className={cn(
                      'h-9 rounded-lg text-[11px] font-semibold transition-colors',
                      style.bg === value
                        ? 'bg-white text-black shadow-sm'
                        : 'text-white/65 hover:bg-white/8 hover:text-white'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] font-medium text-white/45 px-0.5">Cor do texto</p>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/[0.04] p-1">
                <button
                  type="button"
                  onClick={() => onChangeStyle({ color: 'white' })}
                  className={cn(
                    'h-9 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center justify-center gap-2',
                    style.color === 'white'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/65 hover:bg-white/8 hover:text-white'
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white ring-1 ring-white/30" />
                  Branco
                </button>
                <button
                  type="button"
                  onClick={() => onChangeStyle({ color: 'yellow' })}
                  className={cn(
                    'h-9 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center justify-center gap-2',
                    style.color === 'yellow'
                      ? 'bg-white text-black shadow-sm'
                      : 'text-white/65 hover:bg-white/8 hover:text-white'
                  )}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffe566] ring-1 ring-black/20" />
                  Amarelo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function VideoPlayer({
  playerCode,
  mediaType,
  season,
  episode,
  title,
  posterUrl,
  imdbId,
  tmdbId,
  nextEpisode,
  onNextEpisode,
  initialProgress = 0,
  initialTime = 0,
  estimatedDuration = 0,
  onProgress,
  onEnded,
  onClose,
  className,
  forceMobileLandscape = false,
}: VideoPlayerProps) {
  const playerSrc = extractPlayerSrc(playerCode, season, episode);
  const mode = detectMode(playerSrc);
  const isNative = mode === 'mp4' || mode === 'hls';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const [resumeLabel, setResumeLabel] = useState<string | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionUrl, setCaptionUrl] = useState<string | null>(null);
  const [captionsReady, setCaptionsReady] = useState(false);
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>([]);
  const [iframeClock, setIframeClock] = useState(0);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>(DEFAULT_CAPTION_STYLE);
  const [captionLanguages, setCaptionLanguages] = useState<CaptionLangOption[]>([]);
  const [selectedCaptionLang, setSelectedCaptionLang] = useState<string | null>(null);
  const [loadingCaptionLangs, setLoadingCaptionLangs] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastProgressRef = useRef(0);
  const lastEmitAtRef = useRef(0);
  const hasResumedRef = useRef(false);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  // Meta travada na sessão atual do src (evita gravar no episódio novo ao trocar)
  const progressMetaRef = useRef({ season, episode });

  const emitProgress = useCallback((force = false) => {
    const v = videoRef.current;
    const cb = onProgressRef.current;
    if (!v || !cb || !v.duration || v.duration <= 0) return;
    const p = v.currentTime / v.duration;
    const now = Date.now();
    if (
      force ||
      p - lastProgressRef.current >= 0.01 ||
      now - lastEmitAtRef.current >= 5000
    ) {
      lastProgressRef.current = p;
      lastEmitAtRef.current = now;
      cb(p, v.currentTime, v.duration, {
        season: progressMetaRef.current.season,
        episode: progressMetaRef.current.episode,
      });
    }
  }, []);

  const applyResume = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasResumedRef.current || !video.duration) return;

    let seekTo = 0;
    if (initialTime > 5 && initialTime < video.duration - 10) {
      seekTo = initialTime;
    } else if (initialProgress > 0.02 && initialProgress < 0.95) {
      seekTo = initialProgress * video.duration;
    }

    if (seekTo > 5) {
      hasResumedRef.current = true;
      video.currentTime = seekTo;
      setCurrentTime(seekTo);
      setResumeLabel(`Continuando de ${formatTime(seekTo)}`);
      window.setTimeout(() => setResumeLabel(null), 2800);
    } else {
      hasResumedRef.current = true;
    }
  }, [initialProgress, initialTime]);

  const subtitle =
    mediaType === 'tv' && season && episode
      ? `T${season} · E${episode}`
      : null;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0;
  const hasNextEpisode = Boolean(nextEpisode && onNextEpisode);
  const remaining = duration > 0 ? duration - currentTime : Infinity;
  const showNextEpisodePrompt = hasNextEpisode && isNative && duration > 0 && remaining <= 120;

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
      setShowSettings(false);
      setShowVolume(false);
    }, 3200);
  }, []);

  useEffect(() => {
    setCaptionStyle(loadCaptionStyle());
  }, []);

  const updateCaptionStyle = useCallback((patch: Partial<CaptionStyle>) => {
    setCaptionStyle((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(CAPTION_STYLE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const captionCssVars = useMemo(
    () =>
      ({
        '--cue-size': CAPTION_SIZE_CSS[captionStyle.size],
        '--cue-bottom': '11%',
        '--cue-bg': CAPTION_BG_CSS[captionStyle.bg],
        '--cue-color': CAPTION_COLOR_CSS[captionStyle.color],
        '--cue-pad-y': captionStyle.bg === 'off' ? '0.05em' : '0.2em',
        '--cue-pad-x': captionStyle.bg === 'off' ? '0.15em' : '0.5em',
      }) as CSSProperties,
    [captionStyle]
  );

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void safeVideoPlay(video).then((ok) => {
        if (ok) setIsPlaying(true);
      });
    } else {
      video.pause();
      setIsPlaying(false);
    }
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  const skipTime = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.currentTime = Math.min(Math.max(video.currentTime + seconds, 0), duration || video.duration || 0);
      resetControlsTimeout();
    },
    [duration, resetControlsTimeout]
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Reset when episode/source changes
  useEffect(() => {
    lastProgressRef.current = 0;
    lastEmitAtRef.current = 0;
    hasResumedRef.current = false;
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setIsPlaying(false);
    setResumeLabel(null);
    setCaptionUrl(null);
    setCaptionsReady(false);
    setSubtitleCues([]);
    setIframeClock(0);
    setCaptionLanguages([]);
    setSelectedCaptionLang(null);
  }, [playerSrc]);

  const buildSubtitleParams = useCallback(() => {
    const params = new URLSearchParams({
      type: mediaType === 'tv' ? 'tv' : 'movie',
    });
    if (imdbId) params.set('imdbId', imdbId);
    if (tmdbId) params.set('tmdbId', String(tmdbId));
    if (mediaType === 'tv') {
      params.set('season', String(season || 1));
      params.set('episode', String(episode || 1));
    }
    return params;
  }, [imdbId, tmdbId, mediaType, season, episode]);

  // Lista idiomas disponíveis e escolhe o preferido (não sobrescreve escolha do usuário)
  useEffect(() => {
    if (!imdbId && !tmdbId) return;

    let cancelled = false;
    setLoadingCaptionLangs(true);

    const params = buildSubtitleParams();
    params.set('list', '1');

    void fetch(`/api/subtitles?${params.toString()}`, { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setCaptionLanguages([]);
          setSelectedCaptionLang(null);
          setLoadingCaptionLangs(false);
          return;
        }
        const data = (await res.json()) as { languages?: CaptionLangOption[] };
        const languages = Array.isArray(data.languages) ? data.languages : [];
        const preferred = loadPreferredCaptionLang();
        setCaptionLanguages(languages);
        setSelectedCaptionLang((current) => {
          if (current && languages.some((l) => l.code === current)) return current;
          return pickLanguageOption(languages, preferred)?.code || null;
        });
        setLoadingCaptionLangs(false);
      })
      .catch(() => {
        if (!cancelled) {
          setCaptionLanguages([]);
          setSelectedCaptionLang(null);
          setLoadingCaptionLangs(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imdbId, tmdbId, mediaType, season, episode, buildSubtitleParams]);

  // Baixa VTT do idioma selecionado
  useEffect(() => {
    if (!selectedCaptionLang) return;
    if (!imdbId && !tmdbId) return;

    let cancelled = false;
    const blobRef = { url: null as string | null };
    const selectedMeta = captionLanguages.find((l) => l.code === selectedCaptionLang);

    const params = buildSubtitleParams();
    params.set('lang', selectedCaptionLang);
    // URL explícita do idioma escolhido (evita pegar outro arquivo / cache errado)
    if (selectedMeta?.url) {
      params.set('url', selectedMeta.url);
    }
    // cache-bust ao trocar idioma
    params.set('_', String(Date.now()));

    setCaptionsReady(false);
    setCaptionUrl(null);
    setSubtitleCues([]);

    void fetch(`/api/subtitles?${params.toString()}`, { cache: 'no-store' })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          setSubtitleCues([]);
          setCaptionsReady(false);
          return;
        }
        const vtt = await res.text();
        if (cancelled || !vtt.includes('WEBVTT')) {
          setSubtitleCues([]);
          setCaptionsReady(false);
          return;
        }
        const cues = parseVttCues(vtt);
        setSubtitleCues(cues);
        if (isNative) {
          blobRef.url = URL.createObjectURL(new Blob([vtt], { type: 'text/vtt' }));
          setCaptionUrl(blobRef.url);
        }
        setCaptionsReady(cues.length > 0);
        if (cues.length > 0) setCaptionsEnabled(true);
      })
      .catch(() => {
        if (!cancelled) {
          setCaptionUrl(null);
          setSubtitleCues([]);
          setCaptionsReady(false);
        }
      });

    return () => {
      cancelled = true;
      if (blobRef.url) URL.revokeObjectURL(blobRef.url);
    };
  }, [
    selectedCaptionLang,
    captionLanguages,
    isNative,
    imdbId,
    tmdbId,
    buildSubtitleParams,
  ]);

  const handleSelectCaptionLang = useCallback(
    (code: string) => {
      if (code === selectedCaptionLang) return;
      setSelectedCaptionLang(code);
      savePreferredCaptionLang(code);
      setCaptionsEnabled(true);
      resetControlsTimeout();
    },
    [resetControlsTimeout, selectedCaptionLang]
  );

  // Overlay cuida das legendas — esconde tracks nativas para não duplicar
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const hide = () => {
      const tracks = video.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = 'hidden';
      }
    };
    hide();
    video.textTracks.addEventListener('addtrack', hide);
    return () => video.textTracks.removeEventListener('addtrack', hide);
  }, [captionUrl, captionsReady, isNative]);

  // Grava progresso ao fechar / trocar episódio (player nativo) — meta travada
  useEffect(() => {
    if (!isNative) return;
    const lockedSeason = season;
    const lockedEpisode = episode;
    progressMetaRef.current = { season: lockedSeason, episode: lockedEpisode };

    const flush = () => {
      const v = videoRef.current;
      const cb = onProgressRef.current;
      if (!v || !cb || !v.duration || v.duration <= 0) return;
      const p = v.currentTime / v.duration;
      lastProgressRef.current = p;
      lastEmitAtRef.current = Date.now();
      cb(p, v.currentTime, v.duration, {
        season: lockedSeason,
        episode: lockedEpisode,
      });
    };

    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      window.removeEventListener('pagehide', flush);
    };
  }, [isNative, playerSrc, season, episode]);

  const estimatedDurationRef = useRef(estimatedDuration);
  estimatedDurationRef.current = estimatedDuration;

  // Iframe: estima progresso pelo tempo com a aba visível + duração TMDB
  useEffect(() => {
    if (isNative) return;

    const lockedSeason = season;
    const lockedEpisode = episode;
    const lockedInitialTime = initialTime;
    const lockedInitialProgress = initialProgress;

    const resolveDuration = () => {
      const durationSec = Number(estimatedDurationRef.current) || 0;
      if (durationSec >= 60) return durationSec;
      return mediaType === 'movie' ? 110 * 60 : 45 * 60;
    };

    const durationSec = resolveDuration();
    const baseTime =
      lockedInitialTime > 5
        ? lockedInitialTime
        : lockedInitialProgress > 0.02 && lockedInitialProgress < 0.95
          ? lockedInitialProgress * durationSec
          : 0;

    let accumulatedSec = 0;
    let sliceStart = Date.now();
    let isVisible = typeof document === 'undefined' ? true : !document.hidden;

    const visibleElapsed = () => {
      let extra = accumulatedSec;
      if (isVisible) extra += (Date.now() - sliceStart) / 1000;
      return baseTime + Math.max(0, extra);
    };

    const report = (force = false) => {
      const cb = onProgressRef.current;
      const dur = resolveDuration();
      if (dur < 60) return;
      const current = Math.min(dur * 0.94, Math.max(0, visibleElapsed()));
      setIframeClock((prev) => (Math.abs(prev - current) >= 0.25 ? current : prev));
      if (!cb) return;
      // Não grava amostra zerada (protege histórico ao abrir o player)
      if (current < 8 && baseTime < 8) return;
      const p = Math.min(0.94, current / dur);
      const now = Date.now();
      if (
        force ||
        p - lastProgressRef.current >= 0.008 ||
        now - lastEmitAtRef.current >= 4000
      ) {
        lastProgressRef.current = p;
        lastEmitAtRef.current = now;
        cb(p, current, dur, { season: lockedSeason, episode: lockedEpisode });
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (isVisible) {
          accumulatedSec += (Date.now() - sliceStart) / 1000;
          isVisible = false;
          report(true);
        }
      } else if (!isVisible) {
        sliceStart = Date.now();
        isVisible = true;
      }
    };

    // Tick mais curto para sincronizar overlay de legenda no iframe
    const id = window.setInterval(() => report(false), 500);
    const onHide = () => report(true);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);

    return () => {
      report(true);
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
    };
    // Só reinicia ao trocar fonte/episódio — não a cada tick de progresso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNative, playerSrc, season, episode, mediaType]);

  // Setup HLS / MP4 source
  useEffect(() => {
    if (!isNative || !playerSrc) return;
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (mode === 'hls') {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          backBufferLength: 90,
        });
        hlsRef.current = hls;
        hls.loadSource(playerSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          applyResume();
          void safeVideoPlay(video).then((ok) => setIsPlaying(ok));
        });
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
          if (hls.subtitleTracks.length > 0 && captionsEnabled) {
            // Preferir faixa em português se existir no HLS
            const ptIdx = hls.subtitleTracks.findIndex((t) =>
              /pt|por|pob|brazil/i.test(`${t.lang || ''} ${t.name || ''}`)
            );
            hls.subtitleTrack = ptIdx >= 0 ? ptIdx : 0;
            hls.subtitleDisplay = true;
          }
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            setError('Não foi possível reproduzir este stream.');
            setIsLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playerSrc;
        void safeVideoPlay(video).then((ok) => setIsPlaying(ok));
      } else {
        setError('HLS não suportado neste navegador.');
        setIsLoading(false);
      }
    } else {
      video.src = playerSrc;
      const onCanPlay = () => {
        setIsLoading(false);
        void safeVideoPlay(video).then((ok) => setIsPlaying(ok));
      };
      video.addEventListener('canplay', onCanPlay, { once: true });
      // fallback se o evento não disparar
      window.setTimeout(() => {
        void safeVideoPlay(video).then((ok) => {
          if (ok) setIsPlaying(true);
          setIsLoading(false);
        });
      }, 800);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      try {
        video.removeAttribute('src');
        video.load();
      } catch {
        /* ignore */
      }
    };
  }, [isNative, mode, playerSrc]);

  // Retoma posição quando o vídeo já tem duração
  useEffect(() => {
    if (!isNative) return;
    applyResume();
  }, [isNative, playerSrc, applyResume]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    setPipSupported(typeof document !== 'undefined' && !!document.pictureInPictureEnabled);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // Celular: trava / força orientação horizontal enquanto o player está aberto
  useEffect(() => {
    if (!forceMobileLandscape || typeof window === 'undefined') return;

    const isMobile =
      window.matchMedia('(max-width: 1023px)').matches ||
      window.matchMedia('(pointer: coarse)').matches;

    if (!isMobile) return;

    document.documentElement.classList.add('sm-force-landscape');
    document.body.classList.add('sm-force-landscape');

    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
      unlock?: () => void;
    };

    const lockLandscape = async () => {
      try {
        if (orientation?.lock) {
          await orientation.lock('landscape');
        }
      } catch {
        /* iOS / browsers sem suporte — CSS cobre o fallback */
      }
    };

    void lockLandscape();

    return () => {
      document.documentElement.classList.remove('sm-force-landscape');
      document.body.classList.remove('sm-force-landscape');
      try {
        orientation?.unlock?.();
      } catch {
        /* ignore */
      }
    };
  }, [forceMobileLandscape]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          if (isNative) {
            e.preventDefault();
            handlePlayPause();
          }
          break;
        case 'ArrowLeft':
          if (isNative) {
            e.preventDefault();
            skipTime(-10);
          }
          break;
        case 'ArrowRight':
          if (isNative) {
            e.preventDefault();
            skipTime(10);
          }
          break;
        case 'ArrowUp':
          if (isNative && videoRef.current) {
            e.preventDefault();
            const next = Math.min(1, (videoRef.current.volume || 0) + 0.1);
            videoRef.current.volume = next;
            setVolume(next);
            setIsMuted(next === 0);
          }
          break;
        case 'ArrowDown':
          if (isNative && videoRef.current) {
            e.preventDefault();
            const next = Math.max(0, (videoRef.current.volume || 0) - 0.1);
            videoRef.current.volume = next;
            setVolume(next);
            setIsMuted(next === 0);
          }
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          void toggleFullscreen();
          break;
        case 'm':
        case 'M':
          if (isNative) {
            e.preventDefault();
            toggleMute();
          }
          break;
        case 'Escape':
          if (onClose && !document.fullscreenElement) {
            emitProgress(true);
            onClose();
          }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isNative, handlePlayPause, skipTime, toggleFullscreen, toggleMute, onClose, emitProgress]);

  const handleClose = useCallback(() => {
    emitProgress(true);
    onClose?.();
  }, [emitProgress, onClose]);

  const activeCueText = useMemo(() => {
    if (!captionsEnabled || !captionsReady || subtitleCues.length === 0) return null;
    const t = isNative ? currentTime : iframeClock;
    return findActiveCue(subtitleCues, t)?.text || null;
  }, [
    captionsEnabled,
    captionsReady,
    subtitleCues,
    isNative,
    currentTime,
    iframeClock,
  ]);

  if (!playerSrc) {
    return (
      <div className={cn('sm-player flex items-center justify-center', className)}>
        <div className="text-center px-6">
          <AlertCircle className="w-12 h-12 text-white/40 mx-auto mb-3" />
          <p className="text-white font-semibold">Player não configurado</p>
          <p className="text-white/45 text-sm mt-1">Este título ainda não tem fonte de vídeo.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'sm-player group/player relative w-full h-full overflow-hidden bg-black select-none',
        !showControls && isPlaying && 'sm-player--idle',
        forceMobileLandscape && 'sm-player--mobile-landscape',
        className
      )}
      style={captionCssVars}
      onMouseMove={resetControlsTimeout}
      onClick={(e) => {
        if (!isNative) return;
        if ((e.target as HTMLElement).closest('[data-controls]')) return;
        handlePlayPause();
      }}
      onDoubleClick={(e) => {
        e.preventDefault();
        void toggleFullscreen();
      }}
    >
      {/* Backdrop */}
      {posterUrl && (
        <div
          className="absolute inset-0 scale-110 blur-2xl opacity-25 pointer-events-none"
          style={{
            backgroundImage: `url(${posterUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Media */}
      <div className="absolute inset-0 z-[1]">
        {isNative ? (
          <video
            ref={videoRef}
            className="sm-player-video w-full h-full object-contain bg-black"
            playsInline
            preload="metadata"
            poster={posterUrl || undefined}
            onPlay={() => setIsPlaying(true)}
            onPause={() => {
              setIsPlaying(false);
              emitProgress(true);
            }}
            onWaiting={() => setIsLoading(true)}
            onPlaying={() => {
              setIsLoading(false);
              setIsPlaying(true);
            }}
            onLoadedMetadata={() => {
              if (!videoRef.current) return;
              setDuration(videoRef.current.duration || 0);
              setIsLoading(false);
              applyResume();
            }}
            onTimeUpdate={() => {
              const v = videoRef.current;
              if (!v) return;
              setCurrentTime(v.currentTime);
              if (v.buffered.length > 0) {
                try {
                  setBuffered(v.buffered.end(v.buffered.length - 1));
                } catch {
                  /* ignore */
                }
              }
              emitProgress(false);
            }}
            onEnded={() => {
              setIsPlaying(false);
              emitProgress(true);
              onEnded?.();
            }}
            onError={() => {
              setIsLoading(false);
              setError('Erro ao carregar o vídeo.');
            }}
          >
            {captionUrl && captionsReady ? (
              <track
                key={captionUrl}
                kind="subtitles"
                src={captionUrl}
                srcLang="pt"
                label="Português"
                default={captionsEnabled}
              />
            ) : null}
          </video>
        ) : (
          <iframe
            src={playerSrc}
            title={title || 'Player'}
            className="absolute inset-0 w-full h-full border-0 bg-black"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Erro ao carregar o player.');
            }}
          />
        )}
      </div>

      {/* Loading */}
      {isLoading && !error && (
        <div className="absolute inset-0 z-[20] flex flex-col items-center justify-center bg-black/50 pointer-events-none">
          <Loader2 className="w-10 h-10 text-white animate-spin mb-3" />
          <p className="text-white/70 text-sm font-medium tracking-wide">Carregando...</p>
        </div>
      )}

      {/* Aviso de retomada */}
      {resumeLabel && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[22] pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-black/75 border border-white/15 text-white text-sm font-medium backdrop-blur-md">
            {resumeLabel}
          </div>
        </div>
      )}

      {/* Overlay de legendas (iframe / fallback) */}
      {activeCueText && (
        <div className="sm-player-cue-overlay pointer-events-none z-[16]">
          <p className="sm-player-cue-text">{activeCueText}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 z-[25] flex items-center justify-center bg-black/80 px-6">
          <div className="text-center max-w-sm">
            <AlertCircle className="w-12 h-12 text-white/50 mx-auto mb-3" />
            <p className="text-white font-semibold mb-4">{error}</p>
            <div className="flex justify-center gap-3">
              {onClose && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-semibold"
                >
                  Voltar
                </button>
              )}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-semibold"
              >
                Tentar de novo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Next episode prompt — 2 min before end */}
      {showNextEpisodePrompt && nextEpisode && (
        <div className="sm-player-next-ep pointer-events-auto z-[18]">
          <button
            type="button"
            className="sm-player-next-ep-card"
            onClick={(e) => {
              e.stopPropagation();
              onNextEpisode?.();
            }}
          >
            {nextEpisode.stillUrl ? (
              <img
                src={nextEpisode.stillUrl}
                alt=""
                className="sm-player-next-ep-thumb"
              />
            ) : (
              <div className="sm-player-next-ep-thumb sm-player-next-ep-thumb--empty">
                <SkipForward size={22} />
              </div>
            )}
            <div className="sm-player-next-ep-meta">
              <span className="sm-player-next-ep-label">Próximo episódio</span>
              <span className="sm-player-next-ep-title">
                T{nextEpisode.season} · E{nextEpisode.episode}
                {nextEpisode.name ? ` · ${nextEpisode.name}` : ''}
              </span>
              <span className="sm-player-next-ep-cta">Assistir agora</span>
            </div>
          </button>
        </div>
      )}

      {/* Controls chrome */}
      <div
        data-controls
        className={cn(
          'absolute inset-0 z-[15] flex flex-col justify-between pointer-events-none transition-opacity duration-300',
          showControls || !isPlaying || !isNative ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Top */}
        <div className="sm-player-top pointer-events-auto">
          <div className="flex items-center gap-3 min-w-0">
            {onClose && (
              <button
                type="button"
                onClick={handleClose}
                className="sm-player-icon"
                aria-label="Voltar"
              >
                <ArrowLeft size={22} strokeWidth={1.8} />
              </button>
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm md:text-base truncate drop-shadow">
                {title || 'Reproduzindo'}
              </p>
              {subtitle && (
                <p className="text-white/55 text-xs mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Center play (native only) */}
        {/* Bottom */}
        <div className="sm-player-bottom pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {isNative ? (
            <>
              <div className="sm-player-seek group/seek">
                <div className="sm-player-seek-track">
                  <div className="sm-player-seek-buffer" style={{ width: `${bufferedPercent}%` }} />
                  <div className="sm-player-seek-progress" style={{ width: `${progressPercent}%` }} />
                </div>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const t = Number(e.target.value);
                    if (videoRef.current) videoRef.current.currentTime = t;
                    setCurrentTime(t);
                    resetControlsTimeout();
                  }}
                  className="sm-player-seek-input"
                  aria-label="Progresso"
                />
              </div>

              <div className="flex items-center justify-between gap-3 mt-2">
                <div className="flex items-center gap-1 md:gap-2">
                  <button type="button" className="sm-player-icon" onClick={handlePlayPause} aria-label="Play/Pause">
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                  </button>
                  <button type="button" className="sm-player-icon hidden sm:inline-flex" onClick={() => skipTime(-10)} aria-label="-10s">
                    <RotateCcw size={18} />
                  </button>
                  <button type="button" className="sm-player-icon" onClick={() => skipTime(10)} aria-label="+10s">
                    <RotateCw size={18} />
                  </button>

                  <div className="relative flex items-center">
                    <button
                      type="button"
                      className="sm-player-icon"
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
                          toggleMute();
                          return;
                        }
                        setShowVolume((v) => !v);
                      }}
                      onMouseEnter={() => setShowVolume(true)}
                      aria-label="Mute"
                    >
                      {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-200 hidden md:block',
                        showVolume ? 'w-24 opacity-100 ml-1' : 'w-0 opacity-0'
                      )}
                      onMouseLeave={() => setShowVolume(false)}
                    >
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          if (videoRef.current) {
                            videoRef.current.volume = v;
                            videoRef.current.muted = v === 0;
                          }
                          setVolume(v);
                          setIsMuted(v === 0);
                          resetControlsTimeout();
                        }}
                        className="sm-player-volume"
                        aria-label="Volume"
                      />
                    </div>
                  </div>

                  <span className="text-white/80 text-[11px] sm:text-xs md:text-sm tabular-nums ml-0.5 sm:ml-1 shrink-0">
                    {formatTime(currentTime)}
                    <span className="text-white/35 hidden sm:inline"> / </span>
                    <span className="hidden sm:inline">{formatTime(duration)}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={cn(
                      'sm-player-icon',
                      captionsEnabled && captionsReady && 'text-white',
                      !captionsReady && 'opacity-40'
                    )}
                    disabled={!captionsReady && !captionUrl}
                    onClick={() => {
                      setCaptionsEnabled((v) => !v);
                      resetControlsTimeout();
                    }}
                    aria-label={captionsEnabled ? 'Desligar legendas' : 'Ligar legendas'}
                    title={
                      captionsReady
                        ? captionsEnabled
                          ? 'Legendas ligadas'
                          : 'Legendas desligadas'
                        : 'Buscando legendas…'
                    }
                  >
                    {captionsEnabled && captionsReady ? (
                      <Captions size={20} />
                    ) : (
                      <CaptionsOff size={20} />
                    )}
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      className="sm-player-icon"
                      onClick={() => {
                        setShowSettings((v) => !v);
                        resetControlsTimeout();
                      }}
                      aria-label="Configurações"
                    >
                      <Settings size={18} />
                    </button>
                    {showSettings && (
                      <div
                        className="absolute bottom-full right-0 mb-2 w-[17.5rem] rounded-2xl bg-[#121212]/96 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3.5 pt-3.5 pb-3">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <p className="text-[11px] font-semibold text-white/90">Velocidade</p>
                            <p className="text-[10px] text-white/35 tabular-nums">
                              {playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
                            </p>
                          </div>
                          <div className="grid grid-cols-6 gap-1 rounded-xl bg-white/[0.04] p-1">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => {
                                  if (videoRef.current) videoRef.current.playbackRate = rate;
                                  setPlaybackRate(rate);
                                  resetControlsTimeout();
                                }}
                                className={cn(
                                  'h-8 rounded-lg text-[10px] font-semibold transition-colors',
                                  playbackRate === rate
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-white/65 hover:bg-white/8 hover:text-white'
                                )}
                              >
                                {rate === 1 ? '1x' : `${rate}x`}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="h-px bg-white/8" />

                        <div className="px-3.5 py-3.5">
                          <CaptionSettingsPanel
                            style={captionStyle}
                            onChangeStyle={updateCaptionStyle}
                            languages={captionLanguages}
                            selectedLang={selectedCaptionLang}
                            onSelectLang={handleSelectCaptionLang}
                            loadingLang={loadingCaptionLangs}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {pipSupported && (
                    <button type="button" className="sm-player-icon hidden sm:flex" onClick={() => void togglePiP()} aria-label="PiP">
                      <PictureInPicture2 size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="sm-player-icon"
                    onClick={() => void toggleFullscreen()}
                    aria-label="Fullscreen"
                  >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">{title}</p>
                <p className="text-white/45 text-xs mt-0.5">
                  {captionsReady
                    ? captionsEnabled
                      ? 'Legendas automáticas ligadas'
                      : 'Legendas desligadas'
                    : 'Player embutido · use F para tela cheia'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className={cn(
                    'sm-player-icon',
                    (!captionsReady || !captionsEnabled) && 'opacity-50'
                  )}
                  disabled={!captionsReady}
                  onClick={() => setCaptionsEnabled((v) => !v)}
                  aria-label="Legendas"
                  title="Legendas automáticas"
                >
                  {captionsEnabled && captionsReady ? (
                    <Captions size={20} />
                  ) : (
                    <CaptionsOff size={20} />
                  )}
                </button>
                <div className="relative">
                  <button
                    type="button"
                    className="sm-player-icon"
                    onClick={() => {
                      setShowSettings((v) => !v);
                      resetControlsTimeout();
                    }}
                    aria-label="Configurações"
                  >
                    <Settings size={18} />
                  </button>
                  {showSettings && (
                    <div
                      className="absolute bottom-full right-0 mb-2 w-[17.5rem] rounded-2xl bg-[#121212]/96 border border-white/10 shadow-2xl overflow-hidden backdrop-blur-md"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3.5 py-3.5">
                        <CaptionSettingsPanel
                          style={captionStyle}
                          onChangeStyle={updateCaptionStyle}
                          languages={captionLanguages}
                          selectedLang={selectedCaptionLang}
                          onSelectLang={handleSelectCaptionLang}
                          loadingLang={loadingCaptionLangs}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {hasNextEpisode && (
                  <button
                    type="button"
                    className="h-10 px-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-bold transition-colors inline-flex items-center gap-2"
                    onClick={() => onNextEpisode?.()}
                    aria-label="Próximo episódio"
                  >
                    <SkipForward size={16} />
                    Próximo
                  </button>
                )}
                <button
                  type="button"
                  className="h-10 px-5 rounded-full bg-white text-black text-sm font-bold hover:bg-neutral-200 transition-colors"
                  onClick={() => void toggleFullscreen()}
                >
                  Tela cheia
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
