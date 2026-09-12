import type { Metadata } from 'next';
import {
  Noto_Sans,
  Noto_Sans_Kannada,
  Noto_Serif,
  Noto_Serif_Kannada,
} from 'next/font/google';
import type { ReactNode } from 'react';
import { BreakingTicker } from '../components/layout/BreakingTicker';
import { AdBand } from '../components/news/AdBand';
import { AdColumn } from '../components/news/AdColumn';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { adsForZone } from '../lib/ads';
import { getSite } from '../lib/api';
import { getLocale } from '../lib/i18n/server';
import './globals.css';

// Every route reads live site/news data through this layout, so there is
// nothing meaningful to prerender at build time — and `next build` has no
// running API to fetch from anyway (CI builds against a placeholder DB with
// no API process). Forcing dynamic rendering here makes the whole app render
// per-request instead, which also means readers never see stale HTML.
export const dynamic = 'force-dynamic';

/**
 * Each script gets its own face from the same superfamily. A Latin-only face
 * has no Kannada glyphs, so without these the ನಾಟಕ headlines fall through to
 * whatever the reader's OS supplies and a bilingual headline renders as two
 * unrelated typefaces — different on Windows, iOS and Android.
 */
const headline = Noto_Serif({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-headline',
  display: 'swap',
});

const headlineKannada = Noto_Serif_Kannada({
  subsets: ['kannada'],
  weight: ['600', '700'],
  variable: '--font-headline-kannada',
  display: 'swap',
});

const body = Noto_Sans({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-body',
  display: 'swap',
});

const bodyKannada = Noto_Sans_Kannada({
  subsets: ['kannada'],
  weight: ['400', '600'],
  variable: '--font-body-kannada',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { settings } = await getSite();
    return {
      title: {
        default: settings.tagline
          ? `${settings.siteName} — ${settings.tagline}`
          : settings.siteName,
        template: `%s — ${settings.siteName}`,
      },
      description: settings.description ?? undefined,
    };
  } catch {
    return { title: 'Newswire' };
  }
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [site, locale] = await Promise.all([getSite(), getLocale()]);
  const { advertisements } = site;

  return (
    <html
      lang={locale}
      className={`${headline.variable} ${headlineKannada.variable} ${body.variable} ${bodyKannada.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <SiteHeader site={site} locale={locale} />
        <BreakingTicker items={site.breakingNews} locale={locale} />
        <AdBand
          advertisements={adsForZone(advertisements, 'top')}
          className="mt-6"
          locale={locale}
        />
        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-7xl gap-8 px-4">
            <div className="min-w-0 flex-1">{children}</div>
            <AdColumn
              advertisements={adsForZone(advertisements, 'sidebar')}
              className="hidden w-72 shrink-0 py-6 xl:block"
              locale={locale}
            />
          </div>
        </main>

        {/* Narrow screens have no side column, so the roster runs here instead —
            after the news, never before it. */}
        <AdColumn
          advertisements={adsForZone(advertisements, 'sidebar')}
          className="mx-auto w-full max-w-6xl px-4 pb-12 xl:hidden"
          locale={locale}
        />
        <SiteFooter site={site} locale={locale} />
      </body>
    </html>
  );
}
