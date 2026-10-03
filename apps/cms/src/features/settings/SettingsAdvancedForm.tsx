import type { SiteSettingsDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import {
  SETTINGS_ARTICLE_CACHE_MINUTES_MAX,
  SETTINGS_ARTICLE_CACHE_MINUTES_MIN,
} from '@coastal-talk-news/validation/limits';
import { useMutation } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ApiError } from '../../api/client.js';
import { settingsApi } from '../../api/settings.js';
import { useUpdateSettings } from './useUpdateSettings.js';

/** Minutes -> "1 day 3 hours 3 minutes", skipping any unit that's zero. */
function describeDuration(totalMinutes: number): string {
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  return [
    days > 0 && `${days} day${days === 1 ? '' : 's'}`,
    hours > 0 && `${hours} hour${hours === 1 ? '' : 's'}`,
    minutes > 0 && `${minutes} minute${minutes === 1 ? '' : 's'}`,
  ]
    .filter(Boolean)
    .join(' ');
}

interface SettingsAdvancedFormProps {
  settings: SiteSettingsDto;
}

export function SettingsAdvancedForm({ settings }: SettingsAdvancedFormProps) {
  const [minutes, setMinutes] = useState(() =>
    String(settings.articleCacheMinutes),
  );
  const [touched, setTouched] = useState(false);
  const mutation = useUpdateSettings();
  const clearCache = useMutation({
    mutationFn: () => settingsApi.clearArticleCache(),
    onSuccess: () =>
      toast.success('Article cache cleared', {
        description:
          'Every article page will reload from scratch on its next visit.',
      }),
    onError: (error) =>
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Could not clear the article cache.',
      ),
  });

  useEffect(() => {
    setMinutes(String(settings.articleCacheMinutes));
    setTouched(false);
  }, [settings.articleCacheMinutes]);

  const parsed = Number(minutes);
  const isValid =
    minutes.trim() !== '' &&
    Number.isInteger(parsed) &&
    parsed >= SETTINGS_ARTICLE_CACHE_MINUTES_MIN &&
    parsed <= SETTINGS_ARTICLE_CACHE_MINUTES_MAX;
  const isDirty = parsed !== settings.articleCacheMinutes;
  const canSave = isValid && isDirty;

  const error =
    touched && !isValid
      ? `Enter a whole number between ${SETTINGS_ARTICLE_CACHE_MINUTES_MIN} and ${SETTINGS_ARTICLE_CACHE_MINUTES_MAX}.`
      : undefined;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!canSave) return;
    mutation.mutate(
      { articleCacheMinutes: parsed },
      { onSuccess: () => toast.success('Cache duration saved.') },
    );
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleSubmit} className="max-w-md space-y-6" noValidate>
        <div>
          <h2 className="text-ink text-lg font-semibold">Article caching</h2>
          <p className="text-ink-muted mt-0.5 text-sm">
            Reduces load on the server by reusing a recently-viewed article page
            for a while, instead of rebuilding it on every visit. Publishing or
            editing an article always shows the change right away, regardless of
            this setting.
          </p>
        </div>

        <Field
          label="Cache duration (minutes)"
          htmlFor="settings-article-cache-minutes"
          required
          error={error}
          hint={
            !error && isValid
              ? `Articles stay cached for ${describeDuration(parsed)}.`
              : undefined
          }
        >
          <Input
            id="settings-article-cache-minutes"
            type="number"
            inputMode="numeric"
            min={SETTINGS_ARTICLE_CACHE_MINUTES_MIN}
            max={SETTINGS_ARTICLE_CACHE_MINUTES_MAX}
            step={1}
            value={minutes}
            invalid={Boolean(error)}
            onBlur={() => setTouched(true)}
            onChange={(event) => setMinutes(event.target.value)}
          />
        </Field>

        <div className="flex justify-end border-t border-hairline pt-6">
          <Button
            type="submit"
            data-shortcut="save"
            loading={mutation.isPending}
            disabled={!canSave}
          >
            Save Changes
          </Button>
        </div>
      </form>

      <div className="max-w-md space-y-4 border-t border-hairline pt-8">
        <div>
          <h2 className="text-ink text-lg font-semibold">
            Clear article cache
          </h2>
          <p className="text-ink-muted mt-0.5 text-sm">
            Forces every article page to reload from scratch right now, instead
            of waiting out its cache window. Safe to use any time - nothing is
            deleted, pages simply rebuild on their next visit.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          loading={clearCache.isPending}
          onClick={() => clearCache.mutate()}
        >
          <RefreshCw className="size-4" aria-hidden />
          Clear article cache
        </Button>
      </div>
    </div>
  );
}
