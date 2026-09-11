import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Textarea } from '@coastal-talk-news/ui/textarea';
import {
  ARTICLE_META_DESCRIPTION_MAX,
  ARTICLE_SEO_TITLE_MAX,
} from '@coastal-talk-news/validation/limits';
import { ImagePlus, X } from 'lucide-react';
import { useState } from 'react';
import { MediaPickerDialog } from '../media/MediaPickerDialog.js';
import type { FormValues, UpdateValues } from './formValues.js';

interface ArticleSeoFieldsProps {
  values: FormValues;
  onChange: UpdateValues;
}

export function ArticleSeoFields({ values, onChange }: ArticleSeoFieldsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <section className="border-hairline rounded-card space-y-3 border bg-surface p-5 shadow-sm">
      <h2 className="text-ink text-sm font-semibold">Additional Settings</h2>
      <details>
        <summary className="text-ink-muted cursor-pointer text-sm font-medium">
          SEO Settings{' '}
          <span className="text-ink-subtle text-xs font-normal">
            (Optional)
          </span>
        </summary>

        <div className="mt-3 space-y-3">
          <Field
            label="SEO Title"
            htmlFor="article-seo-title"
            optional
            hint="Defaults to the headline."
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
          >
            <Textarea
              id="article-meta-description"
              rows={3}
              maxLength={ARTICLE_META_DESCRIPTION_MAX}
              showCount
              value={values.metaDescription}
              onChange={(event) =>
                onChange({ metaDescription: event.target.value })
              }
            />
          </Field>

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
                    Falls back to the featured image when not set.
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
