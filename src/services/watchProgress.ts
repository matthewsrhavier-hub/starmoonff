/**
 * Progresso de visualização por perfil.
 * Cada perfil tem seu próprio histórico em localStorage (+ sync opcional no servidor).
 */

import { STORAGE_KEYS } from '@/lib/constants';
import { getSelectedProfileId } from '@/lib/selectedProfile';

export interface WatchProgressItem {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  media_type: 'movie' | 'tv';
  season: number | null;
  episode: number | null;
  progress: number; // 0.0 a 1.0
  /** Tempo em segundos no player (para retomar no mesmo ponto) */
  current_time?: number;
  duration?: number;
  updated_at: number; // timestamp
  profile_id?: string;
}

const SYNC_INTERVAL = 60000;
const LEGACY_KEY = STORAGE_KEYS.history || 'superflix_history';

let progressCache: Map<string, WatchProgressItem> = new Map();
let activeProfileId: string | null = null;
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSync = false;
let beforeUnloadBound = false;

function historyStorageKey(profileId?: string): string {
  const id = profileId || getSelectedProfileId();
  return `${LEGACY_KEY}:${id}`;
}

function getItemKey(item: { tmdb_id: number; season?: number | null; episode?: number | null }): string {
  if (item.season != null && item.episode != null && Number(item.season) >= 0 && Number(item.episode) >= 0) {
    return `${item.tmdb_id}-s${Number(item.season)}-e${Number(item.episode)}`;
  }
  return `${String(item.tmdb_id)}`;
}

function migrateLegacyHistory(profileId: string) {
  if (typeof window === 'undefined') return;
  try {
    const scopedKey = historyStorageKey(profileId);
    if (localStorage.getItem(scopedKey)) return;

    const migratedFlag = `${LEGACY_KEY}:migrated`;
    if (localStorage.getItem(migratedFlag)) return;

    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return;

    // Histórico antigo vai só para o primeiro perfil que abrir
    localStorage.setItem(scopedKey, legacy);
    localStorage.setItem(migratedFlag, profileId);
  } catch {
    /* ignore */
  }
}

export function loadLocalProgress(profileId?: string): Map<string, WatchProgressItem> {
  if (typeof window === 'undefined') return new Map();

  const id = profileId || getSelectedProfileId();
  activeProfileId = id;
  migrateLegacyHistory(id);

  try {
    const stored = localStorage.getItem(historyStorageKey(id));
    if (stored) {
      const items: WatchProgressItem[] = JSON.parse(stored);
      const map = new Map<string, WatchProgressItem>();
      items.forEach((item) => {
        map.set(getItemKey(item), { ...item, profile_id: id });
      });
      progressCache = map;
      return map;
    }
  } catch (error) {
    console.error('Error loading local progress:', error);
  }

  progressCache = new Map();
  return progressCache;
}

