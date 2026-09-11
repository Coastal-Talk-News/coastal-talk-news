import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Select, type SelectOption } from '@coastal-talk-news/ui/select';
import { Textarea } from '@coastal-talk-news/ui/textarea';
import {
  ARTICLE_HEADLINE_MAX,
  ARTICLE_SUMMARY_MAX,
} from '@coastal-talk-news/validation/limits';
import type { FormValues, UpdateValues } from './formValues.js';
import { PRIORITY_OPTIONS } from './priority.js';

const LANGUAGE_OPTIONS: Array<
  SelectOption<Exclude<FormValues['language'], ''>>
> = [
  { value: 'ENGLISH', label: 'English' },
  { value: 'KANNADA', label: 'ಕನ್ನಡ' },
];

interface ArticleBasicFieldsProps {
  values: FormValues;
  categoryOptions: SelectOption[];
  errors: {
    language?: string;
    category?: string;
    headline?: string;
    summary?: string;
  };
  onChange: UpdateValues;
  onBlur: () => void;
}

export function ArticleBasicFields({
  values,
  categoryOptions,
  errors,
  onChange,
  onBlur,
}: ArticleBasicFieldsProps) {
  return (
    <section className="border-hairline rounded-card space-y-5 border bg-surface p-5 shadow-sm">
      <div>
        <h2 className="text-ink text-base font-semibold">Basic Information</h2>
        <p className="text-ink-muted mt-0.5 text-sm">
          Add the essential details about your article.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          label="Language"
          htmlFor="article-language"
          required
          error={errors.language}
        >
          <Select
            id="article-language"
            value={values.language}
            placeholder="Select language"
            invalid={Boolean(errors.language)}
            options={LANGUAGE_OPTIONS}
            onValueChange={(language) => onChange({ language })}
          />
        </Field>

        <Field
          label="Category"
          htmlFor="article-category"
          required
          error={errors.category}
        >
          <Select
            id="article-category"
            value={values.categoryId}
            placeholder="Select category"
            invalid={Boolean(errors.category)}
            options={categoryOptions}
            onValueChange={(categoryId) => onChange({ categoryId })}
          />
        </Field>

        <Field
          label="Editorial Priority"
          htmlFor="article-priority"
          hint="Controls placement on the homepage."
        >
          <Select
            id="article-priority"
            value={values.priority}
            options={PRIORITY_OPTIONS}
            onValueChange={(priority) => onChange({ priority })}
          />
        </Field>
      </div>

      <Field
        label="Headline"
        htmlFor="article-headline"
        required
        error={errors.headline}
      >
        <Input
          id="article-headline"
          value={values.headline}
          maxLength={ARTICLE_HEADLINE_MAX}
          placeholder="Enter a clear and concise headline"
          invalid={Boolean(errors.headline)}
          onBlur={onBlur}
          onChange={(event) => onChange({ headline: event.target.value })}
        />
      </Field>

      <Field
        label="Summary"
        htmlFor="article-summary"
        required
        error={errors.summary}
        hint={
          errors.summary
            ? undefined
            : 'Shown in article listings and social previews.'
        }
      >
        <Textarea
          id="article-summary"
          rows={3}
          maxLength={ARTICLE_SUMMARY_MAX}
          showCount
          value={values.summary}
          invalid={Boolean(errors.summary)}
          placeholder="Write a short summary (2–3 lines) that appears in article listings and on social media."
          onBlur={onBlur}
          onChange={(event) => onChange({ summary: event.target.value })}
        />
      </Field>
    </section>
  );
}
