'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LogoLink } from '@/components/layout/Logo';

export function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer on profile page
  if (pathname === '/profile' || pathname === '/') return null;

  const links = {
    navigation: [
      { href: '/', label: 'Início' },
      { href: '/movies', label: 'Filmes' },
      { href: '/series', label: 'Séries' },
      { href: '/tv', label: 'TV ao Vivo' },
    ],
    legal: [
      { href: '/termos', label: 'Termos de Uso' },
      { href: '/privacidade', label: 'Política de Privacidade' },
      { href: '/dmca', label: 'DMCA' },
    ],
  };

  return (
    <footer className="hidden md:block bg-[var(--bg-secondary)] border-t border-[var(--border-color)] mt-auto">
      <div className="max-w-[1800px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <LogoLink size="md" />
            </div>
            <p className="text-[var(--text-secondary)] text-sm max-w-md">
              Sua plataforma de streaming premium. Assista filmes, séries e animes
              com a melhor qualidade. Starmoon.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Navegação</h4>
            <ul className="space-y-2">
              {links.navigation.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {links.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-secondary)]">
            © {currentYear} Starmoon. Todos os direitos reservados.
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            Este site não armazena nenhum conteúdo. Todos os vídeos são hospedados por terceiros.
          </p>
        </div>
      </div>
    </footer>
  );
}
