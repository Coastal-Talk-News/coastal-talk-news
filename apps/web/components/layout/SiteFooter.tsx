import Link from 'next/link';
import { Brand } from './Brand';
import type {
  PublicNavCategoryDto,
  PublicSiteDto,
} from '@coastal-talk-news/types';
import { categoryName } from '../../lib/category-name';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { SocialLinks } from './SocialLinks';

/** A group's sections, and theirs in turn — indented so a reader can see
 * which group a section belongs to rather than meeting one flat list. */
function SectionBranch({
  categories,
  depth,
  locale,
}: {
  categories: PublicNavCategoryDto[];
  depth: number;
  locale: Locale;
}) {
  return categories.map((category) => (
    <li key={category.id}>
      <Link
        href={`/category/${category.id}`}
        style={depth > 0 ? { paddingInlineStart: depth * 12 } : undefined}
        className="inline-block transition-colors hover:text-white"
      >
        {categoryName(category, locale)}
      </Link>
      {category.children.length > 0 && (
        <ul className="mt-1.5 space-y-1.5">
          <SectionBranch
            categories={category.children}
            depth={depth + 1}
            locale={locale}
          />
        </ul>
      )}
    </li>
  ));
}

export function SiteFooter({
  site,
  locale,
}: {
  site: PublicSiteDto;
  locale: Locale;
}) {
  const { settings, categories } = site;
  const dictionary = getDictionary(locale);

  // The list arrives flat, every depth mixed together, so a footer built
  // straight from it sets a group beside one of its own grandchildren. Each
  // top-level group gets a column of its own instead, and the categories
  // that sit at the top level on their own share the last one.
  const topLevel = categories.filter((category) => !category.parentId);
  const groups = topLevel.filter((category) => category.children.length > 0);
  const ungrouped = topLevel.filter(
    (category) => category.children.length === 0,
  );

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
        <div className="sm:col-span-2 lg:col-span-3">
          <Brand
            siteName={settings.siteName}
            tagline={settings.tagline}
            logo={settings.logo}
            tone="inverse"
          />
          <SocialLinks
            settings={settings}
            locale={locale}
            tone="inverse"
            className="mt-4"
          />
        </div>

        {topLevel.length > 0 && (
          <nav
            aria-label={dictionary.footer.categories}
            className="sm:col-span-2 lg:col-span-5"
          >
            <h2 className="text-sm font-semibold tracking-wide">
              {dictionary.footer.categories}
            </h2>
            {/* Nothing is hidden behind a "more" link: a footer is where the
                full index is looked for. */}
            {/* Flowed rather than a grid: the groups are wildly different
                heights, and grid rows would align them, leaving a short
                group sitting above a long hole. Each block is kept whole. */}
            <div className="mt-3 columns-1 gap-x-6 text-sm sm:columns-2">
              {groups.map((group) => (
                <div key={group.id} className="mb-5 break-inside-avoid">
                  <Link
                    href={`/category/${group.id}`}
                    className="font-semibold text-white/90 transition-colors hover:text-white"
                  >
                    {categoryName(group, locale)}
                  </Link>
                  <ul className="text-night-muted mt-2 space-y-1.5">
                    <SectionBranch
                      categories={group.children}
                      depth={0}
                      locale={locale}
                    />
                  </ul>
                </div>
              ))}

              {ungrouped.length > 0 && (
                <div className="mb-5 break-inside-avoid">
                  <p className="font-semibold text-white/90">
                    {dictionary.footer.otherSections}
                  </p>
                  <ul className="text-night-muted mt-2 space-y-1.5">
                    <SectionBranch
                      categories={ungrouped}
                      depth={0}
                      locale={locale}
                    />
                  </ul>
                </div>
              )}
            </div>
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
            {/* Set apart by a line's gap, and in white, so it reads as a
                notice rather than another section of the site. */}
            <li className="pt-3">
              <Link
                href="/privacy-policy"
                className="font-serif font-semibold text-white transition-colors hover:text-white/80"
              >
                {dictionary.common.privacyPolicy}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold tracking-wide">
            {dictionary.footer.contact}
          </h2>
          <ul className="text-night-muted mt-3 space-y-2 text-sm wrap-break-word">
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
