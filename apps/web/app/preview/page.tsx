import type { Metadata } from 'next';
import { getSite } from '../../lib/api';
import { getLocale } from '../../lib/i18n/server';
import { getOrigin } from '../../lib/site-url';
import { PreviewTab } from './PreviewTab';

// Stateless live preview - must never be cached.
export const dynamic = 'force-dynamic';

// A draft has no business in a search index, whoever finds the link.
export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

export default async function PreviewPage() {
  const [{ settings }, locale, origin] = await Promise.all([
    getSite(),
    getLocale(),
    getOrigin(),
  ]);

  return <PreviewTab settings={settings} locale={locale} shareUrl={origin} />;
}
