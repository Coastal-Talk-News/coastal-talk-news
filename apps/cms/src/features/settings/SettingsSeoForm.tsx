import type {
  SiteSettingsDto,
  UpdateSiteSettingsRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Info } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { SettingsImageField } from './SettingsImageField.js';
import { useUpdateSettings } from './useUpdateSettings.js';

// Mirrors packages/validation/src/settings.ts — see SettingsGeneralForm for why
// the CMS keeps its own copies instead of importing the validation package.
const SEO_TITLE_MAX = 60;
const META_DESCRIPTION_MAX = 160;

interface SeoValues {
  defaultSeoTitle: string;
  defaultMetaDescription: string;
  defaultOgImage: SiteSettingsDto['defaultOgImage'];
}

function toValues(settings: SiteSettingsDto): SeoValues {
  return {
    defaultSeoTitle: settings.defaultSeoTitle ?? '',
    defaultMetaDescription: settings.defaultMetaDescription ?? '',
    defaultOgImage: settings.defaultOgImage,
  };
}

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

interface SettingsSeoFormProps {
  settings: SiteSettingsDto;
}

export function SettingsSeoForm({ settings }: SettingsSeoFormProps) {
  const [values, setValues] = useState<SeoValues>(() => toValues(settings));
  const initial = useRef<SeoValues>(toValues(settings));
  const mutation = useUpdateSettings();

  useEffect(() => {
    const next = toValues(settings);
    setValues(next);
    initial.current = next;
  }, [settings]);

  const isDirty =
    values.defaultSeoTitle.trim() !== initial.current.defaultSeoTitle.trim() ||
    values.defaultMetaDescription.trim() !==
      initial.current.defaultMetaDescription.trim() ||
    (values.defaultOgImage?.id ?? null) !==
      (initial.current.defaultOgImage?.id ?? null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isDirty) return;

    const body: UpdateSiteSettingsRequest = {
      defaultSeoTitle: orNull(values.defaultSeoTitle),
      defaultMetaDescription: orNull(values.defaultMetaDescription),
      defaultOgImageId: values.defaultOgImage?.id ?? null,
    };
    mutation.mutate(body, {
      onSuccess: () => toast.success('SEO settings saved.'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="bg-accent-soft flex gap-3 rounded-lg p-4">
        <Info className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-ink-muted text-sm">
          These defaults are used for pages that don&rsquo;t set their own
          title, description, or preview image — an article&rsquo;s own SEO
          fields always take priority over these.
        </p>
      </div>

      <Field label="Default Site Title" htmlFor="settings-seo-title" optional>
        <Input
          id="settings-seo-title"
          value={values.defaultSeoTitle}
          maxLength={SEO_TITLE_MAX}
          placeholder="Coastal Talk News — Local news you can trust"
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              defaultSeoTitle: event.target.value,
            }))
          }
        />
      </Field>

      <div className="space-y-1.5">
        <label
          htmlFor="settings-seo-description"
          className="block text-sm font-medium text-ink-muted"
        >
          Default Meta Description
          <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
        </label>
        <textarea
          id="settings-seo-description"
          rows={3}
          maxLength={META_DESCRIPTION_MAX}
          value={values.defaultMetaDescription}
          placeholder="A short description search engines show under your site's title."
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              defaultMetaDescription: event.target.value,
            }))
          }
          className="ring-hairline focus:ring-accent w-full resize-none rounded-lg bg-surface px-3 py-2.5 text-sm ring-1 transition-shadow placeholder:text-ink-subtle hover:ring-ink-subtle/40 focus:ring-2 focus:outline-none"
        />
        <p className="text-ink-subtle text-right text-xs tabular-nums">
          {values.defaultMetaDescription.length}/{META_DESCRIPTION_MAX}
        </p>
      </div>

      <SettingsImageField
        label="Default OG Image"
        hint="Shown when a page is shared on social media. Recommended size: 1200 × 630px."
        value={values.defaultOgImage}
        onChange={(defaultOgImage) =>
          setValues((current) => ({ ...current, defaultOgImage }))
        }
      />

      <div className="flex justify-end border-t border-hairline pt-6">
        <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
