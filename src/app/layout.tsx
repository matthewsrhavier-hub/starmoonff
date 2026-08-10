import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Splash } from '@/components/layout/Splash';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Starmoon - Filmes, Séries e Animes',
  description: 'Assista aos melhores filmes, séries e animes em HD. Streaming premium com legendas em português.',
  keywords: ['streaming', 'filmes', 'séries', 'animes', 'assistir online', 'hd', 'legendado', 'Starmoon'],
  authors: [{ name: 'Starmoon' }],
  manifest: '/manifest.json',
  applicationName: 'Starmoon',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Starmoon',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/logo.svg', type: 'image/svg+xml' },
      { url: '/icon', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-icon', type: 'image/png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="dark" style={{ colorScheme: 'dark' }} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // ELITE SITE PROTECTION - FILMZONE
              (function() {
                const MY_DOMAIN = window.location.hostname;

                // 1) Patch de Hierarquia (Engana Detectores)
                try {
                   Object.defineProperty(window, 'top', { get: () => window });
                   // Aplica o patch sugerido: window.parent = window
                   if (window.parent !== window) {
                      try { delete window.parent; window.parent = window; } catch(e) { 
                         Object.defineProperty(window, 'parent', { get: () => window });
                      }
                   }
                   window.open = function() { return { focus: function(){}, close: function(){} }; };
                } catch(e) {}

                // 2) Bloqueio de cliques externos Sniper
                document.addEventListener('click', (e) => {
                  const target = e.target.closest('a');
                  if (target && target.hostname !== MY_DOMAIN) e.preventDefault();
                }, true);

                // 3) Desativador de Redirecionamento Brusco
                window.onbeforeunload = function() { return null; };
              })();
            `,
          }}
        />
      </head>
      <body className={dmSans.className} suppressHydrationWarning>
        <Providers>
          <Splash />
          {children}
        </Providers>
      </body>
    </html>
  );
}
