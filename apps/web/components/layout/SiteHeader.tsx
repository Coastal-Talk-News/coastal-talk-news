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
import { CategoryNav } from './CategoryNav';

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
        <MobileNav
          categories={categories}
          settings={settings}
          locale={locale}
        />

        <div className="min-w-0 flex-1">
          <Brand
            siteName={settings.siteName}
            tagline={settings.tagline}
            logo={settings.logo}
            priority
            size="lg"
          />
        </div>

        <div className="hidden w-full max-w-xs min-w-0 md:block">
          <SearchField locale={locale} />
        </div>
      </div>

      <div className="border-rule border-t px-4 py-3 md:hidden">
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

      <div className="border-rule hidden border-t md:block">
        <div className="mx-auto max-w-7xl px-4">
          <CategoryNav
            categories={categories}
            homeLabel={dictionary.common.home}
            moreLabel={dictionary.header.more}
            moreAriaLabel={dictionary.header.moreSections}
            sectionsLabel={dictionary.header.sections}
          />
        </div>
      </div>
    </header>
  );
}
