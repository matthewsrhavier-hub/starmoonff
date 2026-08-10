'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { tmdb, superflixApi } from '@/services/tmdb';
import { getPlayerCode } from '@/services/customContent';
import { VideoPlayer } from '@/components/player/VideoPlayer';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { CatalogPageBody, CatalogSection } from '@/components/content/CatalogSection';
import { ContentGrid } from '@/components/content/ContentGrid';
import { SkeletonPlayer } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import { cn } from '@/lib/utils';
import {
  saveProgressLocal,
  initWatchProgress,
  syncToServer,
  getProgressItem,
  loadLocalProgress,
  formatRemainingLabel,
} from '@/services/watchProgress';
import { getSelectedProfileId } from '@/lib/selectedProfile';
import {
  Play,
  Star,
  Heart,
  Share2,
  X,
  ArrowLeft,
  Clock,
  Calendar,
} from 'lucide-react';
import { LogoLink } from '@/components/layout/Logo';
import type { ContentDetails, Season, Episode, Content, CastMember } from '@/types/content';

export default function WatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const type = params.type as 'movie' | 'tv';
  const id = Number(params.id);
  const urlSeason = Number(searchParams.get('s')) || 1;
  const urlEpisode = Number(searchParams.get('e')) || 1;
  const wantAutoplay = searchParams.get('play') === '1';

  const [content, setContent] = useState<ContentDetails | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(urlSeason);
  const [selectedEpisode, setSelectedEpisode] = useState(urlEpisode);
  const [similar, setSimilar] = useState<Content[]>([]);
  const [cast, setCast] = useState<CastMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imdbId, setImdbId] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(wantAutoplay);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [playerCode, setPlayerCode] = useState<string | null>(null);
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(false);

  const customAvailableEpisodes = useMemo(() => {
    if (playerCode && playerCode.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(playerCode.trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            s: Number(item.s),
            e: Number(item.e),
          }));
        }
      } catch (e) {}
    }
    return null;
  }, [playerCode]);

  useEffect(() => {
    if (customAvailableEpisodes && customAvailableEpisodes.length > 0) {
      const validSeason = customAvailableEpisodes.some(ep => ep.s === selectedSeason);
      if (!validSeason) {
        const firstAvailSeason = Math.min(...customAvailableEpisodes.map(ep => ep.s));
        setSelectedSeason(firstAvailSeason);
      } else {
        const validEpisode = customAvailableEpisodes.some(ep => ep.s === selectedSeason && ep.e === selectedEpisode);
        if (!validEpisode) {
          const firstAvailEp = Math.min(...customAvailableEpisodes.filter(c => c.s === selectedSeason).map(c => c.e));
          setSelectedEpisode(firstAvailEp);
        }
      }
    }
  }, [playerCode, selectedSeason, selectedEpisode, customAvailableEpisodes]);

  useEffect(() => {
    loadContent();
    loadPlayerCode();
  }, [id, type]);

  const loadPlayerCode = async () => {
    setIsLoadingPlayer(true);
    try {
      const code = await getPlayerCode(id, type);
      setPlayerCode(code);
    } catch (err) {
      setPlayerCode(null);
    } finally {
      setIsLoadingPlayer(false);
    }
  };

  useEffect(() => {
    if (content && type === 'tv') {
      loadEpisodes(selectedSeason);
    }
  }, [selectedSeason, content]);

  // Continuar assistindo / deep-link: alinha temporada/episódio com a URL
  useEffect(() => {
    if (type !== 'tv') return;
    setSelectedSeason(urlSeason);
    setSelectedEpisode(urlEpisode);
  }, [type, id, urlSeason, urlEpisode]);

  // Espelha seleção na barra de endereço (sem mexer no router do Next)
  useEffect(() => {
    if (type !== 'tv') return;
    const newUrl = `/watch/tv/${id}?s=${selectedSeason}&e=${selectedEpisode}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedSeason, selectedEpisode, id, type]);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      // Detalhes primeiro — página pinta rápido; elenco/similares em seguida
      const details = await tmdb.getDetails(type, id);
      setContent(details);
      setIsLoading(false);

      const castList = (details.credits?.cast || [])
        .slice()
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        .slice(0, 16);
      setCast(castList);

      if (details.videos?.results) {
        const trailer = details.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) setTrailerKey(trailer.key);
      }
      if (details.external_ids?.imdb_id) setImdbId(details.external_ids.imdb_id);

      const fromDetails = (details.similar?.results || []).map((item) => ({
        ...item,
        media_type: item.media_type || type,
      }));

      if (fromDetails.length > 0) {
        setSimilar(
          fromDetails
            .filter((item, index, arr) => item.id !== id && arr.findIndex((x) => x.id === item.id) === index)
            .slice(0, 18)
        );
      } else {
        void tmdb
          .getSimilar(type, id)
          .then((similarRes) => {
            const fromApi = (similarRes.results || []).map((item) => ({
              ...item,
              media_type: item.media_type || type,
            }));
            setSimilar(
              fromApi
                .filter((item, index, arr) => item.id !== id && arr.findIndex((x) => x.id === item.id) === index)
                .slice(0, 18)
            );
          })
          .catch(() => setSimilar([]));
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setIsLoading(false);
      // Mesmo se os detalhes falharem, tenta pegar o IMDb para o player
      try {
        const ids = await tmdb.getExternalIds(type, id);
        if (ids?.imdb_id) setImdbId(ids.imdb_id);
      } catch {
        /* ignore */
      }
    }
  };

  const loadEpisodes = async (seasonNum: number) => {
    try {
      const data = await tmdb.getSeasonDetails(id, seasonNum);
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error('Error loading episodes:', error);
    }
  };

  useEffect(() => {
    return () => {
      void syncToServer(true);
    };
  }, []);

  const saveToHistory = (
    contentData: ContentDetails | null | undefined,
    progress: number = 0.1,
    extras?: {
      current_time?: number;
      duration?: number;
      force?: boolean;
      season?: number | null;
      episode?: number | null;
    }
  ) => {
    if (!contentData?.id) return;
    const safeProgress = Number(progress);
    if (!Number.isFinite(safeProgress) || safeProgress < 0) return;

    const season =
      type === 'tv'
        ? extras?.season != null
          ? Number(extras.season)
          : selectedSeason
        : null;
    const episode =
      type === 'tv'
        ? extras?.episode != null
          ? Number(extras.episode)
          : selectedEpisode
        : null;

    saveProgressLocal(
      {
        tmdb_id: contentData.id,
        title: contentData.title || contentData.name || 'Sem titulo',
        poster_path: contentData.poster_path,
        backdrop_path: contentData.backdrop_path,
        media_type: type,
        season,
        episode,
        progress: safeProgress > 1 ? safeProgress / 100 : safeProgress,
        current_time: extras?.current_time,
        duration: extras?.duration,
      },
      { force: extras?.force }
    );
  };

  const resumeState = useMemo(() => {
    loadLocalProgress(getSelectedProfileId());
    const item = getProgressItem(
      id,
      type === 'tv' ? selectedSeason : null,
      type === 'tv' ? selectedEpisode : null
    );
    if (!item || item.progress >= 0.95) {
      return { progress: 0, time: 0, item: null as ReturnType<typeof getProgressItem> };
    }
    return {
      progress: item.progress || 0,
      time: item.current_time || 0,
      item,
    };
  }, [id, type, selectedSeason, selectedEpisode, isPlaying]);

  useEffect(() => {
    initWatchProgress();
  }, []);

  // Abre o player ao vir de "Continuar assistindo" (?play=1)
  useEffect(() => {
    if (wantAutoplay) setIsPlaying(true);
  }, [wantAutoplay, id, type]);

  const handleEpisodeSelect = (ep: Episode) => {
    setSelectedEpisode(ep.episode_number);
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const seasonNumbers = useMemo(() => {
    if (!content?.seasons) return [] as number[];
    return content.seasons
      .filter((s: Season) => {
        if (s.season_number <= 0) return false;
        if (customAvailableEpisodes) {
          return customAvailableEpisodes.some((ep) => ep.s === s.season_number);
        }
        return true;
      })
      .map((s: Season) => s.season_number)
      .sort((a, b) => a - b);
  }, [content, customAvailableEpisodes]);

  const nextEpisodeInfo = useMemo(() => {
    if (type !== 'tv') return null;

    const nextInSeason = [...episodes]
      .filter((ep) => {
        if (ep.episode_number <= selectedEpisode) return false;
        if (customAvailableEpisodes) {
          return customAvailableEpisodes.some(
            (c) => c.s === selectedSeason && c.e === ep.episode_number
          );
        }
        return true;
      })
      .sort((a, b) => a.episode_number - b.episode_number)[0];

    if (nextInSeason) {
      return {
        season: selectedSeason,
        episode: nextInSeason.episode_number,
        name: nextInSeason.name,
        stillUrl: nextInSeason.still_path
          ? tmdb.getImageUrl(nextInSeason.still_path, 'w300')
          : null,
      };
    }

    const nextSeason = seasonNumbers.find((s) => s > selectedSeason);
    if (!nextSeason) return null;

    if (customAvailableEpisodes) {
      const nextEps = customAvailableEpisodes
        .filter((c) => c.s === nextSeason)
        .map((c) => c.e)
        .sort((a, b) => a - b);
      if (nextEps.length === 0) return null;
      return {
        season: nextSeason,
        episode: nextEps[0],
        name: `Episódio ${nextEps[0]}`,
        stillUrl: null as string | null,
      };
    }

    return {
      season: nextSeason,
      episode: 1,
      name: 'Episódio 1',
      stillUrl: null as string | null,
    };
  }, [
    type,
    episodes,
    selectedEpisode,
    selectedSeason,
    customAvailableEpisodes,
    seasonNumbers,
  ]);

  const goToNextEpisode = useCallback(() => {
    if (!nextEpisodeInfo) return;
    setSelectedSeason(nextEpisodeInfo.season);
    setSelectedEpisode(nextEpisodeInfo.episode);
    setIsPlaying(true);
  }, [nextEpisodeInfo]);

  // Bloqueia scroll do body enquanto player estiver aberto
  useEffect(() => {
    if (isPlaying) {
      document.body.classList.add('player-open');
    } else {
      document.body.classList.remove('player-open');
    }
    return () => {
      document.body.classList.remove('player-open');
    };
  }, [isPlaying]);

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resolvedPlayerCode =
    playerCode ||
    superflixApi.getEmbedUrl(
      type,
      type === 'movie' ? (imdbId || String(id)) : String(id),
      selectedSeason,
      selectedEpisode
    );

  // Player tem prioridade: nunca ficar preso em skeleton sem montar o iframe
  if (isPlaying) {
    const title = content?.title || content?.name || 'Starmoon';
    const backdropUrl = content?.backdrop_path ? tmdb.getImageUrl(content.backdrop_path, 'w1280') : null;
    const posterUrl = content?.poster_path ? tmdb.getImageUrl(content.poster_path, 'w500') : null;
    const episodeRuntime =
      type === 'tv'
        ? episodes.find((e) => e.episode_number === selectedEpisode)?.runtime || null
        : null;
    const runtime = episodeRuntime || content?.runtime || content?.episode_run_time?.[0];
    const estimatedDurationSec =
      typeof runtime === 'number' && runtime > 0
        ? runtime < 1000
          ? runtime * 60
          : runtime
        : type === 'tv'
          ? 45 * 60
          : 2 * 60 * 60;

    const nextEpisodeInfo =
      type === 'tv' && episodes.length > 0
        ? (() => {
            const idx = episodes.findIndex((e) => e.episode_number === selectedEpisode);
            const next = idx >= 0 ? episodes[idx + 1] : null;
            if (!next) return null;
            return {
              season: selectedSeason,
              episode: next.episode_number,
              name: next.name,
              stillUrl: next.still_path ? tmdb.getImageUrl(next.still_path, 'w300') : null,
            };
          })()
        : null;

    const goToNextEpisode = () => {
      if (!nextEpisodeInfo) return;
      setSelectedSeason(nextEpisodeInfo.season);
      setSelectedEpisode(nextEpisodeInfo.episode);
      setIsPlaying(true);
    };

    const resumeState = (() => {
      try {
        const item = getProgressItem(loadLocalProgress(), type, id, {
          season: type === 'tv' ? selectedSeason : undefined,
          episode: type === 'tv' ? selectedEpisode : undefined,
        });
        return {
          progress: item?.progress || 0,
          time: item?.current_time || 0,
        };
      } catch {
        return { progress: 0, time: 0 };
      }
    })();

    return (
      <div className="min-h-[100dvh] bg-black">
        <div className="sm-watch-player-shell fixed inset-0 z-[9999] w-screen h-[100dvh] min-h-[100svh] bg-black overflow-hidden">
          {isLoadingPlayer ? (
            <div className="w-full h-full flex items-center justify-center text-white/70">
              Carregando player...
            </div>
          ) : (
            <VideoPlayer
              playerCode={resolvedPlayerCode}
              mediaType={type}
              season={type === 'tv' ? selectedSeason : undefined}
              episode={type === 'tv' ? selectedEpisode : undefined}
              title={title}
              posterUrl={backdropUrl || posterUrl || ''}
              imdbId={imdbId}
              tmdbId={id}
              nextEpisode={type === 'tv' ? nextEpisodeInfo : null}
              onNextEpisode={type === 'tv' && nextEpisodeInfo ? goToNextEpisode : undefined}
              onClose={() => setIsPlaying(false)}
              initialProgress={resumeState.progress}
              initialTime={resumeState.time}
              estimatedDuration={estimatedDurationSec}
              onProgress={(progress, currentTime, duration, meta) => {
                if (!content) return;
                saveToHistory(content, progress, {
                  current_time: currentTime,
                  duration,
                  force: true,
                  season: meta?.season,
                  episode: meta?.episode,
                });
              }}
              className="w-full h-full min-h-[100svh]"
              forceMobileLandscape={false}
            />
          )}
        </div>
      </div>
    );
  }

  // Com ?play=1 / Assistir, não fica preso no skeleton da página
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <SkeletonPlayer />
      </div>
    );
  }
  if (!content) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center text-white">
        <Link href="/">
          <Button>Voltar ao início</Button>
        </Link>
      </div>
    );
  }

  const title = content.title || content.name || 'Sem título';
  const originalTitle = (content as any).original_title || (content as any).original_name || null;
  const backdropUrl = content.backdrop_path ? tmdb.getImageUrl(content.backdrop_path, 'w1280') : null;
  const posterUrl = content.poster_path ? tmdb.getImageUrl(content.poster_path, 'w500') : null;
  const rating = content.vote_average?.toFixed(1);
  const voteCount = content.vote_count || 0;
  const releaseDate = content.release_date || content.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const formattedDate = releaseDate
    ? new Date(releaseDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;
  const episodeRuntime =
    type === 'tv'
      ? episodes.find((e) => e.episode_number === selectedEpisode)?.runtime || null
      : null;
  const runtime = episodeRuntime || content.runtime || content.episode_run_time?.[0];
  const estimatedDurationSec =
    typeof runtime === 'number' && runtime > 0
      ? runtime < 1000
        ? runtime * 60
        : runtime
      : type === 'tv'
        ? 45 * 60
        : 110 * 60;
  const genres = content.genres?.map((g) => g.name) || [];
  const matchPercent = content.vote_average ? Math.round((content.vote_average / 10) * 100) : null;
  const directors = (content.credits?.crew || [])
    .filter((c) => c.job === 'Director')
    .map((c) => c.name)
    .slice(0, 3);
  const creators = (content.created_by || []).map((c) => c.name).slice(0, 3);
  const writers = (content.credits?.crew || [])
    .filter((c) => c.job === 'Writer' || c.job === 'Screenplay')
    .map((c) => c.name)
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .slice(0, 3);
  const companies = (content.production_companies || [])
    .map((c) => c.name)
    .filter(Boolean)
    .slice(0, 4);
  const languages = (content.spoken_languages || [])
    .map((l) => l.name || l.english_name)
    .filter(Boolean)
    .slice(0, 4);
  const networks = (content.networks || []).map((n) => n.name).slice(0, 3);
  const statusLabel = content.status
    ? ({
        Released: 'Lançado',
        Rumored: 'Rumor',
        Planned: 'Planejado',
        'In Production': 'Em produção',
        'Post Production': 'Pós-produção',
        Canceled: 'Cancelado',
        Ended: 'Finalizada',
        Returning: 'Em renovação',
        'Returning Series': 'Renovada',
      } as Record<string, string>)[content.status] || content.status
    : null;

  const seasonOptions = content.seasons?.filter((s: Season) => {
    if (s.season_number <= 0) return false;
    if (customAvailableEpisodes) return customAvailableEpisodes.some((ep) => ep.s === s.season_number);
    return true;
  }).map((s: Season) => ({ value: String(s.season_number), label: `Temporada ${s.season_number}` })) || [];

  const filteredEpisodes = episodes.filter((ep) => {
    if (customAvailableEpisodes) return customAvailableEpisodes.some((c) => c.s === selectedSeason && c.e === ep.episode_number);
    return true;
  });

  return (
    <div className="min-h-[100dvh] bg-black">
          {/* Hero detalhes */}
          <section className="relative w-full min-h-[72svh] md:min-h-[78vh]">
            {/* Backdrop isolado para não cortar o poster */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
              {backdropUrl ? (
                <img
                  src={backdropUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
              ) : posterUrl ? (
                <img
                  src={posterUrl}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-top opacity-60 blur-sm scale-110"
                />
              ) : (
                <div className="absolute inset-0 bg-[#111]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/35" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
            </div>

            <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 md:px-10 py-4 md:py-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="w-10 h-10 rounded-full bg-black/50 border border-white/15 text-white inline-flex items-center justify-center hover:bg-black/70 transition-colors"
                  aria-label="Voltar"
                >
                  <ArrowLeft size={18} />
                </Link>
                <LogoLink size="sm" />
              </div>
            </header>

            <div className="relative z-10 flex items-end px-4 sm:px-6 md:px-10 pb-10 md:pb-14 pt-4 md:pt-8 min-h-[calc(72svh-4.5rem)] md:min-h-[calc(78vh-5rem)]">
              <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-end gap-5 md:gap-8">
                {/* Poster inteiro — sem cortar a borda de cima */}
                {posterUrl && (
                  <div className="shrink-0 w-[120px] sm:w-[160px] md:w-[200px] lg:w-[220px]">
                    <div className="aspect-[2/3] rounded-xl bg-[#141414] border border-white/30 shadow-[0_12px_40px_rgba(0,0,0,0.65)]">
                      <div className="w-full h-full rounded-[11px] overflow-hidden">
                        <img
                          src={posterUrl}
                          alt={title}
                          className="w-full h-full object-cover object-top"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0 sm:pb-1">
                  <div className="inline-flex mb-3 px-2.5 py-1 bg-white rounded-sm items-baseline">
                    <span className="text-[11px] font-black tracking-tight text-black leading-none">
                      Star<span className="font-light text-black/75">moon</span>
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.05] mb-3 drop-shadow-lg">
                    {title}
                  </h1>

                  {content.tagline && (
                    <p className="text-white/70 text-sm md:text-base font-medium mb-3 line-clamp-2">
                      {content.tagline}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-white/85 mb-4">
                    {rating && Number(rating) > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-white">
                        <Star size={14} fill="currentColor" className="text-white" />
                        {rating}
                      </span>
                    )}
                    {matchPercent != null && (
                      <span className="font-bold text-white">{matchPercent}% Match</span>
                    )}
                    {year && (
                      <span className="inline-flex items-center gap-1 text-white/70">
                        <Calendar size={13} />
                        {year}
                      </span>
                    )}
                    {runtime ? (
                      <span className="inline-flex items-center gap-1 text-white/70">
                        <Clock size={13} />
                        {runtime} min
                      </span>
                    ) : null}
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold">
                      {type === 'tv' ? 'Série' : 'Filme'}
                    </span>
                    {genres.slice(0, 5).map((g) => (
                      <span
                        key={g}
                        className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold"
                      >
                        {g}
                      </span>
                    ))}
                    {type === 'tv' && content.number_of_seasons != null && (
                      <span className="text-white/70">
                        {content.number_of_seasons} temp.
                        {content.number_of_episodes != null
                          ? ` · ${content.number_of_episodes} eps.`
                          : ''}
                      </span>
                    )}
                    {directors[0] && (
                      <span className="text-white/70">Dir. {directors[0]}</span>
                    )}
                    {creators[0] && !directors[0] && (
                      <span className="text-white/70">Criação: {creators[0]}</span>
                    )}
                  </div>

                  {type === 'tv' && (
                    <p className="text-white/50 text-xs sm:text-sm mb-4">
                      Temporada {selectedSeason} · Episódio {selectedEpisode}
                    </p>
                  )}

                  {content.overview && (
                    <p className="hidden sm:block text-white/75 text-sm md:text-[15px] leading-relaxed line-clamp-3 max-w-2xl mb-6">
                      {content.overview}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={startPlayback}
                      className="inline-flex items-center justify-center gap-2 h-12 min-w-[9rem] px-7 rounded-full bg-white text-black font-bold text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all"
                    >
                      <Play size={17} fill="currentColor" strokeWidth={0} />
                      {resumeState.item
                        ? type === 'tv'
                          ? 'Continuar episódio'
                          : 'Continuar filme'
                        : 'Assistir'}
                    </button>
                    {resumeState.item ? (
                      <span className="text-white/55 text-xs sm:text-sm max-w-[14rem] truncate">
                        {formatRemainingLabel(resumeState.item, estimatedDurationSec)}
                      </span>
                    ) : null}

                    {trailerKey && (
                      <button
                        type="button"
                        onClick={() => setShowTrailer(true)}
                        className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-full bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/15 transition-all"
                      >
                        <Play size={15} />
                        Trailer
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={cn(
                        'w-12 h-12 rounded-full inline-flex items-center justify-center border transition-all',
                        isFavorite
                          ? 'bg-white text-black border-white'
                          : 'bg-black/40 border-white/25 text-white hover:border-white/50'
                      )}
                      aria-label="Favoritar"
                    >
                      <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title, url: window.location.href }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          showToast('Link copiado!', 'success');
                        }
                      }}
                      className="w-12 h-12 rounded-full inline-flex items-center justify-center bg-black/40 border border-white/25 text-white hover:border-white/50 transition-all"
                      aria-label="Compartilhar"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <CatalogPageBody overlap={false}>
            {content.overview && (
              <CatalogSection title="Sinopse">
                <p className="text-zinc-300 text-sm sm:text-base md:text-[15px] leading-relaxed max-w-4xl">
                  {content.overview}
                </p>
              </CatalogSection>
            )}

            <CatalogSection title="Informações">
              <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/8">
                  <div className="p-5 sm:p-6 space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
                      Geral
                    </p>
                    <InfoRow label="Título" value={title} />
                    {originalTitle && originalTitle !== title && (
                      <InfoRow label="Título original" value={originalTitle} />
                    )}
                    <InfoRow label="Tipo" value={type === 'tv' ? 'Série' : 'Filme'} />
                    {formattedDate && <InfoRow label="Lançamento" value={formattedDate} />}
                    {statusLabel && <InfoRow label="Status" value={statusLabel} />}
                  </div>

                  <div className="p-5 sm:p-6 space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
                      Detalhes
                    </p>
                    {runtime ? (
                      <InfoRow
                        label={type === 'tv' ? 'Duração do episódio' : 'Duração'}
                        value={`${runtime} min`}
                      />
                    ) : null}
                    {type === 'tv' && content.number_of_seasons != null && (
                      <InfoRow label="Temporadas" value={String(content.number_of_seasons)} />
                    )}
                    {type === 'tv' && content.number_of_episodes != null && (
                      <InfoRow label="Episódios" value={String(content.number_of_episodes)} />
                    )}
                    {rating && Number(rating) > 0 && (
                      <InfoRow
                        label="Avaliação"
                        value={`${rating}/10${voteCount ? ` · ${voteCount.toLocaleString('pt-BR')} votos` : ''}`}
                      />
                    )}
                    {genres.length > 0 && <InfoRow label="Gêneros" value={genres.join(', ')} />}
                    {languages.length > 0 && (
                      <InfoRow label="Idiomas" value={languages.join(', ')} />
                    )}
                  </div>

                  <div className="p-5 sm:p-6 space-y-4 md:col-span-2 lg:col-span-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/35">
                      Equipe & produção
                    </p>
                    {directors.length > 0 && (
                      <InfoRow label="Direção" value={directors.join(', ')} />
                    )}
                    {creators.length > 0 && (
                      <InfoRow label="Criação" value={creators.join(', ')} />
                    )}
                    {writers.length > 0 && (
                      <InfoRow label="Roteiro" value={writers.join(', ')} />
                    )}
                    {networks.length > 0 && (
                      <InfoRow label="Emissora" value={networks.join(', ')} />
                    )}
                    {companies.length > 0 && (
                      <InfoRow label="Produção" value={companies.join(', ')} />
                    )}
                    {type === 'movie' && content.budget != null && content.budget > 0 && (
                      <InfoRow
                        label="Orçamento"
                        value={content.budget.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        })}
                      />
                    )}
                    {type === 'movie' && content.revenue != null && content.revenue > 0 && (
                      <InfoRow
                        label="Bilheteria"
                        value={content.revenue.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'USD',
                          maximumFractionDigits: 0,
                        })}
                      />
                    )}
                  </div>
                </div>
              </div>
            </CatalogSection>

            {cast.length > 0 && (
              <CatalogSection title="Elenco">
                <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-1 -mx-1 px-1">
                  {cast.map((person) => {
                    const photo = person.profile_path
                      ? tmdb.getImageUrl(person.profile_path, 'w185')
                      : null;
                    return (
                      <div
                        key={person.id}
                        className="shrink-0 w-[88px] sm:w-[100px] md:w-[112px] flex flex-col items-center text-center"
                      >
                        <div className="w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] md:w-[112px] md:h-[112px] rounded-full overflow-hidden bg-[#1a1a1a] ring-1 ring-white/10 mb-2.5">
                          {photo ? (
                            <img
                              src={photo}
                              alt={person.name}
                              className="w-full h-full object-cover object-top"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/35 text-2xl font-bold">
                              {person.name[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug">
                          {person.name}
                        </p>
                        {person.character && (
                          <p className="text-[11px] sm:text-xs text-white/40 line-clamp-2 mt-0.5 leading-snug">
                            {person.character}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CatalogSection>
            )}

            {type === 'tv' && seasonOptions.length > 0 && (
              <CatalogSection
                title="Episódios"
                action={
                  <Select
                    options={seasonOptions}
                    value={String(selectedSeason)}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="w-full sm:w-48"
                  />
                }
              >
                <div className="flex gap-3 sm:gap-3.5 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2 -mx-1 px-1">
                  {filteredEpisodes.map((ep) => {
                    const active = ep.episode_number === selectedEpisode;
                    const still = ep.still_path
                      ? tmdb.getImageUrl(ep.still_path, 'w500')
                      : posterUrl;
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => handleEpisodeSelect(ep)}
                        className={cn(
                          'group shrink-0 w-[220px] sm:w-[240px] md:w-[260px] text-left rounded-2xl overflow-hidden border transition-all active:scale-[0.98]',
                          active
                            ? 'border-white/40 bg-white/10 ring-1 ring-white/25'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                        )}
                      >
                        <div className="relative aspect-video bg-[#141414] overflow-hidden">
                          {still ? (
                            <img
                              src={still}
                              alt={ep.name}
                              className={cn(
                                'w-full h-full transition-transform duration-300 group-hover:scale-[1.03]',
                                ep.still_path ? 'object-cover object-center' : 'object-cover object-top'
                              )}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#1a1a1a]" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                          <div
                            className={cn(
                              'absolute inset-0 flex items-center justify-center transition-opacity',
                              active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            )}
                          >
                            <span className="w-11 h-11 rounded-full bg-white text-black inline-flex items-center justify-center shadow-lg">
                              <Play size={18} fill="currentColor" strokeWidth={0} className="ml-0.5" />
                            </span>
                          </div>
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/70 border border-white/15 text-[10px] font-bold tracking-wide text-white">
                            E{ep.episode_number}
                          </span>
                        </div>
                        <div className="px-3.5 py-3">
                          <h3 className="font-semibold text-white text-sm line-clamp-1">
                            {ep.name || `Episódio ${ep.episode_number}`}
                          </h3>
                          <p className="text-white/40 text-xs line-clamp-2 mt-1 leading-relaxed min-h-[2rem]">
                            {ep.overview || 'Sem descrição.'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CatalogSection>
            )}

            {similar.length > 0 && (
              <CatalogSection title="Títulos semelhantes">
                <ContentGrid items={similar.slice(0, 18)} columns={6} layout="row" />
              </CatalogSection>
            )}
          </CatalogPageBody>
      {showTrailer && trailerKey && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setShowTrailer(false)}
        >
          <button className="absolute top-6 right-6 text-white hover:text-white/70 transition-colors">
            <X size={32} />
          </button>
          <div
            className="w-full max-w-5xl aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-1">
        {label}
      </dt>
      <dd className="text-sm sm:text-[15px] text-white/90 leading-snug">{value}</dd>
    </div>
  );
}
