import Link from 'next/link';
import { Brand } from './Brand';
import type { PublicSiteDto } from '@coastal-talk-news/types';
import { formatLongDate } from '../../lib/format';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { SearchField } from './SearchField';
import { MobileNav } from './MobileNav';
import { LanguageToggle } from './LanguageToggle';
import { SocialLinks } from './SocialLinks';

export function SiteHeader({
  site,
  locale,
}: {
  site: PublicSiteDto;
  locale: Locale;
}) {
  const { settings, categories } = site;
  const dictionary = getDictionary(locale);

  const utilityLinks = [
    { href: '/about', label: dictionary.common.about },
    { href: '/contact', label: dictionary.common.contact },
    { href: '/advertise', label: dictionary.common.advertise },
  ];

  return (
    <header className="border-rule bg-paper border-b">
      <div className="border-rule hidden border-b lg:block">
        <div className="text-ink-muted mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs">
          <p>{formatLongDate(new Date(), locale)}</p>
          <div className="flex items-center gap-4">
            {utilityLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-brand transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <SocialLinks settings={settings} />
            <LanguageToggle locale={locale} />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5">
        <MobileNav categories={categories} locale={locale} />

        <Brand
          siteName={settings.siteName}
          tagline={settings.tagline}
          priority
          size="lg"
        />

        <div className="ml-auto hidden w-full max-w-xs min-w-0 sm:block">
          <SearchField locale={locale} />
        </div>
      </div>

      <div className="border-rule border-t px-4 py-3 sm:hidden">
        <SearchField locale={locale} />
      </div>

      {/* Its own row rather than squeezed alongside the masthead: the
          non-shrinking logo+name already fills a phone-width row on its
          own, so anything else sharing that line would just overflow
          off-screen. Below lg the utility bar above is hidden, so this is
          the toggle's only home there. */}
      <div className="border-rule flex justify-end border-t px-4 py-2 lg:hidden">
        <LanguageToggle locale={locale} />
      </div>

      <nav
        aria-label={dictionary.header.sections}
        className="border-rule hidden border-t lg:block"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          <Link
            href="/"
            className="hover:text-brand border-b-2 border-transparent px-3 py-3 text-sm font-semibold transition-colors"
          >
            {dictionary.common.home}
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="hover:text-brand border-b-2 border-transparent px-3 py-3 text-sm font-semibold transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
