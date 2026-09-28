import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Link as LinkIcon } from 'lucide-react';
import { DEFAULT_LAYOUT } from '../media/imageFrame.js';
import { FeaturedImageField } from './FeaturedImageField.js';
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

      <div className="space-y-1.5">
        <span className="text-ink-muted block text-sm font-medium">
          Featured Image
        </span>
        <FeaturedImageField
          image={values.featuredImage}
          layout={values.featuredImageLayout}
          onLayoutChange={(featuredImageLayout) =>
            onChange({ featuredImageLayout })
          }
          onPick={onPickImage}
          onRemove={() =>
            onChange({
              featuredImage: null,
              featuredImageLayout: DEFAULT_LAYOUT,
            })
          }
        />
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
    </section>
  );
}
