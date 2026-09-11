import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { ImagePlus, Link as LinkIcon } from 'lucide-react';
import type { FormValues, UpdateValues } from './formValues.js';

interface ArticleMediaFieldsProps {
  values: FormValues;
  onChange: UpdateValues;
  onPickImage: () => void;
}

export function ArticleMediaFields({
  values,
  onChange,
  onPickImage,
}: ArticleMediaFieldsProps) {
  return (
    <section className="border-hairline rounded-card space-y-4 border bg-surface p-5 shadow-sm">
      <div>
        <h2 className="text-ink text-base font-semibold">
          Media <span className="text-ink-subtle font-normal">(Optional)</span>
        </h2>
        <p className="text-ink-muted mt-0.5 text-sm">
          Add a featured image and/or YouTube video.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-ink-muted block text-sm font-medium">
            Featured Image
          </span>
          {values.featuredImage ? (
            <div className="group border-hairline relative overflow-hidden rounded-lg border">
              <img
                src={values.featuredImage.url}
                alt=""
                className="aspect-video w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={onPickImage}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => onChange({ featuredImage: null })}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onPickImage}
              className="border-hairline hover:bg-surface-sunken/70 flex w-full flex-col items-center gap-2 rounded-lg border border-dashed bg-surface-sunken px-4 py-8 text-center transition-colors"
            >
              <ImagePlus className="text-ink-subtle size-6" aria-hidden />
              <p className="text-ink-muted text-sm font-medium">
                Choose an image
              </p>
              <p className="text-ink-subtle text-xs">
                From the Media Library, or upload a new one.
              </p>
            </button>
          )}
        </div>

        <Field
          label="YouTube Video"
          htmlFor="article-youtube"
          optional
          hint="Renders inline on the article page if set."
        >
          <Input
            id="article-youtube"
            type="url"
            value={values.youtubeUrl}
            placeholder="Paste YouTube video URL"
            icon={<LinkIcon className="size-4" aria-hidden />}
            onChange={(event) => onChange({ youtubeUrl: event.target.value })}
          />
        </Field>
      </div>
    </section>
  );
}
