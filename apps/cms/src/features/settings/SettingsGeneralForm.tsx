import type {
  SiteSettingsDto,
  UpdateSiteSettingsRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Link2, Mail, MapPin, Phone } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { SettingsImageField } from './SettingsImageField.js';
import { useUpdateSettings } from './useUpdateSettings.js';

// Mirrors packages/validation/src/settings.ts — the CMS doesn't depend on the
// validation package (see ArticleFormPage's identical local constants), so
// these are kept in sync by hand.
const SITE_NAME_MAX = 120;
const TAGLINE_MAX = 160;
const DESCRIPTION_MAX = 160;
const EMAIL_MAX = 254;
const PHONE_MAX = 32;
const ADDRESS_MAX = 200;

interface GeneralValues {
  siteName: string;
  tagline: string;
  description: string;
  logo: SiteSettingsDto['logo'];
  favicon: SiteSettingsDto['favicon'];
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  xUrl: string;
}

function toValues(settings: SiteSettingsDto): GeneralValues {
  return {
    siteName: settings.siteName,
    tagline: settings.tagline ?? '',
    description: settings.description ?? '',
    logo: settings.logo,
    favicon: settings.favicon,
    contactEmail: settings.contactEmail ?? '',
    contactPhone: settings.contactPhone ?? '',
    contactAddress: settings.contactAddress ?? '',
    facebookUrl: settings.facebookUrl ?? '',
    instagramUrl: settings.instagramUrl ?? '',
    youtubeUrl: settings.youtubeUrl ?? '',
    xUrl: settings.xUrl ?? '',
  };
}

/** '' -> null for an optional field; otherwise the trimmed value. */
function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

interface SettingsGeneralFormProps {
  settings: SiteSettingsDto;
}