function saveToLocalStorage() {
  if (typeof window === 'undefined') return;
  const id = activeProfileId || getSelectedProfileId();

  try {
    const items = Array.from(progressCache.values())
      .map((item) => ({ ...item, profile_id: id }))
      .sort((a, b) => b.updated_at - a.updated_at)
      .slice(0, 100);
    localStorage.setItem(historyStorageKey(id), JSON.stringify(items));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/** Troca o cache para o perfil selecionado (chamar ao mudar de perfil). */
export function switchProfileHistory(profileId?: string) {
  if (pendingSync) {
    void syncToServer(true);
  }
  progressCache = new Map();
  loadLocalProgress(profileId);
}

const DEFAULT_TV_DURATION = 45 * 60;
const DEFAULT_MOVIE_DURATION = 110 * 60;

function isDefaultDurationGuess(sec?: number | null): boolean {
  if (typeof sec !== 'number' || !Number.isFinite(sec)) return true;
  return sec === DEFAULT_TV_DURATION || sec === DEFAULT_MOVIE_DURATION;
}

/**
 * Salva progresso local.
 * - force=true: grava do player (permite voltar/avançar)
 * - force=false: só sobe progresso (seed ao abrir página)
 */
export function saveProgressLocal(
  item: Omit<WatchProgressItem, 'updated_at'>,
  options?: { force?: boolean }
) {
  const profileId = getSelectedProfileId();
  if (activeProfileId !== profileId) {
    loadLocalProgress(profileId);
  }

  const key = getItemKey(item);
  const existing = progressCache.get(key);
  const force = options?.force === true;
  const newProgress = normalizeProgress(item.progress);
  const oldProgress = existing ? normalizeProgress(existing.progress) : 0;

  if (!force && existing && newProgress <= oldProgress) {
    return;
  }

  // Evita zerar histórico ao abrir/fechar o player com amostra ~0
  const newTime = Number(item.current_time);
  const oldTime = Number(existing?.current_time);
  if (
    existing &&
    oldProgress > 0.08 &&
    newProgress < 0.02 &&
    (!Number.isFinite(newTime) || newTime < 20) &&
    Number.isFinite(oldTime) &&
    oldTime > 60
  ) {
    return;
  }

  const nextDuration =
    typeof item.duration === 'number' && item.duration >= 60
      ? item.duration
      : existing?.duration;
  const nextTime =
    Number.isFinite(newTime) && newTime > 0
      ? newTime
      : existing?.current_time;

  const saved: WatchProgressItem = {
    ...existing,
    ...item,
    progress: newProgress,
    current_time: nextTime,
    duration: nextDuration,
    profile_id: profileId,
    updated_at: Date.now(),
  };
  progressCache.set(key, saved);
  saveToLocalStorage();
  scheduleSyncToServer();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('starmoon:progress', { detail: saved }));
  }
}

function scheduleSyncToServer() {
  if (syncTimeout) clearTimeout(syncTimeout);
  pendingSync = true;
  syncTimeout = setTimeout(() => {
    void syncToServer();
  }, SYNC_INTERVAL);
}

export async function syncToServer(force = false): Promise<void> {
  if (!pendingSync && !force) return;
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) {
    pendingSync = false;
    return;
  }

  const profileId = activeProfileId || getSelectedProfileId();

  try {
    const items = Array.from(progressCache.values())
      .filter((item) => item.progress > 0)
      .map((item) => ({
        tmdb_id: item.tmdb_id,
        title: item.title,
        poster_path: item.poster_path,
        media_type: item.media_type,
        season: item.season,
        episode: item.episode,
        progress: normalizeProgress(item.progress),
        current_time: item.current_time,
        duration: item.duration,
        profile_id: profileId,
      }));

    if (items.length === 0) {
      pendingSync = false;
      return;
    }

    const response = await fetch('/api/history/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items, profile_id: profileId }),
    });

    // Evita loop infinito de sync quando não autenticado
    if (response.ok || response.status === 401 || response.status === 403) {
      pendingSync = false;
    }
  } catch (error) {
    console.error('[WatchProgress] Sync error:', error);
    pendingSync = false;
  }
}

