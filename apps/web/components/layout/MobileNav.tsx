'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type {
  PublicNavCategoryDto,
  PublicSiteSettingsDto,
} from '@coastal-talk-news/types';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { LanguageToggle } from './LanguageToggle';
import { SocialLinks } from './SocialLinks';

interface MobileNavProps {
  categories: PublicNavCategoryDto[];
  settings: PublicSiteSettingsDto;
  locale: Locale;
}

export function MobileNav({ categories, settings, locale }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const dictionary = getDictionary(locale);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dictionary.header.openMenu}
        aria-expanded={open}
        className="hover:bg-paper-sunken grid size-10 place-items-center rounded-sm transition-colors"
      >
        <span aria-hidden className="flex flex-col gap-1">
          <span className="bg-ink block h-0.5 w-5 rounded-full" />
          <span className="bg-ink block h-0.5 w-5 rounded-full" />
          <span className="bg-ink block h-0.5 w-3.5 rounded-full" />
        </span>
      </button>

      {/* Kept mounted so it can animate; `inert` hides it while closed. */}
      <div
        className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
        inert={!open}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={dictionary.header.closeMenu}
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          className={`bg-paper absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col shadow-2xl transition-transform duration-300 ease-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="border-rule flex items-center gap-3 border-b px-5 py-4">
            {settings.logo && (
              <Image
                src={settings.logo.url}
                alt=""
                width={settings.logo.width}
                height={settings.logo.height}
                className="ring-rule size-10 shrink-0 rounded-full object-cover ring-1"
              />
            )}
            <span className="min-w-0 flex-1 font-serif text-lg leading-tight font-bold">
              {settings.siteName}
              <span className="text-brand">.</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={dictionary.header.closeMenu}
              className="hover:bg-paper-sunken text-ink-muted hover:text-brand grid size-9 shrink-0 place-items-center rounded-full transition-colors"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
                className="size-4"
              >
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <nav
            aria-label={dictionary.header.sections}
            className="flex-1 overflow-y-auto px-3 py-4"
          >
            <p className="text-ink-subtle px-2 pb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
              {dictionary.header.sections}
            </p>

            <Link
              href="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`flex items-center rounded-sm px-2 py-2.5 font-semibold transition-colors ${
                pathname === '/'
                  ? 'bg-brand-soft text-brand'
                  : 'hover:bg-paper-sunken hover:text-brand'
              }`}
            >
              {dictionary.common.home}
            </Link>

            <ul>
              {categories.map((category) => {
                const active = pathname === `/category/${category.id}`;
                return (
                  <li key={category.id}>
                    <Link
                      href={`/category/${category.id}`}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center justify-between gap-3 rounded-sm px-2 py-2.5 transition-colors ${
                        active ? 'bg-brand-soft' : 'hover:bg-paper-sunken'
                      }`}
                    >
                      <span
                        className={`min-w-0 font-semibold transition-colors ${
                          active ? 'text-brand' : 'group-hover:text-brand'
                        }`}
                      >
                        {category.name}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                          active
                            ? 'bg-brand text-white'
                            : 'bg-paper-sunken text-ink-subtle group-hover:bg-brand-soft group-hover:text-brand'
                        }`}
                      >
                        {category.articleCount}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-rule flex items-center justify-between gap-3 border-t px-5 py-4">
            <SocialLinks settings={settings} />
            <LanguageToggle locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
