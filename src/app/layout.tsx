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

                // Não patchar window.top/parent: isso quebra embeds de vídeo no celular

                // Bloqueio de cliques externos
                document.addEventListener('click', (e) => {
                  const target = e.target.closest('a');
                  if (target && target.hostname && target.hostname !== MY_DOMAIN && !target.target) {
                    // permite iframes/embeds; só bloqueia navegação de links externos
                    e.preventDefault();
                  }
                }, true);
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
