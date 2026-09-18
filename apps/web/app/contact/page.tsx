import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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
    title: getDictionary(locale).contact.title,
    path: '/contact',
  });
}

// Hand-drawn rather than pulled from an icon library, matching SocialLinks —
// three glyphs don't justify a new dependency, and every other icon in this
// app is already inline SVG.
function MapPinIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-5">
      <path
        d="M10 18s6-5.686 6-10a6 6 0 1 0-12 0c0 4.314 6 10 6 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-5">
      <rect
        x="2.5"
        y="4.5"
        width="15"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m3.5 6 6.5 5 6.5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className="size-5">
      <path
        d="M5.5 3h2l1 3.2-1.6 1.4a9 9 0 0 0 4.5 4.5l1.4-1.6 3.2 1v2a1.5 1.5 0 0 1-1.6 1.5A13 13 0 0 1 4 4.6 1.5 1.5 0 0 1 5.5 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ContactCard({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-rule bg-paper rounded-card w-full border p-6 text-center shadow-sm transition-shadow hover:shadow-md sm:w-64">
      <span className="bg-brand-soft text-brand mx-auto grid size-11 place-items-center rounded-full">
        {icon}
      </span>
      <p className="text-ink-subtle mt-4 text-xs font-semibold tracking-[0.12em] uppercase">
        {label}
      </p>
      <div className="mt-1.5 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">
          {dictionary.contact.heading}
        </h1>
        <p className="text-ink-muted mx-auto mt-3 max-w-md">
          {dictionary.contact.intro}
        </p>
      </div>

      {hasDetails ? (
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {settings.contactAddress && (
            <ContactCard
              icon={<MapPinIcon />}
              label={dictionary.contact.addressLabel}
            >
              {settings.contactAddress}
            </ContactCard>
          )}
          {settings.contactEmail && (
            <ContactCard
              icon={<MailIcon />}
              label={dictionary.contact.emailLabel}
            >
              <a
                href={`mailto:${settings.contactEmail}`}
                className="text-brand font-medium break-all hover:underline"
              >
                {settings.contactEmail}
              </a>
            </ContactCard>
          )}
          {settings.contactPhone && (
            <ContactCard
              icon={<PhoneIcon />}
              label={dictionary.contact.phoneLabel}
            >
              <a
                href={`tel:${settings.contactPhone}`}
                className="text-brand font-medium hover:underline"
              >
                {settings.contactPhone}
              </a>
            </ContactCard>
          )}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            title={dictionary.contact.noDetailsTitle}
            description={dictionary.contact.noDetailsDescription}
          />
        </div>
      )}

      {hasSocials && (
        <div className="border-rule mt-14 border-t pt-10 text-center">
          <p className="text-ink-subtle text-xs font-semibold tracking-[0.12em] uppercase">
            {dictionary.contact.followUs}
          </p>
          <SocialLinks
            settings={settings}
            locale={locale}
            className="mt-4 justify-center"
          />
        </div>
      )}
    </div>
  );
}
