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
    { href: '/advertisements', label: dictionary.advertisement.allTitle },
  ];

  return (
    <footer className="bg-night mt-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-x-6 gap-y-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-12">
        <div className="sm:col-span-2 lg:col-span-4">
          <Brand
            siteName={settings.siteName}
            tagline={settings.tagline}
            logo={settings.logo}
            tone="inverse"
          />
          {settings.description && (
            <p className="text-night-muted mt-3 max-w-sm text-sm leading-relaxed">
              {settings.description}
            </p>
          )}
          <SocialLinks settings={settings} tone="inverse" className="mt-4" />
        </div>

        {categories.length > 0 && (
          <nav
            aria-label={dictionary.footer.categories}
            className="sm:col-span-2 lg:col-span-4"
          >
            <h2 className="text-sm font-semibold tracking-wide">
              {dictionary.footer.categories}
            </h2>
            {/* Two lists wide so a dozen sections stay the height of the
                groups beside them; none are hidden, since a footer is where
                the full index is looked for. */}
            <ul className="text-night-muted mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.id}`}
                    className="inline-block transition-colors hover:text-white"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <nav
          aria-label={dictionary.footer.quickLinks}
          className="lg:col-span-2"
        >
          <h2 className="text-sm font-semibold tracking-wide">
            {dictionary.footer.quickLinks}
          </h2>
          <ul className="text-night-muted mt-3 space-y-2 text-sm">
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

        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide">
            {dictionary.footer.contact}
          </h2>
          <ul className="text-night-muted mt-3 space-y-2 text-sm break-words">
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
        <p className="text-night-muted mx-auto max-w-7xl px-4 py-4 text-xs">
          © {new Date().getFullYear()} {settings.siteName}.{' '}
          {dictionary.footer.rightsReserved}
        </p>
      </div>
    </footer>
  );
}
