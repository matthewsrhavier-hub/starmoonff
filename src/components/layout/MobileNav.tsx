'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Film, Tv, Radio, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      href: '/',
      label: 'Início',
      active: pathname === '/',
      icon: Home,
    },
    {
      href: '/movies',
      label: 'Filmes',
      active: pathname === '/movies' || pathname.startsWith('/movies/'),
      icon: Film,
    },
    {
      href: '/series',
      label: 'Séries',
      active: pathname === '/series' || pathname.startsWith('/series/'),
      icon: Tv,
    },
    {
      href: '/tv',
      label: 'TV',
      active: pathname === '/tv',
      icon: Radio,
    },
    {
      href: user ? '/who-is-watching' : '/plans',
      label: 'Perfil',
      active:
        pathname === '/profile' ||
        pathname === '/plans' ||
        pathname.startsWith('/who-is-watching'),
      icon: User,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none"
      style={{ paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom))' }}
      aria-label="Navegação principal"
    >
      {/* Fade suave acima da barra */}
      <div
        className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none"
        aria-hidden
      />

      <div className="relative mx-3 pointer-events-auto">
        <div className="sm-mobile-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('sm-mobile-nav-item', item.active && 'sm-mobile-nav-item--active')}
                aria-current={item.active ? 'page' : undefined}
              >
                <span className="sm-mobile-nav-icon" aria-hidden>
                  <Icon size={20} strokeWidth={item.active ? 2.2 : 1.6} />
                </span>
                <span className="sm-mobile-nav-label">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
