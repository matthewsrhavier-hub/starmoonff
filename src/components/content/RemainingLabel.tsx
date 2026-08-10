'use client';

import { useEffect, useMemo, useState } from 'react';
import { tmdb } from '@/services/tmdb';
import { formatRemainingLabel } from '@/services/watchProgress';

type ProgressLike = {
  tmdb_id?: number | string;
  media_type?: 'movie' | 'tv' | string;
  season?: number | null;
  episode?: number | null;
  progress?: number;
  current_time?: number;
  duration?: number;
};

async function fetchRuntimeSeconds(item: ProgressLike): Promise<number | null> {
  const tmdbId = Number(item.tmdb_id);
  if (!Number.isFinite(tmdbId) || tmdbId <= 0) return null;

  try {
    if (item.media_type === 'movie') {
      const details = await tmdb.getDetails('movie', tmdbId);
      return details.runtime && details.runtime > 0 ? details.runtime * 60 : null;
    }

    if (item.media_type === 'tv') {
      const seasonNum = Number(item.season) || 1;
      const episodeNum = Number(item.episode) || 1;
      try {
        const season = await tmdb.getSeasonDetails(tmdbId, seasonNum);
        const ep = season?.episodes?.find((e) => e.episode_number === episodeNum);
        if (ep?.runtime && ep.runtime > 0) return ep.runtime * 60;
      } catch {
        /* ignore */
      }
      const details = await tmdb.getDetails('tv', tmdbId);
      const avg = details.episode_run_time?.[0];
      return avg && avg > 0 ? avg * 60 : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function RemainingLabel({
  item,
  className,
}: {
  item: ProgressLike;
  className?: string;
}) {
  const [tmdbDurationSec, setTmdbDurationSec] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchRuntimeSeconds(item)
      .then((sec) => {
        if (!cancelled && typeof sec === 'number' && sec > 0) setTmdbDurationSec(sec);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [item.tmdb_id, item.media_type, item.season, item.episode]);

  const label = useMemo(() => {
    try {
      return formatRemainingLabel(
        {
          progress: item.progress || 0,
          current_time: item.current_time,
          duration: item.duration,
          media_type: item.media_type === 'tv' ? 'tv' : 'movie',
        },
        tmdbDurationSec
      );
    } catch {
      return item.media_type === 'tv' ? 'Continuar episódio' : 'Continuar filme';
    }
  }, [
    item.progress,
    item.current_time,
    item.duration,
    item.media_type,
    tmdbDurationSec,
  ]);

  return <p className={className}>{label}</p>;
}
