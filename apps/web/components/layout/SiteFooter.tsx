import Link from 'next/link';
import { Brand } from './Brand';
import type { PublicSiteDto } from '@coastal-talk-news/types';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { SocialLinks } from './SocialLinks';

export function SiteFooter({
  site,
  locale,
}: {
  site: PublicSiteDto;
  locale: Locale;
}) {
  const { settings, categories } = site;
  const dictionary = getDictionary(locale);

  const quickLinks = [
    { href: '/', label: dictionary.common.home },
    { href: '/about', label: dictionary.common.about },
    { href: '/contact', label: dictionary.common.contact },
    { href: '/advertise', label: dictionary.common.advertise },
  ];

  return (
    <footer className="bg-night mt-16 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Brand
            siteName={settings.siteName}
            tagline={settings.tagline}
            tone="inverse"
          />
          {settings.description && (
            <p className="text-night-muted mt-4 max-w-sm text-sm leading-relaxed">
              {settings.description}
            </p>
          )}
          <SocialLinks settings={settings} tone="inverse" className="mt-5" />
        </div>

        <nav aria-label={dictionary.footer.quickLinks}>
          <h2 className="text-sm font-semibold tracking-wide">
            {dictionary.footer.quickLinks}
          </h2>
          <ul className="text-night-muted mt-4 space-y-2.5 text-sm">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {categories.length > 0 && (
          <nav aria-label={dictionary.footer.categories}>
            <h2 className="text-sm font-semibold tracking-wide">
              {dictionary.footer.categories}
            </h2>
            <ul className="text-night-muted mt-4 space-y-2.5 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.id}`}
                    className="transition-colors hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div>
          <h2 className="text-sm font-semibold tracking-wide">
            {dictionary.footer.contact}
          </h2>
          <ul className="text-night-muted mt-4 space-y-2.5 text-sm">
            {settings.contactAddress && <li>{settings.contactAddress}</li>}
            {settings.contactEmail && (
              <li>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="transition-colors hover:text-white"
                >
                  {settings.contactEmail}
                </a>
              </li>
            )}
            {settings.contactPhone && (
              <li>
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="transition-colors hover:text-white"
                >
                  {settings.contactPhone}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-white/10 border-t">
        <p className="text-night-muted mx-auto max-w-7xl px-4 py-5 text-xs">
          © {new Date().getFullYear()} {settings.siteName}.{' '}
          {dictionary.footer.rightsReserved}
        </p>
      </div>
    </footer>
  );
}
