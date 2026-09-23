import type {
  ArticleContent,
  SiteSettingsDto,
  UpdateSiteSettingsRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Textarea } from '@coastal-talk-news/ui/textarea';
import {
  SETTINGS_PAGE_INTRO_MAX,
  SETTINGS_PAGE_TITLE_MAX,
} from '@coastal-talk-news/validation/limits';
import { Info } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { TiptapEditor } from '../../components/TiptapEditor.js';
import { useUpdateSettings } from './useUpdateSettings.js';

/** About and Advertise are the same shape, so they share one form. */
export type PageKey = 'about' | 'advertise';

interface PageCopy {
  /** Shown above the form, explaining where this appears to readers. */
  note: string;
  titlePlaceholder: string;
  introPlaceholder: string;
  bodyPlaceholder: string;
  titleFallback: string;
  savedMessage: string;
}

const COPY: Record<PageKey, PageCopy> = {
  about: {
    note: 'This is the About Us page on your website. Leave a field empty and the website falls back to your site name and tagline.',
    titlePlaceholder: 'About Coastal Talk News',
    introPlaceholder:
      'One line introducing the newsroom to a first-time reader.',
    bodyPlaceholder:
      'Tell readers who you are, what you cover and why it matters…',
    titleFallback: 'About {site name}',
    savedMessage: 'About page saved.',
  },
  advertise: {
    note: 'This is the Advertise page on your website. Currently running advertisements are listed underneath whatever you write here.',
    titlePlaceholder: 'Advertise with us',
    introPlaceholder: 'One line on why a business should advertise with you.',
    bodyPlaceholder:
      'Explain your placements, audience and how to get in touch…',
    titleFallback: 'Advertise with us',
    savedMessage: 'Advertise page saved.',
  },
};

interface PageValues {
  title: string;
  intro: string;
  content: ArticleContent | null;
  /** About only — the reader site shows this instead of `content` once the
   * UI-language toggle is set to Kannada, falling back to `content` if empty. */
  contentKannada: ArticleContent | null;
}

function toValues(settings: SiteSettingsDto, page: PageKey): PageValues {
  const isAbout = page === 'about';
  return {
    title: (isAbout ? settings.aboutTitle : settings.advertiseTitle) ?? '',
    intro: (isAbout ? settings.aboutIntro : settings.advertiseIntro) ?? '',
    content: isAbout ? settings.aboutContent : settings.advertiseContent,
    contentKannada: isAbout ? settings.aboutContentKannada : null,
  };
}

function orNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/** An empty editor still yields a document with one blank paragraph. */
function hasText(content: ArticleContent | null): boolean {
  if (!content) return false;
  const walk = (node: { text?: string; content?: unknown[] }): boolean => {
    if (typeof node.text === 'string' && node.text.trim() !== '') return true;
    return (node.content ?? []).some((child) =>
      walk(child as { text?: string; content?: unknown[] }),
    );
  };
  return walk(content as unknown as { content?: unknown[] });
}

export function SettingsPageForm({
  settings,
  page,
}: {
  settings: SiteSettingsDto;
  page: PageKey;
}) {
  const copy = COPY[page];
  const [values, setValues] = useState<PageValues>(() =>
    toValues(settings, page),
  );
  const initial = useRef<PageValues>(toValues(settings, page));
  const mutation = useUpdateSettings();

  useEffect(() => {
    const next = toValues(settings, page);
    setValues(next);
    initial.current = next;
  }, [settings, page]);

  const isAbout = page === 'about';
  const isDirty =
    values.title.trim() !== initial.current.title.trim() ||
    values.intro.trim() !== initial.current.intro.trim() ||
    JSON.stringify(values.content) !==
      JSON.stringify(initial.current.content) ||
    (isAbout &&
      JSON.stringify(values.contentKannada) !==
        JSON.stringify(initial.current.contentKannada));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isDirty) return;

    const body: UpdateSiteSettingsRequest = isAbout
      ? {
          aboutTitle: orNull(values.title),
          aboutIntro: orNull(values.intro),
          aboutContent: hasText(values.content) ? values.content : null,
          aboutContentKannada: hasText(values.contentKannada)
            ? values.contentKannada
            : null,
        }
      : {
          advertiseTitle: orNull(values.title),
          advertiseIntro: orNull(values.intro),
          advertiseContent: hasText(values.content) ? values.content : null,
        };

    mutation.mutate(body, {
      onSuccess: () => toast.success(copy.savedMessage),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="bg-accent-soft flex gap-3 rounded-lg p-4">
        <Info className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
        <p className="text-ink-muted text-sm">{copy.note}</p>
      </div>

      <Field
        label="Page heading"
        htmlFor={`settings-${page}-title`}
        optional
        hint={`Leave empty to use “${copy.titleFallback}”.`}
      >
        <Input
          id={`settings-${page}-title`}
          value={values.title}
          maxLength={SETTINGS_PAGE_TITLE_MAX}
          placeholder={copy.titlePlaceholder}
          onChange={(event) =>
            setValues((current) => ({ ...current, title: event.target.value }))
          }
        />
      </Field>

      <div className="space-y-1.5">
        <label
          htmlFor={`settings-${page}-intro`}
          className="text-ink-muted block text-sm font-medium"
        >
          Introduction
          <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
        </label>
        <Textarea
          id={`settings-${page}-intro`}
          rows={2}
          maxLength={SETTINGS_PAGE_INTRO_MAX}
          showCount
          value={values.intro}
          placeholder={copy.introPlaceholder}
          onChange={(event) =>
            setValues((current) => ({ ...current, intro: event.target.value }))
          }
        />
        <p className="text-ink-subtle text-xs">
          Sits directly under the heading, before the main text.
        </p>
      </div>

      <div className="space-y-1.5">
        <span className="text-ink-muted block text-sm font-medium">
          {isAbout ? 'Page content (English)' : 'Page content'}
          <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
        </span>
        <TiptapEditor
          content={values.content}
          placeholder={copy.bodyPlaceholder}
          onChange={(content) =>
            setValues((current) => ({
              ...current,
              content: content as ArticleContent,
            }))
          }
        />
        <p className="text-ink-subtle text-xs">
          Headings, lists, links and images work the same as in a news article.
          {isAbout && ' Shown when a reader has the site set to English.'}
        </p>
      </div>

      {isAbout && (
        <div className="space-y-1.5">
          <span className="text-ink-muted block text-sm font-medium">
            Page content (Kannada)
            <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
          </span>
          <TiptapEditor
            content={values.contentKannada}
            placeholder="ಸುದ್ದಿ ವಿಭಾಗ ಯಾರು, ಏನನ್ನು ವರದಿ ಮಾಡುತ್ತದೆ ಮತ್ತು ಅದು ಏಕೆ ಮುಖ್ಯ ಎಂಬುದನ್ನು ಓದುಗರಿಗೆ ತಿಳಿಸಿ…"
            onChange={(content) =>
              setValues((current) => ({
                ...current,
                contentKannada: content as ArticleContent,
              }))
            }
          />
          <p className="text-ink-subtle text-xs">
            Shown when a reader has the site set to Kannada. Leave empty and the
            English content above is shown instead.
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          data-shortcut="save"
          loading={mutation.isPending}
          disabled={!isDirty}
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}
