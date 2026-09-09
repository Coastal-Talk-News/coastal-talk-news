import type {
  BreakingNewsDto,
  CreateBreakingNewsRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Sheet } from '@coastal-talk-news/ui/sheet';
import { Toggle } from '@coastal-talk-news/ui/toggle';
import { Calendar, Clock, Link as LinkIcon } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

const HEADLINE_MAX = 150;

interface FormValues {
  headline: string;
  articleUrl: string;
  startDate: string;
  startTime: string;
  hasEnd: boolean;
  endDate: string;
  endTime: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function splitIso(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Native date/time inputs are local-time strings; combine and convert to UTC. */
function combineToIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const local = new Date(`${date}T${time}`);
  return Number.isNaN(local.getTime()) ? null : local.toISOString();
}

function defaultStart(): { date: string; time: string } {
  const now = new Date();
  // Round up to the next 5 minutes so the default doesn't read as "in the past".
  now.setMinutes(now.getMinutes() + (5 - (now.getMinutes() % 5 || 5)));
  return splitIso(now.toISOString());
}

function toValues(item: BreakingNewsDto | null): FormValues {
  if (!item) {
    const start = defaultStart();
    return {
      headline: '',
      articleUrl: '',
      startDate: start.date,
      startTime: start.time,
      hasEnd: true,
      endDate: '',
      endTime: '',
    };
  }
  const start = splitIso(item.startAt);
  const end = item.endAt ? splitIso(item.endAt) : null;
  return {
    headline: item.headline,
    articleUrl: item.articleUrl,
    startDate: start.date,
    startTime: start.time,
    hasEnd: end !== null,
    endDate: end?.date ?? '',
    endTime: end?.time ?? '',
  };
}

interface BreakingNewsSheetProps {
  open: boolean;
  editing: BreakingNewsDto | null;
  saving: boolean;
  serverError: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateBreakingNewsRequest) => void;
}