export async function loadFromServer(): Promise<void> {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(STORAGE_KEYS.token);
  if (!token) return;

  const profileId = activeProfileId || getSelectedProfileId();

  try {
    const response = await fetch(
      `/api/history/continue?profile_id=${encodeURIComponent(profileId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const serverItems: WatchProgressItem[] = await response.json();

      serverItems.forEach((serverItem) => {
        const key = getItemKey(serverItem);
        const localItem = progressCache.get(key);
        const serverUpdated =
          typeof serverItem.updated_at === 'number'
            ? serverItem.updated_at
            : new Date((serverItem as { watched_at?: string }).watched_at || (serverItem.updated_at as unknown as string)).getTime() || 0;

        // Local mais recente tem prioridade (evita apagar progresso acabado de gravar)
        if (localItem && (localItem.updated_at || 0) >= serverUpdated) {
          return;
        }

        if (!localItem || normalizeProgress(serverItem.progress) > normalizeProgress(localItem.progress)) {
          progressCache.set(key, {
            ...(localItem || {}),
            ...serverItem,
            progress: normalizeProgress(serverItem.progress),
            current_time: localItem?.current_time ?? serverItem.current_time,
            duration: localItem?.duration ?? serverItem.duration,
            profile_id: profileId,
            updated_at: serverUpdated || Date.now(),
          });
        }
      });

      saveToLocalStorage();
    }
  } catch (error) {
    console.error('[WatchProgress] Load from server error:', error);
  }
}

export function getProgress(
  tmdbId: number,
  season?: number | null,
  episode?: number | null
): number {
  const key = getItemKey({ tmdb_id: tmdbId, season, episode });
  return progressCache.get(key)?.progress || 0;
}

/** Item completo de progresso (fração + segundos) para retomar no player. */
export function getProgressItem(
  tmdbId: number,
  season?: number | null,
  episode?: number | null
): WatchProgressItem | null {
  const profileId = getSelectedProfileId();
  if (activeProfileId !== profileId || progressCache.size === 0) {
    loadLocalProgress(profileId);
  }
  const key = getItemKey({ tmdb_id: tmdbId, season, episode });
  return progressCache.get(key) || null;
}

function itemTimestamp(item: {
  updated_at?: number | string;
  watched_at?: number | string;
}): number {
  const raw = item.updated_at ?? item.watched_at;
  if (typeof raw === 'number') return raw;
  if (raw) return new Date(raw).getTime() || 0;
  return 0;
}

/** Uma entrada por título (série/filme) — evita vários episódios da mesma série. */
export function dedupeByTitle<
  T extends {
    tmdb_id: number;
    media_type?: string;
    updated_at?: number | string;
    watched_at?: number | string;
  },
>(items: T[]): T[] {
  const uniqueMap = new Map<string, T>();

  const sorted = [...items].sort((a, b) => itemTimestamp(b) - itemTimestamp(a));

  for (const item of sorted) {
    const key = `${item.media_type || 'movie'}-${item.tmdb_id}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values());
}

export function getContinueWatching(): WatchProgressItem[] {
  const allItems = Array.from(progressCache.values())
    .filter((item) => item.progress > 0 && item.progress < 0.95)
    .sort((a, b) => b.updated_at - a.updated_at);

  return dedupeByTitle(allItems).slice(0, 20);
}

/** Normaliza progresso para 0–1 (aceita 0–100 antigo). */
export function normalizeProgress(progress: number | null | undefined): number {
  const p = Number(progress);
  if (!Number.isFinite(p) || p <= 0) return 0;
  if (p > 1) return Math.min(1, p / 100);
  return p;
}

/**
 * Resolve duração em segundos para o label de restante.
 * Prefere tempo real do player; se for chute padrão (45/110 min), usa TMDB.
 */
export function resolveItemDurationSec(
  item: Pick<WatchProgressItem, 'progress' | 'current_time' | 'duration' | 'media_type'>,
  durationOverrideSec?: number | null
): number {
  const stored =
    typeof item.duration === 'number' && item.duration > 0 ? item.duration : 0;
  const storedSec = stored > 0 && stored < 60 ? stored * 60 : stored;
  const override =
    typeof durationOverrideSec === 'number' && durationOverrideSec > 0
      ? durationOverrideSec
      : 0;

  // Duração real do player (não é o fallback 45/110 min)
  if (storedSec >= 60 && !isDefaultDurationGuess(storedSec)) {
    return storedSec;
  }
  if (override >= 60) return override;
  if (storedSec >= 60) return storedSec;

  return item.media_type === 'tv' ? DEFAULT_TV_DURATION : DEFAULT_MOVIE_DURATION;
}

/** Segundos restantes (durationOverrideSec = runtime TMDB em segundos). */
export function getRemainingSeconds(
  item: Pick<WatchProgressItem, 'progress' | 'current_time' | 'duration' | 'media_type'>,
  durationOverrideSec?: number | null
): number | null {
  const progress = normalizeProgress(item.progress);
  if (progress <= 0 && !(typeof item.current_time === 'number' && item.current_time > 0)) {
    return null;
  }

  let duration = resolveItemDurationSec(item, durationOverrideSec);

  const currentTime =
    typeof item.current_time === 'number' && Number.isFinite(item.current_time)
      ? item.current_time
      : 0;

  // Se o tempo assistido + progresso implicam duração maior, ajusta
  if (currentTime > 30 && progress > 0.05 && progress < 0.95) {
    const implied = currentTime / progress;
    if (implied > duration && implied < duration * 2.5) {
      duration = implied;
    }
  }

  if (duration <= 0) return null;

  let watched: number;
  if (currentTime > 0) {
    watched = Math.min(currentTime, duration * 0.99);
  } else {
    watched = progress * duration;
  }

  if (!Number.isFinite(watched)) return null;
  return Math.max(0, duration - watched);
}

/** Texto: "Faltam 42 min para acabar o filme/episódio" */
export function formatRemainingLabel(
  item: Pick<WatchProgressItem, 'progress' | 'current_time' | 'duration' | 'media_type'>,
  durationOverrideSec?: number | null
): string {
  const kind = item.media_type === 'tv' ? 'o episódio' : 'o filme';
  const remaining = getRemainingSeconds(item, durationOverrideSec);

  if (remaining == null) {
    return item.media_type === 'tv' ? 'Continuar episódio' : 'Continuar filme';
  }

  if (remaining < 60) {
    return `Falta pouco para acabar ${kind}`;
  }

  const totalMin = Math.max(1, Math.round(remaining / 60));
  if (!Number.isFinite(totalMin)) {
    return item.media_type === 'tv' ? 'Continuar episódio' : 'Continuar filme';
  }

  if (totalMin < 60) {
    return `Faltam ${totalMin} min para acabar ${kind}`;
  }

  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (mins === 0) {
    return `Faltam ${hours}h para acabar ${kind}`;
  }
  return `Faltam ${hours}h ${mins}min para acabar ${kind}`;
}

export function getAllHistory(): WatchProgressItem[] {
  return Array.from(progressCache.values()).sort((a, b) => b.updated_at - a.updated_at);
}

export function clearLocalHistory(profileId?: string) {
  if (typeof window === 'undefined') return;
  const id = profileId || getSelectedProfileId();
  localStorage.removeItem(historyStorageKey(id));
  if ((activeProfileId || getSelectedProfileId()) === id) {
    progressCache = new Map();
  }
}

export function markAsCompleted(item: Omit<WatchProgressItem, 'updated_at' | 'progress'>) {
  saveProgressLocal({ ...item, progress: 0.95 });
}

export function initWatchProgress() {
  if (typeof window === 'undefined') return;

  loadLocalProgress();

  if (!beforeUnloadBound) {
    beforeUnloadBound = true;
    window.addEventListener('beforeunload', () => {
      if (!pendingSync) return;
      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (!token) return;

      const profileId = activeProfileId || getSelectedProfileId();
      const items = Array.from(progressCache.values())
        .filter((item) => item.progress > 0)
        .map((item) => ({
          tmdb_id: item.tmdb_id,
          title: item.title,
          poster_path: item.poster_path,
          media_type: item.media_type,
          season: item.season,
          episode: item.episode,
          progress: item.progress,
          profile_id: profileId,
        }));

      if (items.length > 0) {
        navigator.sendBeacon(
          '/api/history/sync',
          new Blob([JSON.stringify({ items, token, profile_id: profileId })], {
            type: 'application/json',
          })
        );
      }
    });
  }

  setTimeout(() => {
    void loadFromServer();
  }, 2000);
}

export function cleanupWatchProgress() {
  if (syncTimeout) clearTimeout(syncTimeout);
  void syncToServer(true);
}
