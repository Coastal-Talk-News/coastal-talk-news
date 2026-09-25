import type { Metadata } from 'next';
import { ArticleBody } from '../../components/news/ArticleBody';
import { EmptyState } from '../../components/ui/EmptyState';
import { getPage, getSite } from '../../lib/api';
import { getDictionary } from '../../lib/i18n/dictionaries';
import { getLocale } from '../../lib/i18n/server';
import { buildMetadata } from '../../lib/seo';
import { getOrigin } from '../../lib/site-url';

export async function generateMetadata(): Promise<Metadata> {
  const [{ settings }, locale, origin] = await Promise.all([
    getSite(),
    getLocale(),
    getOrigin(),
  ]);
  return buildMetadata({
    settings,
    locale,
    origin,
    title: getDictionary(locale).common.privacyPolicy,
    path: '/privacy-policy',
  });
}

export default async function PrivacyPolicyPage() {
  const [page, locale] = await Promise.all([getPage('privacy'), getLocale()]);
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <header className="border-ink border-b-2 pb-6">
        <h1 className="font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl">
          {dictionary.common.privacyPolicy}
        </h1>
      </header>

      {page.content ? (
        <ArticleBody content={page.content} />
      ) : (
        <div className="mt-8">
          <EmptyState
            title={dictionary.privacy.noContentTitle}
            description={dictionary.privacy.noContentDescription}
          />
        </div>
      )}
    </div>
  );
}
