import type {
  AdvertisementDto,
  CreateAdvertisementRequest,
  MediaSummaryDto,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Sheet } from '@coastal-talk-news/ui/sheet';
import { Calendar, Clock, ImagePlus, Link as LinkIcon, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MediaPickerDialog } from '../media/MediaPickerDialog.js';

const TITLE_MAX = 120;

interface FormValues {
  advertiserName: string;
  image: MediaSummaryDto | null;
  destinationUrl: string;
  priority: string;
  startDate: string;
  startTime: string;
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

function toValues(item: AdvertisementDto | null): FormValues {
  if (!item) {
    const start = defaultStart();
    return {
      advertiserName: '',
      image: null,
      destinationUrl: '',
      priority: '0',
      startDate: start.date,
      startTime: start.time,
      endDate: '',
      endTime: '',
    };
  }
  const start = splitIso(item.startAt);
  const end = splitIso(item.endAt);
  return {
    advertiserName: item.advertiserName,
    image: item.image,
    destinationUrl: item.destinationUrl,
    priority: String(item.priority),
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
  };
}

interface AdvertisementSheetProps {
  open: boolean;
  editing: AdvertisementDto | null;
  saving: boolean;
  serverError: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateAdvertisementRequest) => void;
}

export function AdvertisementSheet({
  open,
  editing,
  saving,
  serverError,
  onOpenChange,
  onSubmit,
}: AdvertisementSheetProps) {
  const [values, setValues] = useState<FormValues>(() => toValues(null));
  const [touched, setTouched] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const initial = useRef<FormValues>(toValues(null));

  useEffect(() => {
    if (!open) return;
    const next = toValues(editing);
    setValues(next);
    initial.current = next;
    setTouched(false);
    const timer = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, editing]);

  const trimmedTitle = values.advertiserName.trim();
  const trimmedUrl = values.destinationUrl.trim();
  const startIso = combineToIso(values.startDate, values.startTime);
  const endIso = combineToIso(values.endDate, values.endTime);
  const windowValid = Boolean(
    startIso && endIso && new Date(endIso) > new Date(startIso),
  );
  const priorityValid = values.priority === '' || /^\d+$/.test(values.priority);

  const isDirty =
    trimmedTitle !== initial.current.advertiserName.trim() ||
    (values.image?.id ?? null) !== (initial.current.image?.id ?? null) ||
    trimmedUrl !== initial.current.destinationUrl.trim() ||
    values.priority !== initial.current.priority ||
    values.startDate !== initial.current.startDate ||
    values.startTime !== initial.current.startTime ||
    values.endDate !== initial.current.endDate ||
    values.endTime !== initial.current.endTime;

  const titleError =
    touched && !trimmedTitle ? 'Title is required.' : undefined;
  const imageError = touched && !values.image ? 'Choose an image.' : undefined;
  const urlError = touched && !trimmedUrl ? 'Link URL is required.' : undefined;
  const startError =
    touched && !startIso ? 'Start date and time are required.' : undefined;
  const endError = touched
    ? !endIso
      ? 'End date and time are required.'
      : !windowValid
        ? 'End must be after start.'
        : undefined
    : undefined;

  const canSubmit =
    Boolean(trimmedTitle) &&
    Boolean(values.image) &&
    Boolean(trimmedUrl) &&
    windowValid &&
    priorityValid &&
    (isDirty || !editing);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit || !values.image || !startIso || !endIso) return;
    onSubmit({
      advertiserName: trimmedTitle,
      mediaId: values.image.id,
      destinationUrl: trimmedUrl,
      priority: values.priority === '' ? 0 : Number(values.priority),
      startAt: startIso,
      endAt: endIso,
    });
  }

  // Closing with unsaved edits asks first, so a stray Esc cannot discard work.
  function requestClose(next: boolean) {
    if (next) return onOpenChange(true);
    if (isDirty && !window.confirm('Discard your unsaved changes?')) return;
    onOpenChange(false);
  }

  const liveNow =
    startIso && endIso
      ? new Date() >= new Date(startIso) && new Date() <= new Date(endIso)
      : false;
  const scheduled = startIso ? new Date(startIso) > new Date() : false;

  return (
    <Sheet
      open={open}
      onOpenChange={requestClose}
      title={editing ? 'Edit Advertisement' : 'Add Advertisement'}
      description="Manage banner advertisements on your website."
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
            form="advertisement-form"
            className="flex-1"
            loading={saving}
            disabled={!canSubmit}
          >
            {editing ? 'Save changes' : 'Save Advertisement'}
          </Button>
        </div>
      }
    >
      <form
        id="advertisement-form"
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
      >
        <Field
          label="Title"
          htmlFor="advertisement-title"
          required
          error={titleError}
          hint={titleError ? undefined : 'This is for internal reference only.'}
        >
          <Input
            id="advertisement-title"
            ref={titleRef}
            value={values.advertiserName}
            maxLength={TITLE_MAX}
            placeholder="Enter advertisement title (e.g., Brand name)"
            invalid={Boolean(titleError)}
            onBlur={() => setTouched(true)}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                advertiserName: event.target.value,
              }))
            }
          />
        </Field>

        <div className="space-y-1.5">
          <span className="text-ink-muted block text-sm font-medium">
            Image<span className="ml-0.5 text-danger">*</span>
          </span>

          {values.image ? (
            <div className="border-hairline flex items-center gap-3 rounded-lg border p-3">
              <img
                src={values.image.url}
                alt=""
                width={64}
                height={48}
                className="h-12 w-16 shrink-0 rounded-md object-cover"
              />
              <p className="text-ink-muted min-w-0 flex-1 truncate text-sm">
                {values.image.width}×{values.image.height}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPickerOpen(true)}
              >
                Change
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label="Remove image"
                onClick={() =>
                  setValues((current) => ({ ...current, image: null }))
                }
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className={`border-hairline bg-surface-sunken hover:border-accent hover:bg-accent-soft flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors ${imageError ? 'border-danger' : ''}`}
            >
              <span className="text-ink-subtle bg-surface grid size-10 shrink-0 place-items-center rounded-full">
                <ImagePlus className="size-5" aria-hidden />
              </span>
              <span className="text-sm">
                <span className="text-ink-muted block font-medium">
                  Click to upload an image
                </span>
                <span className="text-ink-subtle block text-xs">
                  Recommended size: 1200 × 628px. Supports JPG, PNG, WebP.
                </span>
              </span>
            </button>
          )}
          {imageError && (
            <p
              role="alert"
              className="animate-fade-in text-danger-text text-xs"
            >
              {imageError}
            </p>
          )}
        </div>

        <Field
          label="Link URL"
          htmlFor="advertisement-link"
          required
          error={urlError}
          hint={urlError ? undefined : "Link to the advertiser's website."}
        >
          <Input
            id="advertisement-link"
            type="url"
            value={values.destinationUrl}
            placeholder="https://"
            invalid={Boolean(urlError)}
            icon={<LinkIcon className="size-4" aria-hidden />}
            onBlur={() => setTouched(true)}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                destinationUrl: event.target.value,
              }))
            }
          />
        </Field>

        <Field
          label="Priority"
          htmlFor="advertisement-priority"
          optional
          error={
            touched && !priorityValid
              ? 'Priority must be a whole number.'
              : undefined
          }
          hint="Higher priority ads are dealt into the more prominent zones first. Leave at 0 for standard priority."
        >
          <Input
            id="advertisement-priority"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={values.priority}
            invalid={touched && !priorityValid}
            onBlur={() => setTouched(true)}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                priority: event.target.value,
              }))
            }
          />
        </Field>

        <Field
          label="Start Date & Time"
          htmlFor="advertisement-start-date"
          required
          error={startError}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="advertisement-start-date"
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

        <Field
          label="End Date & Time"
          htmlFor="advertisement-end-date"
          required
          error={endError}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="advertisement-end-date"
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

        <div className="border-hairline rounded-lg border p-4">
          <p className="text-ink text-sm font-medium">
            {liveNow ? 'Live now' : scheduled ? 'Scheduled' : 'Not live'}
          </p>
          <p className="text-ink-muted mt-0.5 text-xs">
            Status isn&rsquo;t set manually — it follows the schedule above,
            turning on at Start and off at End.
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

      <MediaPickerDialog
        open={pickerOpen}
        selectedId={values.image?.id ?? null}
        onOpenChange={setPickerOpen}
        onSelect={(asset) => {
          setValues((current) => ({
            ...current,
            image: asset
              ? {
                  id: asset.id,
                  url: asset.url,
                  width: asset.width,
                  height: asset.height,
                }
              : null,
          }));
          setPickerOpen(false);
        }}
      />
    </Sheet>
  );
}
