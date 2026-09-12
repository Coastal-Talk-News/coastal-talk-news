import type { Metadata } from 'next';
import { AdShowcase } from '../../components/news/AdShowcase';
import { EmptyState } from '../../components/ui/EmptyState';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { getSite } from '../../lib/api';
import { getDictionary } from '../../lib/i18n/dictionaries';
import { getLocale } from '../../lib/i18n/server';

export const metadata: Metadata = { title: 'Advertise' };

export default async function AdvertisePage() {
  const [{ advertisements, settings }, locale] = await Promise.all([
    getSite(),
    getLocale(),
  ]);
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="border-rule border-b pb-8 text-center">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {dictionary.advertise.title}
        </h1>
        <p className="text-ink-muted mx-auto mt-3 max-w-xl leading-relaxed">
          {dictionary.advertise.intro}
        </p>
        {(settings.contactEmail || settings.contactPhone) && (
          <p className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold">
            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="text-brand hover:underline"
              >
                {settings.contactEmail}
              </a>
            )}
            {settings.contactPhone && (
              <a
                href={`tel:${settings.contactPhone}`}
                className="text-brand hover:underline"
              >
                {settings.contactPhone}
              </a>
            )}
          </p>
        )}
      </header>

      <section aria-label="Current advertisers" className="mt-10">
        <SectionHeading title={dictionary.advertise.currentlyRunning} />
        {advertisements.length > 0 ? (
          <AdShowcase advertisements={advertisements} locale={locale} />
        ) : (
          <EmptyState
            title={dictionary.advertise.noCampaignsTitle}
            description={dictionary.advertise.noCampaignsDescription}
          />
        )}
      </section>
    </div>
  );
}
