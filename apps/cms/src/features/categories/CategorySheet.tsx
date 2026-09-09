import type {
  CmsCategoryDto,
  CreateCategoryRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Sheet } from '@coastal-talk-news/ui/sheet';
import { Toggle } from '@coastal-talk-news/ui/toggle';
import { ImageOff } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

const NAME_MAX = 60;
const DESCRIPTION_MAX = 200;

interface FormValues {
  name: string;
  description: string;
  isActive: boolean;
}

function toValues(category: CmsCategoryDto | null): FormValues {
  return {
    name: category?.name ?? '',
    description: category?.description ?? '',
    isActive: category?.isActive ?? true,
  };
}

interface CategorySheetProps {
  open: boolean;
  editing: CmsCategoryDto | null;
  saving: boolean;
  serverError: string | null;
  existingNames: string[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateCategoryRequest) => void;
}

export function CategorySheet({
  open,
  editing,
  saving,
  serverError,
  existingNames,
  onOpenChange,
  onSubmit,
}: CategorySheetProps) {
  const [values, setValues] = useState<FormValues>(() => toValues(editing));
  const [touched, setTouched] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const initial = useRef<FormValues>(toValues(editing));

  useEffect(() => {
    if (!open) return;
    const next = toValues(editing);
    setValues(next);
    initial.current = next;
    setTouched(false);
    // Focus lands on the first field so the form is usable without reaching
    // for the mouse.
    const timer = setTimeout(() => nameRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, editing]);

  const trimmedName = values.name.trim();
  const isDirty =
    trimmedName !== initial.current.name.trim() ||
    values.description.trim() !== initial.current.description.trim() ||
    values.isActive !== initial.current.isActive;

  const duplicate =
    trimmedName.length > 0 &&
    existingNames.some(
      (name) =>
        name.toLowerCase() === trimmedName.toLowerCase() &&
        name.toLowerCase() !== editing?.name.toLowerCase(),
    );

  const nameError = touched
    ? !trimmedName
      ? 'Category name is required.'
      : duplicate
        ? 'A category with this name already exists.'
        : undefined
    : undefined;

  const canSubmit = Boolean(trimmedName) && !duplicate && (isDirty || !editing);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onSubmit({
      name: trimmedName,
      description: values.description.trim() || null,
      isActive: values.isActive,
    });
  }

  // Closing with unsaved edits asks first, so a stray Esc cannot discard work.
  function requestClose(next: boolean) {
    if (next) return onOpenChange(true);
    if (isDirty && !window.confirm('Discard your unsaved changes?')) return;
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={requestClose}
      title={editing ? 'Edit category' : 'New category'}
      description={
        editing
          ? 'Changes appear on the public site immediately.'
          : 'Categories organise your news and drive the public navigation.'
      }
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
            form="category-form"
            className="flex-1"
            loading={saving}
            disabled={!canSubmit}
          >
            {editing ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      }
    >
      <form
        id="category-form"
        onSubmit={handleSubmit}
        className="space-y-6"
        noValidate
      >
        <Field
          label="Category name"
          htmlFor="category-name"
          required
          error={nameError}
        >
          <Input
            id="category-name"
            ref={nameRef}
            value={values.name}
            maxLength={NAME_MAX}
            placeholder="e.g. Udupi"
            invalid={Boolean(nameError)}
            onBlur={() => setTouched(true)}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
          />
        </Field>

        <div className="space-y-1.5">
          <label
            htmlFor="category-description"
            className="block text-sm font-medium text-ink-muted"
          >
            Description
            <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
          </label>
          <textarea
            id="category-description"
            rows={4}
            maxLength={DESCRIPTION_MAX}
            value={values.description}
            placeholder="A short line shown on the category page."
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

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-ink-muted">
            Cover image
          </span>
          <div className="border-hairline flex items-center gap-3 rounded-lg border border-dashed bg-surface-sunken px-4 py-4">
            <span className="text-ink-subtle grid size-10 shrink-0 place-items-center rounded-full bg-surface">
              <ImageOff className="size-5" aria-hidden />
            </span>
            <div className="text-sm">
              <p className="text-ink-muted font-medium">Coming soon</p>
              <p className="text-ink-subtle text-xs">
                You&rsquo;ll be able to add a cover image here.
              </p>
            </div>
          </div>
        </div>

        <div className="border-hairline rounded-lg border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-ink text-sm font-medium">
                {values.isActive
                  ? 'Visible on the website'
                  : 'Hidden from the website'}
              </p>
              <p className="text-ink-muted mt-0.5 text-xs">
                {values.isActive
                  ? 'Appears in navigation and category listings.'
                  : 'Articles stay intact, but readers cannot see this category.'}
              </p>
            </div>
            <Toggle
              checked={values.isActive}
              onCheckedChange={(isActive) =>
                setValues((current) => ({ ...current, isActive }))
              }
              aria-label="Visible on the website"
            />
          </div>
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
