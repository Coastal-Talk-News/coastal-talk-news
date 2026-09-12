import type { Metadata } from 'next';
import Image from 'next/image';
import { EmptyState } from '../../components/ui/EmptyState';
import { getSite } from '../../lib/api';
import { getDictionary } from '../../lib/i18n/dictionaries';
import { getLocale } from '../../lib/i18n/server';

export const metadata: Metadata = { title: 'About' };

export default async function AboutPage() {
  const [{ settings }, locale] = await Promise.all([getSite(), getLocale()]);
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-20">
      {settings.logo && (
        <Image
          src={settings.logo.url}
          alt=""
          width={96}
          height={96}
          className="ring-rule mx-auto size-20 rounded-full object-cover ring-1"
        />
      )}

      <h1 className="mt-6 font-serif text-3xl font-bold sm:text-4xl">
        {dictionary.about.heading(settings.siteName)}
      </h1>
      {settings.tagline && (
        <p className="text-brand mt-2 text-lg font-semibold">
          {settings.tagline}
        </p>
      )}

      {settings.description ? (
        <p className="text-ink-muted mx-auto mt-8 max-w-2xl text-lg leading-relaxed whitespace-pre-line">
          {settings.description}
        </p>
      ) : (
        <div className="mt-10">
          <EmptyState
            title={dictionary.about.noDescriptionTitle}
            description={dictionary.about.noDescriptionDescription}
          />
        </div>
      )}
    </div>
  );
}
