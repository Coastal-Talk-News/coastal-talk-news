import type { Metadata } from 'next';
import { ArticleView } from '../../../components/news/ArticleView';
import { getArticlePreview, getSite } from '../../../lib/api';
import { getLocale } from '../../../lib/i18n/server';
import { getOrigin } from '../../../lib/site-url';

interface PreviewPageProps {
  params: Promise<{ token: string }>;
}

// A draft has no business in a search index, whoever finds the link.
export const metadata: Metadata = {
  title: 'Preview',
  robots: { index: false, follow: false },
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { token } = await params;
  const [article, { settings }, locale, origin] = await Promise.all([
    getArticlePreview(token),
    getSite(),
    getLocale(),
    getOrigin(),
  ]);

  if (!article) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="font-serif text-2xl font-bold">
          This preview has ended
        </h1>
        <p className="text-ink-muted mt-3">
          Previews last half an hour. Go back to the editor and press Preview
          again.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        role="note"
        className="border-brand/30 bg-brand/5 text-ink-muted rounded-card flex items-center gap-2 border px-4 py-2.5 text-sm"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand size-4 shrink-0"
          aria-hidden
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>
          <strong className="text-ink font-semibold">Preview.</strong> This is
          how the article will look once it is published. It is not on the
          website yet.
        </span>
      </div>
      <ArticleView
        article={article}
        settings={settings}
        locale={locale}
        // The draft has no public address of its own, so sharing points home.
        shareUrl={origin}
      />
    </>
  );
}
