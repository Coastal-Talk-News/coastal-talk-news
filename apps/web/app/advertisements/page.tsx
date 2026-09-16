import type { Metadata } from 'next';
import Link from 'next/link';
import { AdShowcase } from '../../components/news/AdShowcase';
import { EmptyState } from '../../components/ui/EmptyState';
import { getSite } from '../../lib/api';
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
  const dictionary = getDictionary(locale).advertisement;
  return buildMetadata({
    settings,
    locale,
    origin,
    title: dictionary.allTitle,
    description: dictionary.allDescription,
    path: '/advertisements',
  });
}

export default async function AdvertisementsPage() {
  // The layout already loads the site payload for the header and rail, and it
  // carries every running ad, so this page adds no request of its own.
  const [{ advertisements }, locale] = await Promise.all([
    getSite(),
    getLocale(),
  ]);
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <header className="border-rule border-b pb-8 text-center">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {dictionary.advertisement.allTitle}
        </h1>
        <p className="text-ink-muted mx-auto mt-3 max-w-xl leading-relaxed">
          {dictionary.advertisement.allDescription}
        </p>
      </header>

      <section aria-label={dictionary.advertisement.allTitle} className="mt-8">
        {advertisements.length > 0 ? (
          <AdShowcase advertisements={advertisements} locale={locale} />
        ) : (
          <EmptyState
            title={dictionary.advertise.noCampaignsTitle}
            description={dictionary.advertise.noCampaignsDescription}
          />
        )}
      </section>

      <p className="mt-10 text-center">
        <Link
          href="/advertise"
          className="text-brand hover:text-brand-hover text-sm font-semibold transition-colors"
        >
          {dictionary.advertise.title} &rarr;
        </Link>
      </p>
    </div>
  );
}
