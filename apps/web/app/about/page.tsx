import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SocialLinks } from '../../components/layout/SocialLinks';
import { ArticleBody } from '../../components/news/ArticleBody';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPage, getSite } from '../../lib/api';
import { getDictionary } from '../../lib/i18n/dictionaries';
import { getLocale } from '../../lib/i18n/server';
import { buildMetadata } from '../../lib/seo';
import { getOrigin } from '../../lib/site-url';

export async function generateMetadata(): Promise<Metadata> {
  const [{ settings }, page, locale, origin] = await Promise.all([
    getSite(),
    getPage('about'),
    getLocale(),
    getOrigin(),
  ]);
  return buildMetadata({
    settings,
    locale,
    origin,
    title: page.title ?? getDictionary(locale).about.title,
    description: page.intro,
    path: '/about',
  });
}

export default async function AboutPage() {
  const [{ settings }, page, locale] = await Promise.all([
    getSite(),
    getPage('about'),
    getLocale(),
  ]);
  const dictionary = getDictionary(locale);

  const hasSocials = Boolean(
    settings.facebookUrl ||
    settings.instagramUrl ||
    settings.youtubeUrl ||
    settings.xUrl,
  );
  const heading = page.title ?? dictionary.about.heading(settings.siteName);
  const standfirst = page.intro ?? settings.tagline;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Set like the front of a section rather than a profile card: a rule,
          a kicker, then the name of the thing — the same masthead grammar the
          category pages use, so About doesn't read as a different website. */}
      <header className="border-ink border-b-2 pb-6">
        <p className="text-brand text-xs font-semibold tracking-[0.18em] uppercase">
          {dictionary.about.eyebrow}
        </p>
        <div className="mt-3 flex items-start gap-5">
          {settings.logo && (
            <Image
              src={settings.logo.url}
              alt=""
              width={72}
              height={72}
              className="ring-rule hidden size-16 shrink-0 rounded-full object-cover ring-1 sm:block"
            />
          )}
          <div className="min-w-0">
            <h1 className="font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl">
              {heading}
            </h1>
            {standfirst && (
              <p className="text-ink-muted mt-3 text-lg leading-relaxed text-pretty">
                {standfirst}
              </p>
            )}
          </div>
        </div>
      </header>

      {page.content ? (
        <ArticleBody content={page.content} />
      ) : (
        <div className="mt-8">
          <EmptyState
            title={dictionary.about.noDescriptionTitle}
            description={dictionary.about.noDescriptionDescription}
          />
        </div>
      )}

      <section className="border-rule mt-12 border-t pt-8">
        <h2 className="font-serif text-2xl font-bold">
          {dictionary.about.getInTouch}
        </h2>
        <p className="text-ink-muted mt-2 max-w-xl leading-relaxed">
          {dictionary.about.getInTouchDescription}
        </p>

        {/* Details as labelled rows, so an address or a phone number is read
            as a fact rather than as another line of prose. */}
        {(page.email || page.phone) && (
          <dl className="border-rule divide-rule mt-6 divide-y rounded-card border">
            {page.email && (
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
                <dt className="text-ink-subtle w-28 shrink-0 text-xs font-semibold tracking-widest uppercase">
                  {dictionary.about.writeToUs}
                </dt>
                <dd className="min-w-0 flex-1">
                  <a
                    href={`mailto:${page.email}`}
                    className="hover:text-brand font-medium wrap-break-word transition-colors"
                  >
                    {page.email}
                  </a>
                </dd>
              </div>
            )}
            {page.phone && (
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-3">
                <dt className="text-ink-subtle w-28 shrink-0 text-xs font-semibold tracking-widest uppercase">
                  {dictionary.about.callUs}
                </dt>
                <dd className="min-w-0 flex-1">
                  <a
                    href={`tel:${page.phone}`}
                    className="hover:text-brand font-medium transition-colors"
                  >
                    {page.phone}
                  </a>
                </dd>
              </div>
            )}
          </dl>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/contact"
            className="bg-brand hover:bg-brand-hover inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {dictionary.common.contact}
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/"
            className="border-rule hover:border-brand hover:text-brand inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            {dictionary.about.readNews}
          </Link>
          {hasSocials && (
            <SocialLinks
              settings={settings}
              locale={locale}
              className="sm:ms-auto"
            />
          )}
        </div>
      </section>
    </div>
  );
}
