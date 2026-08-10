import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** light = white on dark bg; dark = black on light bg */
  tone?: 'light' | 'dark';
  showShadow?: boolean;
}

const sizeConfig = {
  xs: 'text-[0.9rem]',
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-6xl md:text-7xl',
};

export function Logo({
  className = '',
  size = 'md',
  tone = 'light',
  showShadow = true,
}: LogoProps) {
  const isDark = tone === 'dark';

  return (
    <div className={cn('flex items-center', className)}>
      <div
        className={cn(
          sizeConfig[size],
          'font-black tracking-tight leading-none',
          isDark ? 'text-black' : 'text-white',
          showShadow && !isDark && 'drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)]'
        )}
      >
        Star
        <span className={cn('font-light', isDark ? 'text-black/75' : 'text-white/90')}>
          moon
        </span>
      </div>
    </div>
  );
}

export function LogoLink({
  className = '',
  size = 'md',
  tone = 'light',
  showShadow = true,
  href = '/',
}: LogoProps & { href?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex transition-transform hover:scale-105 active:scale-95"
    >
      <Logo className={className} size={size} tone={tone} showShadow={showShadow} />
    </Link>
  );
}
