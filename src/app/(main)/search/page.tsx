'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Search } from 'lucide-react';
import { SearchResults } from '@/components/content/SearchResults';
import { CatalogPageBody } from '@/components/content/CatalogSection';
import { SkeletonRow } from '@/components/ui/Skeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  if (!query) {
    return (
      <CatalogPageBody overlap={false}>
        <div className="flex flex-col items-center justify-center pt-6 pb-16 md:pt-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Search size={28} className="text-[var(--text-tertiary)]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Buscar</h1>
          <p className="text-[var(--text-secondary)] max-w-md">
            Digite na barra de pesquisa para encontrar filmes e séries do catálogo.
          </p>
        </div>
      </CatalogPageBody>
    );
  }

  return (
    <CatalogPageBody overlap={false}>
      <div className="pt-2 md:pt-3">
        <SearchResults query={query} />
      </div>
    </CatalogPageBody>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SkeletonRow />}>
      <SearchContent />
    </Suspense>
  );
}
