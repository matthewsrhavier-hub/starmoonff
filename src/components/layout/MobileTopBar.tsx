'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProfileMenu } from '@/components/layout/ProfileMenu';

interface MobileTopBarProps {
  overlay?: boolean;
}

export function MobileTopBar({ overlay = false }: MobileTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    if (pathname.startsWith('/search')) {
      setQuery(searchParams.get('q') || '');
    }
  }, [pathname, searchParams]);

  if (
    pathname.startsWith('/watch') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/plans')
  ) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      inputRef.current?.focus();
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header
      className={cn(
        'sm-mobile-topbar z-50 md:hidden pointer-events-none',
        overlay
          ? 'absolute top-0 left-0 right-0 pt-[var(--app-top-inset)]'
          : 'sticky top-0 pt-[var(--app-top-inset)] bg-gradient-to-b from-black via-black/90 to-transparent'
      )}
    >
      <div className="pointer-events-auto flex items-center gap-2.5 px-3 pb-2.5">
        <form onSubmit={handleSubmit} className="sm-mobile-search flex-1 min-w-0" role="search">
          <Search size={17} strokeWidth={2} className="sm-mobile-search__icon" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar filmes, séries..."
            className="sm-mobile-search__input"
            autoComplete="off"
            enterKeyHint="search"
            aria-label="Buscar"
          />
        </form>

        <ProfileMenu
          menuAlign="mobile"
          avatarClassName="!w-10 !h-10"
          className="shrink-0"
        />
      </div>
    </header>
  );
}
