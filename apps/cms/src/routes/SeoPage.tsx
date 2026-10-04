import type { PaginationMeta, SeoHealthDto } from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@coastal-talk-news/ui/states';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CheckCircle2, CircleAlert, ExternalLink, Search } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { queryKeys } from '../api/queryKeys.js';
import { seoApi } from '../api/seo.js';
import { settingsApi } from '../api/settings.js';
import { SettingsSeoForm } from '../features/settings/SettingsSeoForm.js';
import { PageHeader } from '../components/layout/PageHeader.js';
import { Pagination } from '../components/Pagination.js';
import { WEB_URL } from '../config.js';
import { formatDate } from '../lib/format.js';
import { usePageSize } from '../lib/usePageSize.js';

const ARTICLES_PER_PAGE = 10;
const SECTIONS_PER_PAGE = 5;

function Check({
  ok,
  label,
  detail,
}: {
  ok: boolean;
  label: string;
  detail?: ReactNode;
}) {
  const Icon = ok ? CheckCircle2 : CircleAlert;
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${ok ? 'text-success-text' : 'text-warn-text'}`}
        aria-hidden
      />
      <div className="min-w-0">
        <p className="text-ink text-sm">{label}</p>
        {detail && <p className="text-ink-subtle mt-0.5 text-xs">{detail}</p>}
      </div>
    </li>
  );
}

function Count({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-lg bg-surface-sunken px-4 py-3">
      <p className="text-ink text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-ink-muted text-xs">{label}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-hairline rounded-card border bg-surface shadow-sm">
      <h2 className="text-ink border-hairline border-b px-5 py-4 font-semibold">
        {title}
      </h2>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function Missing({ items }: { items: Array<[boolean, string]> }) {
  const shown = items.filter(([missing]) => missing);
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map(([, label]) => (
        <Badge key={label} tone="amber">
          {label}
        </Badge>
      ))}
    </div>
  );
}

function SiteChecks({ site }: { site: SeoHealthDto['site'] }) {
  const reader = (path: string) =>
    WEB_URL ? (
      <a
        href={`${WEB_URL}${path}`}
        target="_blank"
        rel="noreferrer"
        className="text-accent-text inline-flex items-center gap-1 hover:underline"
      >
        Open {path}
        <ExternalLink className="size-3" aria-hidden />
      </a>
    ) : null;

  return (
    <ul className="divide-hairline divide-y">
      <Check
        ok
        label={`Homepage title: “${site.defaultSeoTitle?.trim() || site.siteName}”`}
        detail="Default Site Title, under Search defaults above."
      />
      <Check
        ok={Boolean(site.defaultMetaDescription?.trim())}
        label={
          site.defaultMetaDescription?.trim()
            ? 'Homepage description is set'
            : 'Homepage description uses the tagline'
        }
        detail="Default Meta Description, under Search defaults above. While it is empty, the homepage uses the tagline from Settings → General."
      />
      <Check
        ok={site.hasFavicon}
        label={site.hasFavicon ? 'Favicon is set' : 'No favicon'}
        detail="Settings → General."
      />
      <Check
        ok={site.hasLogo}
        label={site.hasLogo ? 'Logo is set' : 'No logo'}
        detail="Used as the organisation's logo in search engines' structured data."
      />
      <Check
        ok={site.hasDefaultOgImage}
        label={
          site.hasDefaultOgImage
            ? 'Default social image is set'
            : 'No default social image'
        }
        detail="Shown when a page without its own picture is shared."
      />
      <Check
        ok={site.socialProfiles > 0}
        label={`${site.socialProfiles} social profile${site.socialProfiles === 1 ? '' : 's'} linked`}
        detail="Listed as the organisation's official profiles. Settings → Contact."
      />
      <Check
        ok={site.hasGoogleSiteVerification}
        label={
          site.hasGoogleSiteVerification
            ? 'Google Search Console verification tag is set'
            : 'No Google Search Console verification tag'
        }
        detail="Not needed if the domain is verified another way (for example by DNS)."
      />
      <Check
        ok
        label="Canonical URLs, WebSite and Organization data"
        detail="Generated automatically on every page from the settings above."
      />
      <Check ok label="sitemap.xml" detail={reader('/sitemap.xml')} />
      <Check ok label="robots.txt" detail={reader('/robots.txt')} />
    </ul>
  );
}

/** Published articles missing something, fetched a page at a time. */
function ArticleIssues() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize('seo-articles', ARTICLES_PER_PAGE);
  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.seoArticles({ page, limit }),
    queryFn: ({ signal }) => seoApi.articles({ page, limit }, signal),
    placeholderData: keepPreviousData,
  });

  // Fixing articles shrinks the list; don't strand the reader past its end.
  const lastPage = data?.meta.totalPages ?? 1;
  useEffect(() => {
    if (lastPage > 0 && page > lastPage) setPage(lastPage);
  }, [page, lastPage]);

  if (isPending) return <LoadingState label="Loading articles…" />;
  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : 'Could not load articles.'
        }
        onRetry={() => void refetch()}
      />
    );
  }

  const { data: rows, meta } = data;
  if (meta.total === 0) {
    return (
      <EmptyState
        icon={<Search className="size-5" aria-hidden />}
        title="Nothing missing"
        description="Every published article has an SEO title, description, URL slug and featured image."
      />
    );
  }

  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-176 text-left text-sm">
          <thead>
            <tr className="text-ink-subtle border-hairline border-b text-[11px] font-semibold tracking-[0.08em] uppercase">
              <th className="py-2 pr-4">Article</th>
              <th className="py-2 pr-4">Published</th>
              <th className="py-2">Missing</th>
            </tr>
          </thead>
          <tbody className="divide-hairline divide-y">
            {rows.map((article) => (
              <tr key={article.id}>
                <td className="max-w-md py-2.5 pr-4">
                  <Link
                    to={`/articles/${article.id}/edit`}
                    className="text-ink line-clamp-2 font-medium hover:underline"
                  >
                    {article.headline}
                  </Link>
                </td>
                <td className="text-ink-muted py-2.5 pr-4 whitespace-nowrap">
                  {formatDate(article.publicationDate)}
                </td>
                <td className="py-2.5">
                  <Missing
                    items={[
                      [article.missingSeoTitle, 'SEO title'],
                      [article.missingMetaDescription, 'Description'],
                      [article.missingSlug, 'Slug'],
                      [article.missingFeaturedImage, 'Image'],
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        meta={meta}
        itemCount={rows.length}
        itemLabel="articles"
        limit={limit}
        onLimitChange={setLimit}
        onPageChange={setPage}
        isFetching={isFetching}
      />
    </div>
  );
}

/**
 * Sections missing something. There are only a few dozen sections and the
 * page already has them all, so paging happens here, without a request.
 */
function SectionIssues({
  items,
}: {
  items: SeoHealthDto['categories']['items'];
}) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = usePageSize('seo-sections', SECTIONS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(items.length / limit));
  const current = Math.min(page, totalPages);
  const rows = items.slice((current - 1) * limit, current * limit);
  const meta: PaginationMeta = {
    page: current,
    limit,
    total: items.length,
    totalPages,
    hasNextPage: current < totalPages,
    hasPreviousPage: current > 1,
  };

  if (items.length === 0) return null;

  return (
    <div className="mt-4">
      <ul className="divide-hairline divide-y">
        {rows.map((category) => (
          <li
            key={category.id}
            className="flex flex-wrap items-center justify-between gap-2 py-2.5"
          >
            <span className="text-ink text-sm">
              {category.parentName && (
                <span className="text-ink-subtle">
                  {category.parentName} ›{' '}
                </span>
              )}
              {category.name}
            </span>
            <Missing
              items={[
                [category.missingSeoTitle, 'SEO title'],
                [category.missingMetaDescription, 'Description'],
                [category.missingSlug, 'Slug'],
              ]}
            />
          </li>
        ))}
      </ul>
      <Pagination
        meta={meta}
        itemCount={rows.length}
        itemLabel="sections"
        limit={limit}
        onLimitChange={setLimit}
        onPageChange={setPage}
      />
    </div>
  );
}

export function SeoPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.seoHealth,
    queryFn: ({ signal }) => seoApi.health(signal),
  });
  // The same cache the Settings page and the editors' search previews use.
  const settings = useQuery({
    queryKey: queryKeys.settings,
    queryFn: ({ signal }) => settingsApi.get(signal),
  });

  if (isPending || settings.isPending) {
    return <LoadingState label="Checking SEO…" />;
  }
  if (isError || settings.isError) {
    const failure = error ?? settings.error;
    return (
      <ErrorState
        message={
          failure instanceof Error
            ? failure.message
            : 'Could not load SEO checks.'
        }
        onRetry={() => {
          void refetch();
          void settings.refetch();
        }}
      />
    );
  }

  const { site, articles, categories } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO"
        description="The site's search defaults, what the website tells search engines, and what published articles and sections are missing. The checks are facts, not a score: nothing here predicts how Google ranks a page."
      />

      <Panel title="Search defaults">
        <SettingsSeoForm settings={settings.data} />
      </Panel>

      <Panel title="Website">
        <SiteChecks site={site} />
      </Panel>

      <Panel title="Published articles">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Count value={articles.published} label="Published" />
          <Count value={articles.missingSeoTitle} label="No SEO title" />
          <Count
            value={articles.missingMetaDescription}
            label="No meta description"
          />
          <Count value={articles.missingSlug} label="No URL slug" />
          <Count
            value={articles.missingFeaturedImage}
            label="No featured image"
          />
        </div>
        <p className="text-ink-subtle mt-3 text-xs">
          Without its own SEO title or description, an article uses its headline
          and summary — so these are worth filling in for important stories, not
          errors.
        </p>

        <ArticleIssues />
      </Panel>

      <Panel title="Sections (categories)">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Count value={categories.active} label="Visible sections" />
          <Count value={categories.missingSeoTitle} label="No SEO title" />
          <Count
            value={categories.missingMetaDescription}
            label="No meta description"
          />
          <Count value={categories.missingSlug} label="No URL slug" />
        </div>
        <p className="text-ink-subtle mt-3 text-xs">
          A section without its own uses &ldquo;&lt;Name&gt; News&rdquo; and a
          generic line. Edit them under Categories.
        </p>

        <SectionIssues items={categories.items} />
      </Panel>
    </div>
  );
}
