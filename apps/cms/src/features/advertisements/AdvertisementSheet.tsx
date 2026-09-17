import type {
  AdPlacement,
  AdvertisementDto,
  CreateAdvertisementRequest,
  MediaSummaryDto,
  RichTextContent,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { cn } from '@coastal-talk-news/ui/cn';
import { DateTimeField } from '@coastal-talk-news/ui/date-time-field';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Sheet } from '@coastal-talk-news/ui/sheet';
import { ADVERTISER_NAME_MAX } from '@coastal-talk-news/validation/limits';
import { ImagePlus, Link as LinkIcon, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { TiptapEditor } from '../../components/TiptapEditor.js';
import { MediaPickerDialog } from '../media/MediaPickerDialog.js';
import {
  PLACEMENTS,
  PLACEMENT_META,
  overlappingInPlacement,
} from './placement.js';

interface FormValues {
  advertiserName: string;
  image: MediaSummaryDto | null;
  detailImage: MediaSummaryDto | null;
  description: RichTextContent | null;
  destinationUrl: string;
  placement: AdPlacement;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

/** Which image picker the one dialog is currently filling. */
type PickerTarget = 'image' | 'detailImage' | null;

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

function combineToIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  const local = new Date(`${date}T${time}`);
  return Number.isNaN(local.getTime()) ? null : local.toISOString();
}

/** The actual current time - every minute is a selectable option in the
 * picker now, so there is no rounding to line up with. */
function defaultStart(): { date: string; time: string } {
  return splitIso(new Date().toISOString());
}

function isEmptyDoc(doc: RichTextContent | null): boolean {
  return !doc || doc.content.length === 0;
}

function toValues(
  item: AdvertisementDto | null,
  defaultPlacement: AdPlacement,
): FormValues {
  if (!item) {
    const start = defaultStart();
    return {
      advertiserName: '',
      image: null,
      detailImage: null,
      description: null,
      destinationUrl: '',
      placement: defaultPlacement,
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
    detailImage: item.detailImage,
    description: item.description,
    destinationUrl: item.destinationUrl ?? '',
    placement: item.placement,
    startDate: start.date,
    startTime: start.time,
    endDate: end.date,
    endTime: end.time,
  };
}

interface AdvertisementSheetProps {
  open: boolean;
  editing: AdvertisementDto | null;
  /** The whole list, so zone capacity is judged against every booking. */
  advertisements: AdvertisementDto[];
  /** Pre-selects the zone for a new ad - the placement tab the admin was on. */
  defaultPlacement: AdPlacement;
  saving: boolean;
  serverError: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateAdvertisementRequest) => void;
}

export function AdvertisementSheet({
  open,
  editing,
  advertisements,
  defaultPlacement,
  saving,
  serverError,
  onOpenChange,
  onSubmit,
}: AdvertisementSheetProps) {
  const [values, setValues] = useState<FormValues>(() =>
    toValues(null, defaultPlacement),
  );
  const [touched, setTouched] = useState(false);
  const [picker, setPicker] = useState<PickerTarget>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const initial = useRef<FormValues>(toValues(null, defaultPlacement));

  useEffect(() => {
    if (!open) return;
    const next = toValues(editing, defaultPlacement);
    setValues(next);
    initial.current = next;
    setTouched(false);
    const timer = setTimeout(() => titleRef.current?.focus(), 80);
    return () => clearTimeout(timer);
    // defaultPlacement intentionally excluded: it only matters at the moment
    // the sheet opens for a new ad, not on every re-render while it's open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const trimmedTitle = values.advertiserName.trim();
  const trimmedUrl = values.destinationUrl.trim();
  const startIso = combineToIso(values.startDate, values.startTime);
  const endIso = combineToIso(values.endDate, values.endTime);
  const windowValid = Boolean(
    startIso && endIso && new Date(endIso) > new Date(startIso),
  );
  const isDirty =
    trimmedTitle !== initial.current.advertiserName.trim() ||
    (values.image?.id ?? null) !== (initial.current.image?.id ?? null) ||
    (values.detailImage?.id ?? null) !==
      (initial.current.detailImage?.id ?? null) ||
    JSON.stringify(values.description) !==
      JSON.stringify(initial.current.description) ||
    trimmedUrl !== initial.current.destinationUrl.trim() ||
    values.placement !== initial.current.placement ||
    values.startDate !== initial.current.startDate ||
    values.startTime !== initial.current.startTime ||
    values.endDate !== initial.current.endDate ||
    values.endTime !== initial.current.endTime;

  function slotsTaken(placement: AdPlacement): number {
    if (!startIso || !endIso) return 0;
    return overlappingInPlacement(
      advertisements,
      placement,
      { startAt: startIso, endAt: endIso },
      editing?.id,
    );
  }

  function isFull(placement: AdPlacement): boolean {
    const { capacity } = PLACEMENT_META[placement];
    return capacity !== undefined && slotsTaken(placement) >= capacity;
  }

  const chosenIsFull = isFull(values.placement);

  const titleError =
    touched && !trimmedTitle ? 'Title is required.' : undefined;
  const imageError = touched && !values.image ? 'Choose an image.' : undefined;
  const startError =
    touched && !startIso ? 'Start date and time are required.' : undefined;
  // The "required" message waits for touched, like every other field's -
  // flashing it before the admin has picked anything would be noise. But
  // once both ends are actually filled, an invalid window is real feedback,
  // not noise, and needs to show right away: the submit button is already
  // disabled at that point, so a click can never reach handleSubmit to set
  // touched, and the message would otherwise never appear at all.
  const endError = !endIso
    ? touched
      ? 'End date and time are required.'
      : undefined
    : !windowValid
      ? 'End must be after start.'
      : undefined;

  const canSubmit =
    Boolean(trimmedTitle) &&
    Boolean(values.image) &&
    windowValid &&
    !chosenIsFull &&
    (isDirty || !editing);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit || !values.image || !startIso || !endIso) return;
    onSubmit({
      advertiserName: trimmedTitle,
      mediaId: values.image.id,
      detailMediaId: values.detailImage?.id ?? null,
      description: isEmptyDoc(values.description) ? null : values.description,
      destinationUrl: trimmedUrl,
      placement: values.placement,
      startAt: startIso,
      endAt: endIso,
    });
  }

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

  const imageSlots = [
    {
      key: 'image' as const,
      label: 'Banner image',
      required: true,
      value: values.image,
      hint: PLACEMENT_META[values.placement].hint,
      error: imageError,
    },
    {
      key: 'detailImage' as const,
      label: 'Detail image',
      required: false,
      value: values.detailImage,
      hint: 'Shown on the advertisement’s own page, where there is room for a larger creative. The banner is used when this is empty.',
      error: undefined,
    },
  ];

  return (
    <Sheet
      open={open}
      onOpenChange={requestClose}
      size="lg"
      title={editing ? 'Edit Advertisement' : 'Add Advertisement'}
      description="Manage banner advertisements and their pages."
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
          hint={titleError ? undefined : 'Shown as the heading on the ad page.'}
        >
          <Input
            id="advertisement-title"
            ref={titleRef}
            value={values.advertiserName}
            maxLength={ADVERTISER_NAME_MAX}
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
            Placement<span className="ml-0.5 text-danger">*</span>
          </span>
          <div className="grid gap-2 sm:grid-cols-3">
            {PLACEMENTS.map((placement) => {
              const meta = PLACEMENT_META[placement];
              const selected = values.placement === placement;
              const full = isFull(placement) && !selected;
              return (
                <button
                  key={placement}
                  type="button"
                  disabled={full}
                  aria-pressed={selected}
                  onClick={() =>
                    setValues((current) => ({ ...current, placement }))
                  }
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    selected
                      ? 'border-accent bg-accent-soft'
                      : 'border-hairline hover:border-ink-subtle/40',
                    full && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <span className="text-ink block text-sm font-medium">
                    {meta.label}
                  </span>
                  <span className="text-ink-subtle block text-xs">
                    {meta.capacity === undefined
                      ? meta.hint
                      : `${slotsTaken(placement)}/${meta.capacity} booked for these dates`}
                  </span>
                </button>
              );
            })}
          </div>
          {chosenIsFull && (
            <p role="alert" className="text-danger-text text-xs">
              {PLACEMENT_META[values.placement].label} is fully booked for these
              dates. Pick another zone, or change the schedule below.
            </p>
          )}
        </div>

        {imageSlots.map((slot) => (
          <div key={slot.key} className="space-y-1.5">
            <span className="text-ink-muted block text-sm font-medium">
              {slot.label}
              {slot.required && <span className="ml-0.5 text-danger">*</span>}
            </span>

            {slot.value ? (
              <div className="border-hairline flex items-center gap-3 rounded-lg border p-3">
                <img
                  src={slot.value.url}
                  alt=""
                  width={64}
                  height={48}
                  className="h-12 w-16 shrink-0 rounded-md object-cover"
                />
                <p className="text-ink-muted min-w-0 flex-1 truncate text-sm">
                  {slot.value.width}x{slot.value.height}
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setPicker(slot.key)}
                >
                  Change
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove ${slot.label.toLowerCase()}`}
                  onClick={() =>
                    setValues((current) => ({ ...current, [slot.key]: null }))
                  }
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setPicker(slot.key)}
                className={cn(
                  'border-hairline bg-surface-sunken hover:border-accent hover:bg-accent-soft flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors',
                  slot.error && 'border-danger',
                )}
              >
                <span className="text-ink-subtle bg-surface grid size-10 shrink-0 place-items-center rounded-full">
                  <ImagePlus className="size-5" aria-hidden />
                </span>
                <span className="text-sm">
                  <span className="text-ink-muted block font-medium">
                    Click to upload an image
                  </span>
                  <span className="text-ink-subtle block text-xs">
                    {slot.hint}
                  </span>
                </span>
              </button>
            )}
            {slot.error && (
              <p
                role="alert"
                className="animate-fade-in text-danger-text text-xs"
              >
                {slot.error}
              </p>
            )}
          </div>
        ))}

        <Field
          label="More information"
          htmlFor="advertisement-description"
          optional
          hint="Shown on the advertisement's own page, under the image."
        >
          <div id="advertisement-description">
            <TiptapEditor
              content={values.description}
              placeholder="Offer details, opening hours, address, anything the reader should know."
              onChange={(description) =>
                setValues((current) => ({ ...current, description }))
              }
            />
          </div>
        </Field>

        <Field
          label="Link URL"
          htmlFor="advertisement-link"
          optional
          hint="Where the ad page's button sends readers. Leave empty if the advertiser has no website."
        >
          <Input
            id="advertisement-link"
            type="url"
            value={values.destinationUrl}
            placeholder="https://"
            icon={<LinkIcon className="size-4" aria-hidden />}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                destinationUrl: event.target.value,
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
          <DateTimeField
            id="advertisement-start-date"
            date={values.startDate}
            time={values.startTime}
            invalid={Boolean(startError)}
            dateLabel="Start date"
            timeLabel="Start time"
            onDateChange={(startDate) =>
              setValues((current) => ({ ...current, startDate }))
            }
            onTimeChange={(startTime) =>
              setValues((current) => ({ ...current, startTime }))
            }
          />
        </Field>

        <Field
          label="End Date & Time"
          htmlFor="advertisement-end-date"
          required
          error={endError}
        >
          <DateTimeField
            id="advertisement-end-date"
            date={values.endDate}
            time={values.endTime}
            minDate={values.startDate}
            minTime={values.startTime}
            invalid={Boolean(endError)}
            dateLabel="End date"
            timeLabel="End time"
            onDateChange={(endDate) =>
              setValues((current) => ({ ...current, endDate }))
            }
            onTimeChange={(endTime) =>
              setValues((current) => ({ ...current, endTime }))
            }
          />
        </Field>

        <div className="border-hairline rounded-lg border p-4">
          <p className="text-ink text-sm font-medium">
            {liveNow ? 'Live now' : scheduled ? 'Scheduled' : 'Not live'}
          </p>
          <p className="text-ink-muted mt-0.5 text-xs">
            Status isn&rsquo;t set manually - it follows the schedule above,
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
        open={picker !== null}
        selectedId={(picker && values[picker]?.id) ?? null}
        onOpenChange={(next) => !next && setPicker(null)}
        onSelect={(asset) => {
          setValues((current) => ({
            ...current,
            ...(picker
              ? {
                  [picker]: asset
                    ? {
                        id: asset.id,
                        url: asset.url,
                        width: asset.width,
                        height: asset.height,
                      }
                    : null,
                }
              : {}),
          }));
          setPicker(null);
        }}
      />
    </Sheet>
  );
}
