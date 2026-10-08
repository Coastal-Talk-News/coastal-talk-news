import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import {
  Merriweather,
  Noto_Sans,
  Noto_Sans_Kannada,
  Noto_Serif,
  Noto_Serif_Kannada,
} from 'next/font/google';
import type { ReactNode } from 'react';
import GoogleAdSenseScript from '../components/adsense/GoogleAdSenseScript';
import { BreakingTicker } from '../components/layout/BreakingTicker';
import { AdBand } from '../components/news/AdBand';
import { AdColumn } from '../components/news/AdColumn';
import { StickyRail } from '../components/news/StickyRail';
import { SiteFooter } from '../components/layout/SiteFooter';
import { DevToolsShortcutGuard } from '../components/layout/DevToolsShortcutGuard';
import { SiteHeader } from '../components/layout/SiteHeader';
import { adsForZone } from '../lib/ads';
import { getSite } from '../lib/api';
import { getLocale } from '../lib/i18n/server';
import { buildSiteMetadata } from '../lib/seo';
import { getOrigin } from '../lib/site-url';
import './globals.css';

// Every font below is a variable font - `weight: 'variable'` loads the whole
// range as one resource rather than one file per discrete weight, which the
// CSS below still addresses normally (font-weight: 400/600/700, etc). A
// discrete weight array (e.g. ['400','600','700']) triggers a Turbopack bug
// on variable Google fonts: it generates one @font-face per weight and its
// internal font-file resolver can't disambiguate them ("next/font/google
// queries have exactly one entry"), failing the whole build.
const headline = Noto_Serif({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-headline',
  display: 'swap',
});

const article = Merriweather({
  subsets: ['latin'],
  weight: 'variable',
  // Emphasis and quotations are common in articles; without the real italic
  // the browser slants the upright letters instead.
  style: ['normal', 'italic'],
  variable: '--font-merriweather',
  display: 'swap',
});

const headlineKannada = Noto_Serif_Kannada({
  subsets: ['kannada'],
  weight: 'variable',
  variable: '--font-headline-kannada',
  display: 'swap',
});

const body = Noto_Sans({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-body',
  display: 'swap',
});

const bodyKannada = Noto_Sans_Kannada({
  subsets: ['kannada'],
  weight: 'variable',
  variable: '--font-body-kannada',
  display: 'swap',
});

export const viewport: Viewport = {
  width: '1280px',
  initialScale: undefined,
  viewportFit: 'cover',
};

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [{ settings }, locale, origin] = await Promise.all([
      getSite(),
      getLocale(),
      getOrigin(),
    ]);

    const metadata = buildSiteMetadata({ settings, locale, origin });

    return {
      ...metadata,
      verification: {
        google: 'KxW4_-C6J-IHz8iMdcYiyAPis0bXAhs_SS70A1t81gM',
      },
    };
  } catch {
    return {
      title: 'News',
      verification: {
        google: 'KxW4_-C6J-IHz8iMdcYiyAPis0bXAhs_SS70A1t81gM',
      },
    };
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
      className={`${headline.variable} ${article.variable} ${headlineKannada.variable} ${body.variable} ${bodyKannada.variable}`}
    >
      {/* Pages mix English UI with Kannada content, which makes the browser
          offer to translate on every visit. The newsroom already publishes in
          both languages, so the prompt is noise. */}
      <head>
        <meta name="google" content="notranslate" />
        <GoogleAdSenseScript />
      </head>
      <body className="flex min-h-screen flex-col">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-WXHGNXEB2V"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WXHGNXEB2V');
          `}
        </Script>
        <DevToolsShortcutGuard />
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
            <StickyRail className="hidden w-[clamp(260px,calc(100vw-760px),460px)] shrink-0 py-5 min-[800px]:block">
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
