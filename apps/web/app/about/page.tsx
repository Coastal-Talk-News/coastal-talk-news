import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { SocialLinks } from '../../components/layout/SocialLinks';
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
  return buildMetadata({
    settings,
    locale,
    origin,
    title: getDictionary(locale).about.title,
    path: '/about',
  });
}

export default async function AboutPage() {
  const [{ settings }, locale] = await Promise.all([getSite(), getLocale()]);
  const dictionary = getDictionary(locale);

  const hasSocials = Boolean(
    settings.facebookUrl ||
    settings.instagramUrl ||
    settings.youtubeUrl ||
    settings.xUrl,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="border-rule bg-paper-sunken rounded-card border px-6 py-12 text-center sm:py-16">
        {settings.logo && (
          <Image
            src={settings.logo.url}
            alt=""
            width={112}
            height={112}
            className="ring-rule mx-auto size-20 rounded-full object-cover shadow-sm ring-1 sm:size-24"
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
      </div>

      {settings.description ? (
        <div className="border-brand mx-auto mt-10 max-w-2xl border-l-4 pl-6">
          <p className="text-ink-muted text-lg leading-relaxed whitespace-pre-line">
            {settings.description}
          </p>
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            title={dictionary.about.noDescriptionTitle}
            description={dictionary.about.noDescriptionDescription}
          />
        </div>
      )}

      <section className="bg-brand-soft rounded-card mt-14 px-6 py-10 text-center">
        <h2 className="font-serif text-2xl font-bold">
          {dictionary.about.getInTouch}
        </h2>
        <p className="text-ink-muted mx-auto mt-2 max-w-md">
          {dictionary.about.getInTouchDescription}
        </p>
        <div className="mt-6 flex flex-col items-center gap-4">
          <Link
            href="/contact"
            className="bg-brand hover:bg-brand-hover inline-flex items-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {dictionary.common.contact}
            <span aria-hidden>→</span>
          </Link>
          {hasSocials && (
            <SocialLinks
              settings={settings}
              locale={locale}
              className="justify-center"
            />
          )}
        </div>
      </section>
    </div>
  );
}
