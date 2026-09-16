import Link from 'next/link';
import { Brand } from './Brand';
import type { PublicSiteDto } from '@coastal-talk-news/types';
import { MastheadAd } from '../news/MastheadAd';
import { adsForZone } from '../../lib/ads';
import { formatLongDate } from '../../lib/format';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { SearchField } from './SearchField';
import { MobileNav } from './MobileNav';
import { LanguageToggle } from './LanguageToggle';
import { SocialLinks } from './SocialLinks';
import { CategoryNav } from './CategoryNav';
import { HeaderSearchToggle } from './HeaderSearchToggle';

export function SiteHeader({
  site,
  locale,
}: {
  site: PublicSiteDto;
  locale: Locale;
}) {
  const { settings, categories, advertisements } = site;
  const dictionary = getDictionary(locale);
  const mastheadAds = adsForZone(advertisements, 'masthead');

  const utilityLinks = [
    { href: '/about', label: dictionary.common.about },
    { href: '/contact', label: dictionary.common.contact },
    { href: '/advertise', label: dictionary.common.advertise },
  ];

  return (
    <header className="border-rule bg-paper grain border-b">
      <div className="border-rule hidden border-b lg:block">
        <div className="text-ink-muted mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs">
          <p>{formatLongDate(new Date(), locale)}</p>
          <div className="flex items-center gap-3">
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

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
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

        <MastheadAd
          advertisements={mastheadAds}
          variant="inline"
          locale={locale}
        />
      </div>

      <MastheadAd advertisements={mastheadAds} variant="band" locale={locale} />

      {/* The two controls with no room in the masthead below lg share one row
          rather than stacking two: the non-shrinking logo+name already fills a
          phone-width line, and the utility bar that holds the toggle from lg up
          is hidden here. The search drops out at md, where it moves inline. */}
      <div className="border-rule flex items-center gap-3 border-t px-4 py-2 lg:hidden">
        <div className="min-w-0 flex-1 md:hidden">
          <SearchField locale={locale} />
        </div>
        <LanguageToggle locale={locale} className="ms-auto" />
      </div>

      <div className="border-rule hidden border-t md:block">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4">
          <div className="min-w-0 flex-1">
            <CategoryNav
              categories={categories}
              homeLabel={dictionary.common.home}
              moreLabel={dictionary.header.more}
              moreAriaLabel={dictionary.header.moreSections}
              sectionsLabel={dictionary.header.sections}
            />
          </div>
          <HeaderSearchToggle
            locale={locale}
            searchLabel={dictionary.header.searchLabel}
          />
        </div>
      </div>
    </header>
  );
}
