import type {
  SiteSettingsDto,
  UpdateSiteSettingsRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Textarea } from '@coastal-talk-news/ui/textarea';
import {
  SETTINGS_ADDRESS_MAX,
  SETTINGS_EMAIL_MAX,
  SETTINGS_HOURS_MAX,
  SETTINGS_PAGE_INTRO_MAX,
  SETTINGS_PAGE_TITLE_MAX,
  SETTINGS_PHONE_MAX,
} from '@coastal-talk-news/validation/limits';
import { Info } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { useUpdateSettings } from './useUpdateSettings.js';

interface ContactValues {
  title: string;
  intro: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
}

function toValues(settings: SiteSettingsDto): ContactValues {
  return {
    title: settings.contactTitle ?? '',
    intro: settings.contactIntro ?? '',
    email: settings.contactEmail ?? '',
    phone: settings.contactPhone ?? '',
    address: settings.contactAddress ?? '',
    hours: settings.contactHours ?? '',
  };
}

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function SettingsContactForm({
  settings,
}: {
  settings: SiteSettingsDto;
}) {
  const [values, setValues] = useState<ContactValues>(() => toValues(settings));
  const initial = useRef<ContactValues>(toValues(settings));
  const mutation = useUpdateSettings();

  useEffect(() => {
    const next = toValues(settings);
    setValues(next);
    initial.current = next;
  }, [settings]);

  const isDirty = (Object.keys(values) as Array<keyof ContactValues>).some(
    (key) => values[key].trim() !== initial.current[key].trim(),
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isDirty) return;

    const body: UpdateSiteSettingsRequest = {
      contactTitle: orNull(values.title),
      contactIntro: orNull(values.intro),
      contactEmail: orNull(values.email),
      contactPhone: orNull(values.phone),
      contactAddress: orNull(values.address),
      contactHours: orNull(values.hours),
    };

    mutation.mutate(body, {
      onSuccess: () => toast.success('Contact page saved.'),
    });
  }

  function set(key: keyof ContactValues) {
    return (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [key]: event.target.value }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="bg-accent-soft flex gap-3 rounded-lg p-4">
        <Info className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-ink-muted text-sm">
          These are your newsroom&rsquo;s contact details. They fill the Contact
          Us page, and the same email, phone and address also appear in the
          website footer and on the Advertise page.
        </p>
      </div>

      <Field
        label="Page heading"
        htmlFor="settings-contact-title"
        optional
        hint="Leave empty to use “Contact”."
      >
        <Input
          id="settings-contact-title"
          value={values.title}
          maxLength={SETTINGS_PAGE_TITLE_MAX}
          placeholder="Contact"
          onChange={set('title')}
        />
      </Field>

      <div className="space-y-1.5">
        <label
          htmlFor="settings-contact-intro"
          className="text-ink-muted block text-sm font-medium"
        >
          Introduction
          <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
        </label>
        <Textarea
          id="settings-contact-intro"
          rows={2}
          maxLength={SETTINGS_PAGE_INTRO_MAX}
          showCount
          value={values.intro}
          placeholder="Tell readers what to get in touch about — news tips, corrections, feedback."
          onChange={set('intro')}
        />
      </div>

      <fieldset className="border-hairline space-y-4 rounded-lg border p-4">
        <legend className="text-ink px-1 text-sm font-medium">
          Contact details
        </legend>

        <Field label="Email" htmlFor="settings-contact-email" optional>
          <Input
            id="settings-contact-email"
            type="email"
            value={values.email}
            maxLength={SETTINGS_EMAIL_MAX}
            placeholder="coastaltalknews@gmail.com"
            onChange={set('email')}
          />
        </Field>

        <Field label="Phone" htmlFor="settings-contact-phone" optional>
          <Input
            id="settings-contact-phone"
            value={values.phone}
            maxLength={SETTINGS_PHONE_MAX}
            placeholder="+91 99454 26012"
            onChange={set('phone')}
          />
        </Field>

        <div className="space-y-1.5">
          <label
            htmlFor="settings-contact-address"
            className="text-ink-muted block text-sm font-medium"
          >
            Address
            <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
          </label>
          <Textarea
            id="settings-contact-address"
            rows={3}
            maxLength={SETTINGS_ADDRESS_MAX}
            showCount
            value={values.address}
            placeholder="Office address, town and pin code"
            onChange={set('address')}
          />
        </div>

        <Field
          label="Office hours"
          htmlFor="settings-contact-hours"
          optional
          hint="Shown beside the phone number, so readers know when to call."
        >
          <Input
            id="settings-contact-hours"
            value={values.hours}
            maxLength={SETTINGS_HOURS_MAX}
            placeholder="Monday to Saturday, 9am – 6pm"
            onChange={set('hours')}
          />
        </Field>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit" loading={mutation.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
