'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Pencil,
  UserRound,
  CircleHelp,
  LogOut,
  ArrowUpRight,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

type ProfileItem = {
  id: string | number;
  name: string;
  avatar_url?: string | null;
  is_kids?: boolean;
};

interface ProfileMenuProps {
  className?: string;
  avatarClassName?: string;
  /** Posição do menu dropdown */
  menuAlign?: 'sidebar' | 'mobile';
}

export function ProfileMenu({
  className,
  avatarClassName,
  menuAlign = 'sidebar',
}: ProfileMenuProps) {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileItem[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ProfileItem | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('fzone_selected_profile');
      if (raw) setSelectedProfile(JSON.parse(raw));
    } catch {
      setSelectedProfile(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/profiles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setProfiles(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setProfiles([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, token]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const avatarUrl = selectedProfile?.avatar_url || user?.avatar_url;
  const initial = (selectedProfile?.name || user?.name || user?.email || '?')[0]?.toUpperCase();

  const switchProfile = async (profile: ProfileItem) => {
    const { setSelectedProfile: persistProfile } = await import('@/lib/selectedProfile');
    const { switchProfileHistory, syncToServer } = await import('@/services/watchProgress');

    void syncToServer(true);
    persistProfile(profile);
    switchProfileHistory(String(profile.id));
    setSelectedProfile(profile);
    setOpen(false);
    router.replace('/');
  };

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } finally {
      router.push('/login');
    }
  };

  if (!user) {
    return (
      <Link
        href="/login"
        className={cn('sidebar-profile shrink-0', avatarClassName)}
        title="Entrar"
      >
        <span className="text-[12px] font-bold text-white/90">?</span>
      </Link>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn('sidebar-profile group', avatarClassName)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Conta"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[12px] font-bold text-white/90">{initial}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'profile-menu fixed z-[120] w-[252px]',
            menuAlign === 'mobile'
              ? 'right-3 top-[calc(env(safe-area-inset-top)+3.25rem)]'
              : 'left-[68px] top-3'
          )}
        >
          <div className="px-3 pt-3 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35 px-1 mb-2">
              Perfis
            </p>
            <div className="space-y-0.5">
              {profiles.length === 0 && (
                <p className="px-2 py-2 text-xs text-white/40">Nenhum perfil ainda</p>
              )}
              {profiles.map((profile) => {
                const active = String(selectedProfile?.id) === String(profile.id);
                return (
                  <button
                    key={profile.id}
                    type="button"
                    role="menuitem"
                    onClick={() => switchProfile(profile)}
                    className={cn(
                      'w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-colors',
                      active ? 'bg-white/12' : 'hover:bg-white/[0.07]'
                    )}
                  >
                    <span className="w-9 h-9 rounded-full overflow-hidden bg-[#2a2a2e] shrink-0 ring-1 ring-white/15">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-[11px] font-bold text-white/80">
                          {profile.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className={cn('text-sm truncate flex-1', active ? 'text-white font-semibold' : 'text-white/85')}>
                      {profile.name}
                    </span>
                    {active && <Check size={15} className="text-white shrink-0" strokeWidth={2.5} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-white/10 mx-3" />

          <div className="px-2 py-2 space-y-0.5">
            <Link
              href="/who-is-watching"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="profile-menu-item"
            >
              <Pencil size={17} strokeWidth={1.7} />
              Gerenciar perfis
            </Link>
            <Link
              href="/who-is-watching"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="profile-menu-item"
            >
              <ArrowUpRight size={17} strokeWidth={1.7} />
              Transferir perfil
            </Link>
            <Link
              href="/profile"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="profile-menu-item"
            >
              <UserRound size={17} strokeWidth={1.7} />
              Conta
            </Link>
            <Link
              href="/termos"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="profile-menu-item"
            >
              <CircleHelp size={17} strokeWidth={1.7} />
              Central de ajuda
            </Link>
          </div>

          <div className="h-px bg-white/10 mx-3" />

          <div className="px-2 py-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="profile-menu-item w-full text-left font-semibold"
            >
              <LogOut size={17} strokeWidth={1.7} />
              Sair do Starmoon
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
