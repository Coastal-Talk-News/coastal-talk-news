import type { Metadata } from 'next';
import { AdShowcase } from '../../components/news/AdShowcase';
import { EmptyState } from '../../components/ui/EmptyState';
import { SectionHeading } from '../../components/ui/SectionHeading';
import { getSite } from '../../lib/api';

export const metadata: Metadata = { title: 'Advertise' };

export default async function AdvertisePage() {
  const { advertisements, settings } = await getSite();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
      <header className="border-rule border-b pb-8 text-center">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          Advertise with us
        </h1>
        <p className="text-ink-muted mx-auto mt-3 max-w-xl leading-relaxed">
          Reach readers across the coast. Send us your artwork at any size — it
          is placed at its own proportions, never stretched or cropped.
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
        <SectionHeading title="Currently running" />
        {advertisements.length > 0 ? (
          <AdShowcase advertisements={advertisements} />
        ) : (
          <EmptyState
            title="No campaigns running right now"
            description="Advertisements appear here for as long as they are scheduled to run."
          />
        )}
      </section>
    </div>
  );
}
