'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatalogSectionProps {
  title: string;
  children: React.ReactNode;
  href?: string;
  action?: React.ReactNode;
}

export function CatalogSection({ title, children, href, action }: CatalogSectionProps) {
  return (
    <section className="mb-5 sm:mb-6 md:mb-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-2.5 sm:mb-3">
        {href ? (
          <Link href={href} className="group flex items-center gap-2 min-h-9">
            <h2 className="text-sm sm:text-[15px] md:text-base font-medium text-white/95 tracking-normal group-hover:text-white transition-colors">
              {title}
            </h2>
            <ChevronRight size={16} className="text-white/30 opacity-100 sm:opacity-0 -translate-x-0 sm:-translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </Link>
        ) : (
          <h2 className="text-sm sm:text-[15px] md:text-base font-medium text-white/95 tracking-normal">{title}</h2>
        )}
        {action}
      </div>
      {children}
    </section>
  );
}

export function CatalogPageBody({ children, overlap = true }: { children: React.ReactNode; overlap?: boolean }) {
  return (
    <div className={cn('relative z-10 pb-8 md:pb-16 catalog-body', !overlap && 'catalog-body--flat')}>
      {children}
    </div>
  );
}
