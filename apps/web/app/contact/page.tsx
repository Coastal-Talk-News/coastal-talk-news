import type { Metadata } from 'next';
import { SocialLinks } from '../../components/layout/SocialLinks';
import { EmptyState } from '../../components/ui/EmptyState';
import { getSite } from '../../lib/api';
import { getDictionary } from '../../lib/i18n/dictionaries';
import { getLocale } from '../../lib/i18n/server';

export const metadata: Metadata = { title: 'Contact' };

export default async function ContactPage() {
  const [{ settings }, locale] = await Promise.all([getSite(), getLocale()]);
  const dictionary = getDictionary(locale);

  const hasDetails = Boolean(
    settings.contactAddress || settings.contactEmail || settings.contactPhone,
  );
  const hasSocials = Boolean(
    settings.facebookUrl ||
    settings.instagramUrl ||
    settings.youtubeUrl ||
    settings.xUrl,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:py-20">
      <h1 className="text-center font-serif text-3xl font-bold sm:text-4xl">
        {dictionary.contact.heading}
      </h1>

      {hasDetails ? (
        <ul className="border-rule divide-rule mt-10 divide-y rounded-card border text-center">
          {settings.contactAddress && (
            <li className="px-6 py-5">
              <p className="text-ink-subtle text-xs font-semibold tracking-[0.12em] uppercase">
                {dictionary.contact.addressLabel}
              </p>
              <p className="mt-1.5">{settings.contactAddress}</p>
            </li>
          )}
          {settings.contactEmail && (
            <li className="px-6 py-5">
              <p className="text-ink-subtle text-xs font-semibold tracking-[0.12em] uppercase">
                {dictionary.contact.emailLabel}
              </p>
              <a
                href={`mailto:${settings.contactEmail}`}
                className="text-brand mt-1.5 block font-medium hover:underline"
              >
                {settings.contactEmail}
              </a>
            </li>
          )}
          {settings.contactPhone && (
            <li className="px-6 py-5">
              <p className="text-ink-subtle text-xs font-semibold tracking-[0.12em] uppercase">
                {dictionary.contact.phoneLabel}
              </p>
              <a
                href={`tel:${settings.contactPhone}`}
                className="text-brand mt-1.5 block font-medium hover:underline"
              >
                {settings.contactPhone}
              </a>
            </li>
          )}
        </ul>
      ) : (
        <div className="mt-10">
          <EmptyState
            title={dictionary.contact.noDetailsTitle}
            description={dictionary.contact.noDetailsDescription}
          />
        </div>
      )}

      {hasSocials && (
        <div className="mt-10 text-center">
          <p className="text-ink-subtle text-xs font-semibold tracking-[0.12em] uppercase">
            {dictionary.contact.followUs}
          </p>
          <SocialLinks settings={settings} className="mt-3 justify-center" />
        </div>
      )}
    </div>
  );
}
