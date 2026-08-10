'use client';

import { Suspense } from 'react';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { MobileTopBar } from '@/components/layout/MobileTopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { BrandTabs } from '@/components/layout/BrandTabs';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTVPage = pathname === '/tv';
  const isWatchPage = pathname.startsWith('/watch');
  const isProfilesPage =
    pathname.startsWith('/who-is-watching') || pathname === '/profile';
  const isPlansPage = pathname.startsWith('/plans');
  const hasHeroOverlay = pathname === '/' || pathname === '/movies' || pathname === '/series';
  const isSearchPage = pathname.startsWith('/search');
  const hideChrome = isWatchPage || isPlansPage;
  const showMobileNav = !isWatchPage && !isPlansPage;

  return (
    <div className="min-h-screen flex streaming-shell">
      {!hideChrome && <Sidebar />}

      <div className={cn('flex-1 flex flex-col min-w-0 w-full')}>
        {!hideChrome && !isProfilesPage && (
          <div className={cn('relative flex-1 flex flex-col', hasHeroOverlay && 'min-h-0')}>
            <Suspense fallback={null}>
              <MobileTopBar overlay={hasHeroOverlay} />
            </Suspense>
            <BrandTabs overlay={hasHeroOverlay} />
            <main
              className={cn(
                'flex-1',
                !isTVPage && 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0',
                !hasHeroOverlay && !isSearchPage && 'md:pt-16'
              )}
            >
              {children}
            </main>
          </div>
        )}

        {(hideChrome || isProfilesPage) && (
          <main
            className={cn(
              'flex-1',
              isProfilesPage && 'pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0'
            )}
          >
            {children}
          </main>
        )}

        {!hideChrome && !isProfilesPage && !isTVPage && <Footer />}
      </div>

      {showMobileNav && <MobileNav />}
    </div>
  );
}
