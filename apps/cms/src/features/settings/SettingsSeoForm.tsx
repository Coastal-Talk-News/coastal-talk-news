import {
  defaultSiteDescription,
  type SiteSettingsDto,
  type UpdateSiteSettingsRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Textarea } from '@coastal-talk-news/ui/textarea';
import {
  SETTINGS_META_DESCRIPTION_MAX,
  SETTINGS_SEO_TITLE_MAX,
  SETTINGS_SITE_VERIFICATION_MAX,
} from '@coastal-talk-news/validation/limits';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { SettingsImageField } from './SettingsImageField.js';
import { useUpdateSettings } from './useUpdateSettings.js';
import { SettingsNote } from './SettingsNote.js';

interface SeoValues {
  defaultSeoTitle: string;
  defaultMetaDescription: string;
  defaultOgImage: SiteSettingsDto['defaultOgImage'];
  googleSiteVerification: string;
}

function toValues(settings: SiteSettingsDto): SeoValues {
  return {
    defaultSeoTitle: settings.defaultSeoTitle ?? '',
    defaultMetaDescription: settings.defaultMetaDescription ?? '',
    defaultOgImage: settings.defaultOgImage,
    googleSiteVerification: settings.googleSiteVerification ?? '',
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
      (initial.current.defaultOgImage?.id ?? null) ||
    values.googleSiteVerification.trim() !==
      initial.current.googleSiteVerification.trim();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isDirty) return;

    const body: UpdateSiteSettingsRequest = {
      defaultSeoTitle: orNull(values.defaultSeoTitle),
      defaultMetaDescription: orNull(values.defaultMetaDescription),
      defaultOgImageId: values.defaultOgImage?.id ?? null,
      googleSiteVerification: orNull(values.googleSiteVerification),
    };
    mutation.mutate(body, {
      onSuccess: () => toast.success('SEO settings saved.'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <SettingsNote>
        These defaults are used for pages that don&rsquo;t set their own title,
        description, or preview image — an article&rsquo;s own SEO fields always
        take priority over these.
      </SettingsNote>

      <Field
        label="Default Site Title"
        htmlFor="settings-seo-title"
        optional
        hint={`The homepage's title in search results. Left empty, it is the site name, "${settings.siteName}".`}
      >
        <Input
          id="settings-seo-title"
          value={values.defaultSeoTitle}
          maxLength={SETTINGS_SEO_TITLE_MAX}
          placeholder={settings.siteName}
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
        <Textarea
          id="settings-seo-description"
          rows={3}
          maxLength={SETTINGS_META_DESCRIPTION_MAX}
          showCount
          value={values.defaultMetaDescription}
          // What the homepage uses while this is empty: the tagline, else a
          // built-in sentence (the reader site's siteDescription).
          placeholder={
            settings.tagline?.trim() ||
            defaultSiteDescription(settings.siteName)
          }
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              defaultMetaDescription: event.target.value,
            }))
          }
        />
        <p className="text-ink-subtle text-xs">
          The homepage&rsquo;s description in search results, and the line under
          its heading. Left empty, the sentence shown above is used. About
          150&ndash;160 characters is recommended.
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

      <Field
        label="Google Search Console Verification Code"
        htmlFor="settings-google-verification"
        optional
        hint="From Search Console's HTML tag verification method. Paste the code, or the whole meta tag — only the code is kept. The tag is added to every page of the website, and removed again if you clear this."
      >
        <Input
          id="settings-google-verification"
          value={values.googleSiteVerification}
          maxLength={SETTINGS_SITE_VERIFICATION_MAX}
          placeholder="e.g. a1B2c3D4…"
          spellCheck={false}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              googleSiteVerification: event.target.value,
            }))
          }
        />
      </Field>

      <div className="flex justify-end border-t border-hairline pt-6">
        <Button
          type="submit"
          data-shortcut="save"
          loading={mutation.isPending}
          disabled={!isDirty}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
