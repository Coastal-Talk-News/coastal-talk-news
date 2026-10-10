import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Textarea } from '@coastal-talk-news/ui/textarea';
import {
  ARTICLE_META_DESCRIPTION_MAX,
  ARTICLE_SEO_TITLE_MAX,
} from '@coastal-talk-news/validation/limits';
import { ARTICLE_SLUG_MAX } from '@coastal-talk-news/validation/slug';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { WEB_URL } from '../../config.js';
import { MediaPickerDialog } from '../media/MediaPickerDialog.js';
import { SearchPreview, lengthHint } from '../seo/SearchPreview.js';
import { useSiteName } from '../seo/useSiteName.js';
import type { FormValues, UpdateValues } from './formValues.js';

interface ArticleSeoFieldsProps {
  values: FormValues;
  onChange: UpdateValues;
  /** The address the article will have: typed, saved, or made from an
   * headline in its own language. Empty only for a headline with no words. */
  effectiveSlug: string;
  slugError?: string;
  /** A live article's old address keeps redirecting if the slug changes. */
  published: boolean;
}

export function ArticleSeoFields({
  values,
  onChange,
  effectiveSlug,
  slugError,
  published,
}: ArticleSeoFieldsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const siteName = useSiteName();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  // A slug problem must not hide inside the section if the editor collapsed it.
  useEffect(() => {
    if (slugError && detailsRef.current) detailsRef.current.open = true;
  }, [slugError]);

  const canonicalUrl = effectiveSlug
    ? `${WEB_URL ?? ''}/article/${effectiveSlug}`
    : null;
  const previewTitle =
    values.seoTitle.trim() ||
    (values.headline.trim()
      ? `${values.headline.trim()}${siteName ? ` | ${siteName}` : ''}`
      : '');

  return (
    <section className="border-hairline rounded-card space-y-3 border bg-surface p-5 shadow-sm">
      <h2 className="text-ink text-sm font-semibold">Additional Settings</h2>
      <details ref={detailsRef} open>
        <summary className="text-ink-muted cursor-pointer text-sm font-medium">
          SEO Settings{' '}
          <span className="text-ink-subtle text-xs font-normal">
            (Optional)
          </span>
        </summary>

        <div className="mt-3 space-y-4">
          <Field
            label="SEO Title"
            htmlFor="article-seo-title"
            optional
            hint={`Defaults to the headline followed by the site name. ${lengthHint(values.seoTitle.trim().length, 50, 60)}.`}
          >
            <Input
              id="article-seo-title"
              value={values.seoTitle}
              maxLength={ARTICLE_SEO_TITLE_MAX}
              onChange={(event) => onChange({ seoTitle: event.target.value })}
            />
          </Field>

          <Field
            label="Meta Description"
            htmlFor="article-meta-description"
            optional
            hint={`Defaults to the summary. ${lengthHint(values.metaDescription.trim().length, 150, 160)}.`}
          >
            <Textarea
              id="article-meta-description"
              rows={3}
              maxLength={ARTICLE_META_DESCRIPTION_MAX}
              value={values.metaDescription}
              onChange={(event) =>
                onChange({ metaDescription: event.target.value })
              }
            />
          </Field>

          <Field
            label="URL Slug"
            htmlFor="article-slug"
            optional
            error={slugError}
            hint={
              published
                ? 'Lowercase words joined by hyphens, in English or Kannada. If you change it, the old address keeps redirecting here.'
                : 'Lowercase words joined by hyphens, in English or Kannada. Left empty, it is made from the headline when you save — a Kannada headline gives a Kannada address.'
            }
          >
            <Input
              id="article-slug"
              value={values.slug}
              maxLength={ARTICLE_SLUG_MAX}
              placeholder={effectiveSlug || 'english-words-for-this-story'}
              invalid={Boolean(slugError)}
              onChange={(event) => onChange({ slug: event.target.value })}
            />
          </Field>

          <div className="space-y-1.5">
            <span className="text-ink-muted block text-sm font-medium">
              Canonical URL
            </span>
            <p className="text-ink-muted rounded-lg bg-surface-sunken px-3 py-2 text-xs break-all">
              {canonicalUrl ?? 'Made from the headline when you save.'}
            </p>
          </div>

          <SearchPreview
            siteName={siteName}
            title={previewTitle}
            url={canonicalUrl}
            description={values.metaDescription.trim() || values.summary.trim()}
          />

          <div className="space-y-1.5">
            <span className="text-ink-muted block text-sm font-medium">
              Social preview image
              <span className="text-ink-subtle ml-1 font-normal">
                (optional)
              </span>
            </span>

            {values.ogImage ? (
              <div className="border-hairline flex items-center gap-3 rounded-lg border p-3">
                <img
                  src={values.ogImage.url}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-md object-cover"
                />
                <p className="text-ink-muted min-w-0 flex-1 truncate text-sm">
                  {values.ogImage.width}×{values.ogImage.height}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Remove social preview image"
                  onClick={() => onChange({ ogImage: null })}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            ) : values.featuredImage ? (
              <div className="border-hairline flex items-center gap-3 rounded-lg border p-3">
                <img
                  src={values.featuredImage.url}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-md object-cover"
                />
                <p className="text-ink-muted min-w-0 flex-1 text-sm">
                  Using the featured image from the Media Library.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                >
                  Use another
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="border-hairline hover:border-accent hover:bg-accent-soft flex w-full items-center gap-3 rounded-lg border border-dashed bg-surface-sunken px-4 py-4 text-left transition-colors"
              >
                <span className="text-ink-subtle grid size-10 shrink-0 place-items-center rounded-full bg-surface">
                  <ImagePlus className="size-5" aria-hidden />
                </span>
                <span className="text-sm">
                  <span className="text-ink-muted block font-medium">
                    Choose an image
                  </span>
                  <span className="text-ink-subtle block text-xs">
                    Uses the featured image once one is chosen.
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </details>

      <MediaPickerDialog
        open={pickerOpen}
        selectedId={values.ogImage?.id ?? null}
        onOpenChange={setPickerOpen}
        onSelect={(asset) => {
          onChange({
            ogImage: asset
              ? {
                  id: asset.id,
                  url: asset.url,
                  width: asset.width,
                  height: asset.height,
                }
              : null,
          });
          setPickerOpen(false);
        }}
      />
    </section>
  );
}
