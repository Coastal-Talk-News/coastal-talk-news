import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleBody } from '../../components/news/ArticleBody';
import { getPage, getSite } from '../../lib/api';
import { getDictionary } from '../../lib/i18n/dictionaries';
import { getLocale } from '../../lib/i18n/server';
import { buildMetadata } from '../../lib/seo';
import { getOrigin } from '../../lib/site-url';

export async function generateMetadata(): Promise<Metadata> {
  const [{ settings }, locale, origin] = await Promise.all([
    getSite(),
    getLocale(),
    getOrigin(),
  ]);
  return buildMetadata({
    settings,
    locale,
    origin,
    title: getDictionary(locale).advertise.title,
    path: '/advertise',
  });
}

export default async function AdvertisePage() {
  const [{ settings }, page, locale] = await Promise.all([
    getSite(),
    getPage('advertise'),
    getLocale(),
  ]);
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <header className="border-rule border-b pb-8 text-center">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {page.title ?? dictionary.advertise.title}
        </h1>
        <p className="text-ink-muted mx-auto mt-3 max-w-xl leading-relaxed">
          {page.intro ?? dictionary.advertise.intro}
        </p>
        {(page.email || page.phone) && (
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold">
            {page.email && (
              <a
                href={`mailto:${page.email}`}
                className="text-brand hover:underline"
              >
                {page.email}
              </a>
            )}
            {page.phone && (
              <a
                href={`tel:${page.phone}`}
                className="text-brand hover:underline"
              >
                {page.phone}
              </a>
            )}
          </p>
        )}
      </header>

      {page.content && <ArticleBody content={page.content} />}

      <p className="mt-8 text-center">
        <Link
          href="/advertisements"
          className="border-rule hover:border-brand hover:text-brand inline-flex h-11 items-center rounded-sm border px-6 text-sm font-semibold transition-colors"
        >
          {dictionary.advertisement.browseAll}
        </Link>
      </p>
    </div>
  );
}
