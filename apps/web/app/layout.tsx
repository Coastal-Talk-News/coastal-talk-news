import type { Metadata } from 'next';
import {
  Cinzel,
  DM_Serif_Display,
  Noto_Sans,
  Noto_Sans_Kannada,
  Noto_Serif,
  Noto_Serif_Kannada,
} from 'next/font/google';
import type { ReactNode } from 'react';
import { BreakingTicker } from '../components/layout/BreakingTicker';
import { AdBand } from '../components/news/AdBand';
import { AdColumn } from '../components/news/AdColumn';
import { StickyRail } from '../components/news/StickyRail';
import { SiteFooter } from '../components/layout/SiteFooter';
import { SiteHeader } from '../components/layout/SiteHeader';
import { adsForZone } from '../lib/ads';
import { getSite } from '../lib/api';
import { getLocale } from '../lib/i18n/server';
import { buildMetadata } from '../lib/seo';
import { getOrigin } from '../lib/site-url';
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
/* 400 is what article bodies are set in. Without it the browser has only the
 * heavier faces to pick from and renders ordinary paragraphs at 600, which
 * reads as bold and leaves genuinely bold words indistinguishable from the
 * text around them. */
const headline = Noto_Serif({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-headline',
  display: 'swap',
});

const headlineKannada = Noto_Serif_Kannada({
  subsets: ['kannada'],
  weight: ['400', '600', '700'],
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

// Lockup only: the site name and tagline beside the logo. Neither face has
// Kannada glyphs, so the Kannada faces above sit behind them in the stacks.
const brandName = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif-display',
  display: 'swap',
});

const brandTagline = Cinzel({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-cinzel',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [{ settings }, locale, origin] = await Promise.all([
      getSite(),
      getLocale(),
      getOrigin(),
    ]);
    return buildMetadata({ settings, locale, origin });
  } catch {
    // Metadata must never be the reason a page fails to render.
    return { title: 'News' };
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
      translate="no"
      className={`${headline.variable} ${headlineKannada.variable} ${body.variable} ${bodyKannada.variable} ${brandName.variable} ${brandTagline.variable}`}
    >
      {/* Pages mix English UI with Kannada content, which makes the browser
          offer to translate on every visit. The newsroom already publishes in
          both languages, so the prompt is noise. */}
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="grain flex min-h-screen flex-col">
        <SiteHeader site={site} locale={locale} />
        <BreakingTicker items={site.breakingNews} locale={locale} />
        <AdBand
          advertisements={adsForZone(advertisements, 'top')}
          className="mt-5"
          locale={locale}
        />
        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-7xl gap-6 px-4">
            <div className="min-w-0 flex-1">{children}</div>
            <StickyRail className="hidden w-[clamp(240px,calc(100vw-760px),360px)] shrink-0 py-5 min-[800px]:block">
              <AdColumn
                advertisements={adsForZone(advertisements, 'sidebar')}
                locale={locale}
              />
            </StickyRail>
          </div>
        </main>

        {/* Narrow screens have no side column, so the roster runs here instead —
            after the news, never before it. */}
        <AdColumn
          advertisements={adsForZone(advertisements, 'sidebar')}
          variant="block"
          className="mx-auto w-full max-w-6xl px-4 pb-8 min-[800px]:hidden"
          locale={locale}
        />
        <SiteFooter site={site} locale={locale} />
      </body>
    </html>
  );
}
