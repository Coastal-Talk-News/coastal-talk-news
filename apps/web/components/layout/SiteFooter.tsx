import Link from 'next/link';
import { Brand } from './Brand';
import type { PublicSiteDto } from '@coastal-talk-news/types';

const QUICK_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/advertise', label: 'Advertise' },
];

export function SiteFooter({ site }: { site: PublicSiteDto }) {
  const { settings, categories } = site;
  const socials = [
    { href: settings.facebookUrl, label: 'Facebook' },
    { href: settings.instagramUrl, label: 'Instagram' },
    { href: settings.youtubeUrl, label: 'YouTube' },
    { href: settings.xUrl, label: 'X' },
  ].filter((link): link is { href: string; label: string } =>
    Boolean(link.href),
  );

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
          {socials.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-night-muted transition-colors hover:text-white"
                >
                  {social.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <nav aria-label="Quick links">
          <h2 className="text-sm font-semibold tracking-wide">Quick Links</h2>
          <ul className="text-night-muted mt-4 space-y-2.5 text-sm">
            {QUICK_LINKS.map((link) => (
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
          <nav aria-label="Categories">
            <h2 className="text-sm font-semibold tracking-wide">Categories</h2>
            <ul className="text-night-muted mt-4 space-y-2.5 text-sm">
              {categories.slice(0, 6).map((category) => (
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
          <h2 className="text-sm font-semibold tracking-wide">Contact</h2>
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
          © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