export function BreakingNewsSheet({
  open,
  editing,
  saving,
  serverError,
  onOpenChange,
  onSubmit,
}: BreakingNewsSheetProps) {
  const [values, setValues] = useState<FormValues>(() => toValues(editing));
  const [touched, setTouched] = useState(false);
  const headlineRef = useRef<HTMLInputElement>(null);
  const initial = useRef<FormValues>(toValues(editing));

  useEffect(() => {
    if (!open) return;
    const next = toValues(editing);
    setValues(next);
    initial.current = next;
    setTouched(false);
    const timer = setTimeout(() => headlineRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, editing]);

  const trimmedHeadline = values.headline.trim();
  const startIso = combineToIso(values.startDate, values.startTime);
  const endIso = values.hasEnd
    ? combineToIso(values.endDate, values.endTime)
    : null;
  const windowValid =
    Boolean(startIso) &&
    (!values.hasEnd ||
      Boolean(endIso && startIso && new Date(endIso) > new Date(startIso)));

  const isDirty =
    trimmedHeadline !== initial.current.headline.trim() ||
    values.articleUrl.trim() !== initial.current.articleUrl.trim() ||
    values.startDate !== initial.current.startDate ||
    values.startTime !== initial.current.startTime ||
    values.hasEnd !== initial.current.hasEnd ||
    values.endDate !== initial.current.endDate ||
    values.endTime !== initial.current.endTime;

  const headlineError =
    touched && !trimmedHeadline ? 'Headline is required.' : undefined;
  const startError =
    touched && !startIso ? 'Start date and time are required.' : undefined;
  const endError =
    touched && values.hasEnd
      ? !endIso
        ? 'End date and time are required, or turn this off.'
        : startIso && new Date(endIso) <= new Date(startIso)
          ? 'End must be after start.'
          : undefined
      : undefined;

  const canSubmit =
    Boolean(trimmedHeadline) && windowValid && (isDirty || !editing);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit || !startIso) return;
    onSubmit({
      headline: trimmedHeadline,
      articleUrl: values.articleUrl.trim() || undefined,
      startAt: startIso,
      endAt: values.hasEnd ? endIso : null,
    });
  }

  // Closing with unsaved edits asks first, so a stray Esc cannot discard work.
  function requestClose(next: boolean) {
    if (next) return onOpenChange(true);
    if (isDirty && !window.confirm('Discard your unsaved changes?')) return;
    onOpenChange(false);
  }

  const liveNow = startIso
    ? new Date() >= new Date(startIso) &&
      (!endIso || new Date() <= new Date(endIso))
    : false;
  const scheduled = startIso ? new Date(startIso) > new Date() : false;

  return (
    <Sheet
      open={open}
      onOpenChange={requestClose}
      title={editing ? 'Edit Breaking News' : 'Add Breaking News'}
      description="Manage live breaking news updates. These appear in the breaking news ticker on the website."
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => requestClose(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="breaking-news-form"
            className="flex-1"
            loading={saving}
            disabled={!canSubmit}
          >
            {editing ? 'Save changes' : 'Save Breaking News'}
          </Button>
        </div>
      }
    >
      <form
        id="breaking-news-form"
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
      >
        <Field
          label="Headline"
          htmlFor="breaking-news-headline"
          required
          error={headlineError}
          hint={
            headlineError
              ? undefined
              : 'Keep it short and impactful. This will appear in the ticker.'
          }
        >
          <Input
            id="breaking-news-headline"
            ref={headlineRef}
            value={values.headline}
            maxLength={HEADLINE_MAX}
            placeholder="Enter breaking news headline"
            invalid={Boolean(headlineError)}
            onBlur={() => setTouched(true)}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                headline: event.target.value,
              }))
            }
          />
          <p className="text-ink-subtle text-right text-xs tabular-nums">
            {values.headline.length}/{HEADLINE_MAX}
          </p>
        </Field>

        <Field
          label="Link"
          htmlFor="breaking-news-link"
          optional
          hint="Link to the related news article or external source."
        >
          <Input
            id="breaking-news-link"
            type="url"
            value={values.articleUrl}
            placeholder="https://"
            icon={<LinkIcon className="size-4" aria-hidden />}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                articleUrl: event.target.value,
              }))
            }
          />
        </Field>

        <Field
          label="Start Date & Time"
          htmlFor="breaking-news-start-date"
          required
          error={startError}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="breaking-news-start-date"
              type="date"
              value={values.startDate}
              icon={<Calendar className="size-4" aria-hidden />}
              invalid={Boolean(startError)}
              onBlur={() => setTouched(true)}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  startDate: event.target.value,
                }))
              }
            />
            <Input
              type="time"
              aria-label="Start time"
              value={values.startTime}
              icon={<Clock className="size-4" aria-hidden />}
              invalid={Boolean(startError)}
              onBlur={() => setTouched(true)}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  startTime: event.target.value,
                }))
              }
            />
          </div>
        </Field>

        <div className="border-hairline rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-ink text-sm font-medium">
                Set end date and time
              </p>
              <p className="text-ink-muted mt-0.5 text-xs">
                {values.hasEnd
                  ? 'Turns off automatically at the time below.'
                  : 'Stays live with no automatic end — take it down any time with Delete.'}
              </p>
            </div>
            <Toggle
              checked={values.hasEnd}
              onCheckedChange={(hasEnd) =>
                setValues((current) => ({ ...current, hasEnd }))
              }
              aria-label="Set end date and time"
            />
          </div>
        </div>

        {values.hasEnd && (
          <Field
            label="End Date & Time"
            htmlFor="breaking-news-end-date"
            required
            error={endError}
          >
            <div className="grid grid-cols-2 gap-3">
              <Input
                id="breaking-news-end-date"
                type="date"
                value={values.endDate}
                icon={<Calendar className="size-4" aria-hidden />}
                invalid={Boolean(endError)}
                onBlur={() => setTouched(true)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
              <Input
                type="time"
                aria-label="End time"
                value={values.endTime}
                icon={<Clock className="size-4" aria-hidden />}
                invalid={Boolean(endError)}
                onBlur={() => setTouched(true)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
              />
            </div>
          </Field>
        )}

        <div className="border-hairline rounded-lg border p-4">
          <p className="text-ink text-sm font-medium">
            {liveNow ? 'Live now' : scheduled ? 'Scheduled' : 'Not live'}
          </p>
          <p className="text-ink-muted mt-0.5 text-xs">
            {values.hasEnd
              ? "Status isn't set manually — it follows the schedule above, turning on at Start and off at End."
              : "Status isn't set manually — it turns on at Start and then stays on until you delete this item."}
          </p>
        </div>

        {serverError && (
          <p
            role="alert"
            className="animate-fade-in rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger-text"
          >
            {serverError}
          </p>
        )}
      </form>
    </Sheet>
  );
}
