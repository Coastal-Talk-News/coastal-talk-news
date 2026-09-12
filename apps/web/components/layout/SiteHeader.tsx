import Link from 'next/link';
import { Brand } from './Brand';
import type { PublicSiteDto } from '@coastal-talk-news/types';
import { formatLongDate } from '../../lib/format';
import { SearchField } from './SearchField';
import { MobileNav } from './MobileNav';
import { SocialLinks } from './SocialLinks';

const UTILITY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/advertise', label: 'Advertise' },
];

export function SiteHeader({ site }: { site: PublicSiteDto }) {
  const { settings, categories } = site;

  return (
    <header className="border-rule bg-paper border-b">
      <div className="border-rule hidden border-b lg:block">
        <div className="text-ink-muted mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2 text-xs">
          <p>{formatLongDate(new Date())}</p>
          <div className="flex items-center gap-4">
            {UTILITY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-brand transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <SocialLinks settings={settings} />
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5">
        <MobileNav categories={categories} />

        <Brand
          siteName={settings.siteName}
          tagline={settings.tagline}
          priority
          size="lg"
        />

        <div className="ml-auto hidden w-full max-w-xs min-w-0 sm:block">
          <SearchField />
        </div>
      </div>

      <div className="border-rule border-t px-4 py-3 sm:hidden">
        <SearchField />
      </div>

      <nav
        aria-label="Sections"
        className="border-rule hidden border-t lg:block"
      >
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-4">
          <Link
            href="/"
            className="hover:text-brand border-b-2 border-transparent px-3 py-3 text-sm font-semibold transition-colors"
          >
            Home
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
