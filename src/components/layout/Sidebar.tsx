'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { ProfileMenu } from '@/components/layout/ProfileMenu';
import {
  Home,
  Film,
  Tv,
  Settings,
  Radio,
  Bookmark,
} from 'lucide-react';

const ITEM_SIZE = 44;
const ITEM_GAP = 4;
const INDICATOR_HEIGHT = 18;
const STEP = ITEM_SIZE + ITEM_GAP;

const navItems = [
  { href: '/', label: 'Início', icon: Home, match: (p: string) => p === '/' },
  { href: '/movies', label: 'Filmes', icon: Film, match: (p: string) => p.startsWith('/movies') },
  { href: '/series', label: 'Séries', icon: Tv, match: (p: string) => p.startsWith('/series') },
  { href: '/tv', label: 'TV', icon: Radio, match: (p: string) => p === '/tv' },
  {
    href: '/who-is-watching',
    label: 'Perfil',
    icon: Bookmark,
    match: (p: string) => p.startsWith('/profile') || p.startsWith('/who-is-watching'),
  },
];

function indexFromPath(pathname: string) {
  const idx = navItems.findIndex((item) => item.match(pathname));
  return idx >= 0 ? idx : 0;
}

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [activeIndex, setActiveIndex] = useState(() => indexFromPath(pathname));
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    setActiveIndex(indexFromPath(pathname));
  }, [pathname]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setCanAnimate(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const indicatorTop =
    activeIndex * STEP + (ITEM_SIZE - INDICATOR_HEIGHT) / 2;

  return (
    <aside className="sidebar-rail hidden md:flex fixed left-0 top-0 bottom-0 z-[60] w-[var(--sidebar-width)] flex-col items-center py-5 pointer-events-none">
      <div className="pointer-events-auto flex flex-col items-center h-full w-full">
        <ProfileMenu />

        <nav className="flex-1 flex flex-col items-center justify-center w-full">
          <div
            className="relative flex flex-col items-center"
            style={{ gap: ITEM_GAP }}
          >
            <span
              aria-hidden
              className={cn(
                'sidebar-nav-indicator',
                canAnimate && 'sidebar-nav-indicator--animate'
              )}
              style={{ transform: `translate3d(0, ${indicatorTop}px, 0)` }}
            />

            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = index === activeIndex;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    'sidebar-nav-item group',
                    active && 'sidebar-nav-item--active'
                  )}
                  style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
                  title={item.label}
                >
                  <Icon size={22} strokeWidth={active ? 2 : 1.5} />
                  <span className="sidebar-tooltip">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <Link
          href={user?.isAdmin ? '/admin' : '/profile'}
          className="sidebar-nav-item group shrink-0"
          title="Configurações"
        >
          <Settings size={20} strokeWidth={1.5} />
          <span className="sidebar-tooltip">Configurações</span>
        </Link>
      </div>
    </aside>
  );
}
