'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/Button';
import { ContentGrid } from '@/components/content/ContentGrid';
import { SkeletonProfile } from '@/components/ui/Skeleton';
import { ClearCacheButton } from '@/components/ui/ClearCacheButton';
import {
  User,
  Heart,
  Clock,
  Settings,
  LogOut,
  Trash2,
  Save,
  Pen,
  ChevronRight,
  Shield,
  Crown,
  ArrowLeft,
  Plus,
  Users,
  Film,
  Play,
  Tv,
} from 'lucide-react';
import type { Content } from '@/types/content';
import type { WatchHistoryItem } from '@/types/user';
import Link from 'next/link';
import { ProfileHeader } from '@/components/layout/ProfileHeader';
import { getSelectedProfile, setSelectedProfile } from '@/lib/selectedProfile';
import { tmdb } from '@/services/tmdb';
import { dedupeByTitle } from '@/services/watchProgress';
import { RemainingLabel } from '@/components/content/RemainingLabel';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, updateProfile, isLoading: authLoading, token } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<Content[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);

  // 'menu', 'history', 'favorites', 'edit'
  const [currentView, setCurrentView] = useState<'menu' | 'history' | 'favorites' | 'edit'>('menu');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatarUrl(user.avatar_url || '');
      loadUserData();
      loadProfiles();
    }
  }, [user, token]);

  const loadProfiles = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/profiles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfiles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  };

  const switchToProfile = async (profile: any) => {
    const { switchProfileHistory, syncToServer } = await import('@/services/watchProgress');
    void syncToServer(true);
    setSelectedProfile(profile);
    switchProfileHistory(String(profile.id));
    router.replace('/');
  };

  const loadUserData = async () => {
    setIsLoadingData(true);
    try {
      const { getSelectedProfileId } = await import('@/lib/selectedProfile');
      const {
        loadLocalProgress,
        getAllHistory,
        loadFromServer,
      } = await import('@/services/watchProgress');
      const { STORAGE_KEYS } = await import('@/lib/constants');

      const profileId = getSelectedProfileId();
      loadLocalProgress(profileId);

      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (token) {
        await loadFromServer();
        const historyRes = await fetch(
          `/api/history?profile_id=${encodeURIComponent(profileId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (Array.isArray(historyData) && historyData.length > 0) {
            setHistory(historyData);
            setIsLoadingData(false);
            return;
          }
        }
      }

      const local = getAllHistory().map((item, index) => ({
        id: index,
        user_id: String(user?.id || 'local'),
        tmdb_id: item.tmdb_id,
        imdb_id: null,
        title: item.title,
        poster_path: item.poster_path,
        media_type: item.media_type,
        season: item.season,
        episode: item.episode,
        progress: item.progress,
        current_time: item.current_time,
        duration: item.duration,
        watched_at: new Date(item.updated_at).toISOString(),
      }));
      setHistory(local as unknown as WatchHistoryItem[]);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToast('Nome não pode estar vazio', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(name.trim(), avatarUrl);
      showToast('Perfil atualizado com sucesso', 'success');
      setCurrentView('menu');
    } catch (error: any) {
      showToast(error.message || 'Erro ao atualizar perfil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('Tem certeza que deseja limpar o histórico deste perfil?')) return;

    try {
      const { getSelectedProfileId } = await import('@/lib/selectedProfile');
      const { clearLocalHistory } = await import('@/services/watchProgress');
      const { STORAGE_KEYS } = await import('@/lib/constants');

      const profileId = getSelectedProfileId();
      clearLocalHistory(profileId);

      const token = localStorage.getItem(STORAGE_KEYS.token);
      if (token) {
        await fetch(`/api/history?profile_id=${encodeURIComponent(profileId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setHistory([]);
      showToast('Histórico deste perfil limpo', 'success');
    } catch (error) {
      showToast('Erro ao limpar histórico', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (authLoading || !user) {
    return <SkeletonProfile />;
  }

  const historyAsContent: Content[] = history.map((item) => ({
    id: item.tmdb_id,
    title: item.title,
    name: item.title,
    poster_path: item.poster_path,
    backdrop_path: null,
    media_type: item.media_type as 'movie' | 'tv',
    vote_average: 0,
    vote_count: 0,
    popularity: 0,
    overview: '',
  }));

  // Render Sub-Views
  if (currentView !== 'menu') {
    return (
      <div className="min-h-screen bg-black text-white font-sans animate-in fade-in duration-500 md:pl-[var(--sidebar-width)] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.06),transparent_55%)]" />
        <ProfileHeader />
        <div className="relative z-10 max-w-[1100px] mx-auto md:mx-0 px-5 sm:px-6 md:px-5 lg:px-6 xl:px-8 pt-[calc(3.5rem+1.25rem)] md:pt-[calc(4.5rem+1.5rem)] pb-28">
          <button 
            onClick={() => setCurrentView('menu')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold text-sm">Voltar ao Perfil</span>
          </button>

          {currentView === 'history' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold">Histórico</h2>
                {history.length > 0 && (
                  <Button variant="danger" size="sm" onClick={handleClearHistory} className="gap-2 rounded-full px-6">
                    <Trash2 size={16} /> Limpar
                  </Button>
                )}
              </div>
              <ContentGrid items={historyAsContent} isLoading={isLoadingData} showType columns={6} emptyMessage="Nenhum conteúdo assistido ainda" />
            </div>
          )}

          {currentView === 'favorites' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-bold mb-8">Meus Favoritos</h2>
              <ContentGrid items={favorites} isLoading={isLoadingData} showType columns={6} emptyMessage="Nenhum favorito ainda" />
            </div>
          )}

          {currentView === 'edit' && (
            <div className="max-w-md mx-auto pt-4 animate-in zoom-in-95 duration-500">
              <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[48px] border border-white/10 shadow-3xl">
                <h2 className="text-2xl font-bold mb-10 text-center tracking-tight">Editar Perfil</h2>
                
                <div className="flex flex-col items-center mb-10">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload-edit')?.click()}>
                    <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-[var(--accent-teal)] via-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-white text-4xl font-bold shadow-2xl overflow-hidden border-[3px] border-white/10">
                      {avatarUrl ? (
                         <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Pen size={20} className="text-white" />
                    </div>
                    <input id="avatar-upload-edit" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-4 font-bold">Toque para trocar a foto</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1 text-left">Seu Nome</label>
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl py-4 pl-12 pr-4 text-white placeholder-[var(--text-tertiary)] focus:border-white/30 outline-none transition-all"
                        placeholder="Como quer ser chamado?"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1 text-left">E-mail</label>
                    <div className="relative opacity-50">
                      <Settings size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input 
                        value={user.email} 
                        disabled 
                        className="w-full bg-black/20 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-zinc-400 outline-none"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveProfile} 
                    loading={isSaving} 
                    className="w-full h-14 gap-2 rounded-full mt-4 font-bold text-base"
                  >
                    <Save size={20} /> Salvar Perfil
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const watchingProfile = getSelectedProfile();
  const current =
    profiles.find((p) => String(p.id) === String(watchingProfile?.id)) || profiles[0] || null;
  const otherProfiles = profiles.filter((p) => String(p.id) !== String(current?.id));

  const displayName = current?.name || watchingProfile?.name || user.name || 'Sua Conta';
  const displayAvatar = current?.avatar_url || watchingProfile?.avatar_url || avatarUrl;
  // 1 entrada por série/filme (último episódio) — sem repetir a mesma série
  const recentHistory = dedupeByTitle(
    history.filter((item) => {
      const p = item.progress > 1 ? item.progress / 100 : item.progress;
      return p > 0 && p < 0.95;
    })
  ).slice(0, 10);

  const profilesCarousel = (
    <div className="flex gap-3.5 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-1">
      {otherProfiles.map((profile) => (
        <button
          key={profile.id}
          type="button"
          onClick={() => switchToProfile(profile)}
          className="flex flex-col items-center gap-1.5 w-[64px] md:w-[72px] shrink-0 active:scale-95 transition-transform"
        >
          <div className="w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-full overflow-hidden bg-[#222] ring-1 ring-white/15 hover:ring-white/55 transition-all flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-bold text-white/80">
                {profile.name?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <span className="text-white/75 text-[11px] md:text-xs font-medium text-center truncate w-full">
            {profile.name}
          </span>
        </button>
      ))}
      <Link
        href="/who-is-watching"
        className="flex flex-col items-center gap-1.5 w-[64px] md:w-[72px] shrink-0 active:scale-95 transition-transform"
      >
        <div className="w-[64px] h-[64px] md:w-[72px] md:h-[72px] rounded-full bg-[#171717] flex items-center justify-center hover:bg-[#222] transition-colors ring-1 ring-white/12">
          <Plus size={22} strokeWidth={1.5} className="text-white/85" />
        </div>
        <span className="text-white/75 text-[11px] md:text-xs font-medium text-center">Novo</span>
      </Link>
    </div>
  );

  const continueWatchingBlock = (
    <section className="rounded-2xl lg:rounded-3xl border border-white/10 bg-white/[0.03] p-5 lg:p-6 xl:p-7 mb-5 lg:mb-0">
      <div className="flex items-center justify-between mb-4 lg:mb-5">
        <h3 className="text-sm lg:text-base font-semibold text-white">Continuar assistindo</h3>
        <button
          type="button"
          onClick={() => setCurrentView('history')}
          className="text-xs lg:text-sm font-medium text-white/40 hover:text-white transition-colors inline-flex items-center gap-1"
        >
          Ver tudo <ChevronRight size={14} />
        </button>
      </div>

      {isLoadingData ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-[100px] lg:w-[120px] aspect-[2/3] rounded-xl bg-white/5 animate-pulse shrink-0"
            />
          ))}
        </div>
      ) : recentHistory.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-1">
          {recentHistory.map((item) => {
            const href =
              item.media_type === 'tv'
                ? `/watch/tv/${item.tmdb_id}?s=${item.season || 1}&e=${item.episode || 1}&play=1`
                : `/watch/movie/${item.tmdb_id}?play=1`;
            const poster = item.poster_path
              ? tmdb.getImageUrl(item.poster_path, 'w342')
              : null;
            return (
              <Link
                key={`${item.media_type}-${item.tmdb_id}-${item.id}`}
                href={href}
                className="group shrink-0 w-[100px] lg:w-[120px]"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#1a1a1a] ring-1 ring-white/10 group-hover:ring-white/30 transition-all">
                  {poster ? (
                    <img
                      src={poster}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/30">
                      <Film size={24} />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-[11px] font-medium text-white truncate">{item.title}</p>
                    <RemainingLabel
                      item={item}
                      className="text-[9px] text-white/55 mt-0.5 truncate leading-tight"
                    />
                    {typeof item.progress === 'number' && item.progress > 0 && (
                      <div className="mt-1.5 h-0.5 rounded-full bg-white/20 overflow-hidden">
                        <div
                          className="h-full bg-white rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(2, item.progress > 1 ? item.progress : item.progress * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 py-8 lg:py-10 text-center">
          <p className="text-sm text-white/40 mb-3">Nada assistido ainda neste perfil</p>
          <Link href="/" className="text-sm font-semibold text-white hover:underline">
            Explorar catálogo
          </Link>
        </div>
      )}
    </section>
  );

  const menuBlock = (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Crown size={22} className="text-white" fill="currentColor" />
          </div>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-[15px]">VIP Ativo</h3>
            <p className="text-[11px] text-white/45 font-medium mt-0.5">Acesso Full-HD liberado</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 space-y-0.5">
        <MenuItem icon={<User size={20} />} label="Editar Perfil" onClick={() => setCurrentView('edit')} />
        <MenuItem icon={<Clock size={20} />} label="Histórico" onClick={() => setCurrentView('history')} />
        <MenuItem icon={<Heart size={20} />} label="Favoritos" onClick={() => setCurrentView('favorites')} />
        <MenuItem
          icon={<Users size={20} />}
          label="Gerenciar perfis"
          onClick={() => router.push('/who-is-watching')}
        />

        {user.isAdmin && (
          <Link href="/admin">
            <MenuItem icon={<Shield size={20} />} label="Painel Admin" onClick={() => {}} />
          </Link>
        )}

        <div className="h-px bg-white/8 my-1.5 mx-3" />

        <div className="relative">
          <div className="absolute inset-0 z-10 w-full h-full opacity-0">
            <ClearCacheButton variant="menu-item" />
          </div>
          <MenuItem icon={<Trash2 size={20} />} label="Limpar Cache" onClick={() => {}} />
        </div>

        <div className="h-px bg-white/8 my-1.5 mx-3" />

        <MenuItem icon={<LogOut size={20} />} label="Sair da Conta" onClick={handleLogout} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans animate-in fade-in duration-500 md:pl-[var(--sidebar-width)] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 hidden lg:block bg-[radial-gradient(ellipse_60%_40%_at_40%_-5%,rgba(255,255,255,0.05),transparent_50%)]" />
      <ProfileHeader />

      {/* Mobile */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto px-5 pt-[calc(3.5rem+1.25rem)] pb-28 lg:hidden">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 mb-5">
          <div className="flex flex-col items-center">
            <div className="w-[120px] h-[120px] rounded-full overflow-hidden bg-[#222] ring-2 ring-white/80 mb-4 flex items-center justify-center text-4xl font-bold">
              {displayAvatar ? (
                <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName[0]?.toUpperCase()
              )}
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight text-center">{displayName}</h2>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-sm font-semibold text-white/55">Perfis</h3>
              <Link href="/who-is-watching" className="text-xs font-medium text-white/45 hover:text-white">
                Gerenciar
              </Link>
            </div>
            {profilesCarousel}
          </div>
        </div>
        {continueWatchingBlock}
        {menuBlock}
      </div>

      {/* PC — centralizado e equilibrado */}
      <div className="relative z-10 hidden lg:block w-full px-6 xl:px-10 pt-[calc(4.5rem+1.75rem)] pb-16">
        <div className="w-full max-w-[1100px] mx-auto grid grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] gap-8 xl:gap-10 items-start">
          {/* Menu */}
          <aside className="sticky top-24 self-start">{menuBlock}</aside>

          {/* Conteúdo principal */}
          <div className="min-w-0 space-y-6">
            {/* Cabeçalho do perfil */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-[128px] h-[128px] rounded-full overflow-hidden bg-[#222] ring-2 ring-white/70 shadow-2xl flex items-center justify-center text-4xl font-bold shrink-0 mx-auto sm:mx-0">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    displayName[0]?.toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h2 className="text-3xl xl:text-4xl font-bold text-white tracking-tight truncate">
                    {displayName}
                  </h2>
                </div>
              </div>

              <div className="mt-7">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white/55">Trocar perfil</h3>
                  <Link href="/who-is-watching" className="text-xs font-medium text-white/45 hover:text-white transition-colors">
                    Gerenciar
                  </Link>
                </div>
                {profilesCarousel}
              </div>
            </section>

            {continueWatchingBlock}

            {/* Conta */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <h3 className="text-base font-semibold text-white mb-5">Dados da conta</h3>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                <AccountField label="Nome" value={user.name || '—'} />
                <AccountField label="E-mail" value={user.email} />
                <AccountField label="Plano" value={user.plan || user.subscription_status || 'VIP'} />
                <AccountField label="Acesso" value={user.isAdmin ? 'Administrador' : 'Assinante'} />
                <AccountField label="Perfil atual" value={displayName} />
                <AccountField label="Perfis" value={`${profiles.length} nesta conta`} />
              </dl>
            </section>

            {/* Atalhos */}
            <section className="grid grid-cols-3 gap-4">
              <QuickLink href="/movies" icon={<Film size={20} />} label="Filmes" desc="Catálogo" />
              <QuickLink href="/series" icon={<Tv size={20} />} label="Séries" desc="Episódios" />
              <QuickLink href="/tv" icon={<Play size={20} />} label="TV ao vivo" desc="Canais" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-white/35 mb-1">{label}</dt>
      <dd className="text-sm text-white/90 truncate">{value}</dd>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-5 transition-colors group flex flex-col items-start gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-white/5 text-white/50 group-hover:text-white flex items-center justify-center transition-colors">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[15px] font-semibold text-white">{label}</div>
        <div className="text-xs text-white/40 mt-0.5">{desc}</div>
      </div>
    </Link>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/[0.06] rounded-xl cursor-pointer transition-all group active:scale-[0.99]"
    >
      <div className="flex items-center gap-3.5">
        <div className="text-white/45 group-hover:text-white transition-colors">{icon}</div>
        <span className="text-[15px] font-medium text-white/90 group-hover:text-white transition-colors">
          {label}
        </span>
      </div>
      <ChevronRight size={16} className="text-white/25 group-hover:text-white/60 transition-all" />
    </div>
  );
}