export function SettingsGeneralForm({ settings }: SettingsGeneralFormProps) {
  const [values, setValues] = useState<GeneralValues>(() => toValues(settings));
  const [touched, setTouched] = useState(false);
  const initial = useRef<GeneralValues>(toValues(settings));
  const mutation = useUpdateSettings();

  useEffect(() => {
    const next = toValues(settings);
    setValues(next);
    initial.current = next;
    setTouched(false);
  }, [settings]);

  const trimmedName = values.siteName.trim();
  const trimmedTagline = values.tagline.trim();
  const trimmedEmail = values.contactEmail.trim();

  const isDirty =
    trimmedName !== initial.current.siteName.trim() ||
    trimmedTagline !== initial.current.tagline.trim() ||
    values.description.trim() !== initial.current.description.trim() ||
    (values.logo?.id ?? null) !== (initial.current.logo?.id ?? null) ||
    (values.favicon?.id ?? null) !== (initial.current.favicon?.id ?? null) ||
    trimmedEmail !== initial.current.contactEmail.trim() ||
    values.contactPhone.trim() !== initial.current.contactPhone.trim() ||
    values.contactAddress.trim() !== initial.current.contactAddress.trim() ||
    values.facebookUrl.trim() !== initial.current.facebookUrl.trim() ||
    values.instagramUrl.trim() !== initial.current.instagramUrl.trim() ||
    values.youtubeUrl.trim() !== initial.current.youtubeUrl.trim() ||
    values.xUrl.trim() !== initial.current.xUrl.trim();

  const nameError =
    touched && !trimmedName ? 'Website name is required.' : undefined;
  const taglineError =
    touched && !trimmedTagline ? 'Tagline is required.' : undefined;
  const logoError = touched && !values.logo ? 'Upload a logo.' : undefined;
  const faviconError =
    touched && !values.favicon ? 'Upload a favicon.' : undefined;
  const emailError =
    touched && !trimmedEmail ? 'Contact email is required.' : undefined;

  const canSave =
    Boolean(trimmedName) &&
    Boolean(trimmedTagline) &&
    Boolean(values.logo) &&
    Boolean(values.favicon) &&
    Boolean(trimmedEmail) &&
    isDirty;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!canSave) return;

    const body: UpdateSiteSettingsRequest = {
      siteName: trimmedName,
      tagline: trimmedTagline,
      description: orNull(values.description),
      logoMediaId: values.logo?.id ?? null,
      faviconMediaId: values.favicon?.id ?? null,
      contactEmail: trimmedEmail,
      contactPhone: orNull(values.contactPhone),
      contactAddress: orNull(values.contactAddress),
      facebookUrl: orNull(values.facebookUrl),
      instagramUrl: orNull(values.instagramUrl),
      youtubeUrl: orNull(values.youtubeUrl),
      xUrl: orNull(values.xUrl),
    };
    mutation.mutate(body, {
      onSuccess: () => toast.success('General settings saved.'),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Field
        label="Website Name"
        htmlFor="settings-site-name"
        required
        error={nameError}
      >
        <Input
          id="settings-site-name"
          value={values.siteName}
          maxLength={SITE_NAME_MAX}
          placeholder="Coastal Talk News"
          invalid={Boolean(nameError)}
          onBlur={() => setTouched(true)}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              siteName: event.target.value,
            }))
          }
        />
      </Field>

      <Field
        label="Tagline"
        htmlFor="settings-tagline"
        required
        error={taglineError}
      >
        <Input
          id="settings-tagline"
          value={values.tagline}
          maxLength={TAGLINE_MAX}
          placeholder="Your daily dose of coastal news"
          invalid={Boolean(taglineError)}
          onBlur={() => setTouched(true)}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              tagline: event.target.value,
            }))
          }
        />
      </Field>

      <div className="space-y-1.5">
        <label
          htmlFor="settings-description"
          className="block text-sm font-medium text-ink-muted"
        >
          Description
          <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
        </label>
        <textarea
          id="settings-description"
          rows={3}
          maxLength={DESCRIPTION_MAX}
          value={values.description}
          placeholder="A short description of your website."
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          className="ring-hairline focus:ring-accent w-full resize-none rounded-lg bg-surface px-3 py-2.5 text-sm ring-1 transition-shadow placeholder:text-ink-subtle hover:ring-ink-subtle/40 focus:ring-2 focus:outline-none"
        />
        <p className="text-ink-subtle text-right text-xs tabular-nums">
          {values.description.length}/{DESCRIPTION_MAX}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <SettingsImageField
          label="Logo"
          required
          hint="Recommended size: 200 × 60px. Supports PNG, SVG."
          value={values.logo}
          error={logoError}
          onInteract={() => setTouched(true)}
          onChange={(logo) => setValues((current) => ({ ...current, logo }))}
        />
        <SettingsImageField
          label="Favicon"
          required
          hint="Recommended size: 32 × 32px. Supports PNG, ICO."
          value={values.favicon}
          error={faviconError}
          onInteract={() => setTouched(true)}
          onChange={(favicon) =>
            setValues((current) => ({ ...current, favicon }))
          }
        />
      </div>

      <Field
        label="Contact Email"
        htmlFor="settings-email"
        required
        error={emailError}
      >
        <Input
          id="settings-email"
          type="email"
          value={values.contactEmail}
          maxLength={EMAIL_MAX}
          placeholder="contact@coastaltalknews.com"
          invalid={Boolean(emailError)}
          icon={<Mail className="size-4" aria-hidden />}
          onBlur={() => setTouched(true)}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              contactEmail: event.target.value,
            }))
          }
        />
      </Field>

      <Field label="Contact Phone" htmlFor="settings-phone" optional>
        <Input
          id="settings-phone"
          type="tel"
          value={values.contactPhone}
          maxLength={PHONE_MAX}
          placeholder="+91 00000 00000"
          icon={<Phone className="size-4" aria-hidden />}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              contactPhone: event.target.value,
            }))
          }
        />
      </Field>

      <Field label="Contact Address" htmlFor="settings-address" optional>
        <Input
          id="settings-address"
          value={values.contactAddress}
          maxLength={ADDRESS_MAX}
          placeholder="Street, City, State, PIN"
          icon={<MapPin className="size-4" aria-hidden />}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              contactAddress: event.target.value,
            }))
          }
        />
      </Field>

      <div className="space-y-4">
        <span className="text-ink-muted block text-sm font-medium">
          Social Links
        </span>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Facebook" htmlFor="settings-facebook" optional>
            <Input
              id="settings-facebook"
              type="url"
              value={values.facebookUrl}
              placeholder="https://facebook.com/yourpage"
              icon={<Link2 className="size-4" aria-hidden />}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  facebookUrl: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Instagram" htmlFor="settings-instagram" optional>
            <Input
              id="settings-instagram"
              type="url"
              value={values.instagramUrl}
              placeholder="https://instagram.com/yourpage"
              icon={<Link2 className="size-4" aria-hidden />}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  instagramUrl: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="YouTube" htmlFor="settings-youtube" optional>
            <Input
              id="settings-youtube"
              type="url"
              value={values.youtubeUrl}
              placeholder="https://youtube.com/@yourchannel"
              icon={<Link2 className="size-4" aria-hidden />}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  youtubeUrl: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="X (Twitter)" htmlFor="settings-x" optional>
            <Input
              id="settings-x"
              type="url"
              value={values.xUrl}
              placeholder="https://x.com/yourhandle"
              icon={<Link2 className="size-4" aria-hidden />}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  xUrl: event.target.value,
                }))
              }
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-end border-t border-hairline pt-6">
        <Button type="submit" loading={mutation.isPending} disabled={!canSave}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
