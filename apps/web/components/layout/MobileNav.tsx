'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type {
  PublicNavCategoryDto,
  PublicSiteSettingsDto,
} from '@coastal-talk-news/types';
import { categoryName } from '../../lib/category-name';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { LanguageToggle } from './LanguageToggle';
import { SocialLinks } from './SocialLinks';
import { Brand } from './Brand';

interface MobileNavProps {
  categories: PublicNavCategoryDto[];
  settings: PublicSiteSettingsDto;
  locale: Locale;
}

export function MobileNav({ categories, settings, locale }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const dictionary = getDictionary(locale);
  const pathname = usePathname();

  const topLevel = categories.filter((category) => !category.parentId);

  function toggleExpanded(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Opening the drawer while reading a section shows that section in place,
  // rather than a list of shut groups giving no clue which one you are in.
  useEffect(() => {
    if (!open) return;
    const byId = new Map(categories.map((category) => [category.id, category]));
    const current = categories.find(
      (category) => pathname === `/category/${category.id}`,
    );
    const ancestors = new Set<string>();
    let parentId = current?.parentId ?? null;
    while (parentId) {
      ancestors.add(parentId);
      parentId = byId.get(parentId)?.parentId ?? null;
    }
    if (ancestors.size > 0) {
      setExpanded((previous) => new Set([...previous, ...ancestors]));
    }
  }, [open, pathname, categories]);

  function renderCategory(category: PublicNavCategoryDto, depth: number) {
    const hasChildren = category.children.length > 0;
    const active = pathname === `/category/${category.id}`;
    const isExpanded = expanded.has(category.id);

    // One rule per level above this row, so an expanded group reads as a
    // branch rather than a list that happens to be indented.
    const guides = Array.from({ length: depth }, (_, level) => (
      <span
        key={level}
        aria-hidden
        className="border-rule ml-2.5 w-3 shrink-0 self-stretch border-l"
      />
    ));

    return (
      <li key={category.id}>
        <div className="flex items-stretch">
          {guides}
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpanded(category.id)}
              aria-expanded={isExpanded}
              className="group hover:bg-paper-sunken flex flex-1 items-center justify-between gap-3 rounded-sm px-2 py-2.5 text-left transition-colors"
            >
              <span className="group-hover:text-brand min-w-0 font-semibold transition-colors">
                {categoryName(category, locale)}
              </span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
                className={`text-ink-subtle size-3.5 shrink-0 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              >
                <path
                  d="m5 7.5 5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <Link
              href={`/category/${category.id}`}
              aria-current={active ? 'page' : undefined}
              className={`group flex flex-1 items-center justify-between gap-3 rounded-sm px-2 py-2.5 transition-colors ${
                active ? 'bg-brand-soft' : 'hover:bg-paper-sunken'
              }`}
            >
              <span
                className={`min-w-0 font-semibold transition-colors ${
                  active ? 'text-brand' : 'group-hover:text-brand'
                }`}
              >
                {categoryName(category, locale)}
              </span>
            </Link>
          )}
        </div>
        {hasChildren && isExpanded && (
          <ul>
            {category.children.map((child) => renderCategory(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  }

  // Same links as the desktop utility bar (hidden below lg) — with nowhere
  // else to live on mobile, they belong in this drawer instead.
  const utilityLinks = [
    { href: '/about', label: dictionary.common.about },
    { href: '/contact', label: dictionary.common.contact },
    { href: '/advertise', label: dictionary.common.advertise },
  ];

  const hasSocials = Boolean(
    settings.facebookUrl ||
    settings.instagramUrl ||
    settings.youtubeUrl ||
    settings.xUrl ||
    settings.whatsappEnglishUrl ||
    settings.whatsappKannadaUrl,
  );

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
          className={`bg-paper grain absolute inset-y-0 left-0 flex w-[86vw] max-w-sm flex-col shadow-2xl transition-transform duration-300 ease-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="border-rule flex items-center gap-3 border-b px-5 py-4">
            <span className="min-w-0 flex-1 font-serif text-lg leading-tight font-bold">
              <Brand
                siteName={settings.siteName}
                tagline={null}
                logo={settings.logo}
                priority
                size="lg"
              />
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

            <ul>{topLevel.map((category) => renderCategory(category, 0))}</ul>

            <ul className="border-rule mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t px-2 pt-3">
              {utilityLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={`text-sm font-medium transition-colors ${
                        active
                          ? 'text-brand'
                          : 'text-ink-muted hover:text-brand'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {hasSocials && (
            <div className="border-rule border-t px-5 py-4">
              <p className="text-ink-subtle mb-3 text-[10px] font-semibold tracking-[0.14em] uppercase">
                {dictionary.contact.followUs}
              </p>
              <SocialLinks settings={settings} locale={locale} />
            </div>
          )}

          <div className="border-rule border-t px-5 py-4">
            <LanguageToggle locale={locale} />
          </div>
        </div>
      </div>
    </div>
  );
}
