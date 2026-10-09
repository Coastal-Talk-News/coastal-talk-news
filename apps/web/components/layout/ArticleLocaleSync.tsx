'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getClientLocale, setClientLocale } from '../../lib/i18n/client';
import type { Locale } from '../../lib/i18n/types';

export function ArticleLocaleSync({ locale }: { locale: Locale }) {
  const router = useRouter();

  useEffect(() => {
    if (getClientLocale() === locale) return;
    setClientLocale(locale);
    router.refresh();
  }, [locale, router]);

  return null;
}
