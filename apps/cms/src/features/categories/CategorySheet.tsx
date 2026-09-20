import type {
  CmsCategoryDto,
  CreateCategoryRequest,
  MediaSummaryDto,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { Select, type SelectOption } from '@coastal-talk-news/ui/select';
import { Sheet } from '@coastal-talk-news/ui/sheet';
import { Textarea } from '@coastal-talk-news/ui/textarea';
import { Toggle } from '@coastal-talk-news/ui/toggle';
import {
  CATEGORY_DESCRIPTION_MAX,
  CATEGORY_NAME_MAX,
} from '@coastal-talk-news/validation/limits';
import { ImagePlus, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MediaPickerDialog } from '../media/MediaPickerDialog.js';
import { categoryPathLabel, descendantIds } from './tree.js';

interface FormValues {
  name: string;
  description: string;
  isActive: boolean;
  parentId: string | null;
  coverImage: MediaSummaryDto | null;
}

function toValues(category: CmsCategoryDto | null): FormValues {
  return {
    name: category?.name ?? '',
    description: category?.description ?? '',
    isActive: category?.isActive ?? true,
    parentId: category?.parentId ?? null,
    coverImage: category?.coverImage ?? null,
  };
}

interface CategorySheetProps {
  open: boolean;
  editing: CmsCategoryDto | null;
  saving: boolean;
  serverError: string | null;
  existingNames: string[];
  /** The full flat list — used to build Parent Category options and check for children. */
  categories: CmsCategoryDto[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CreateCategoryRequest) => void;
}

export function CategorySheet({
  open,
  editing,
  saving,
  serverError,
  existingNames,
  categories,
  onOpenChange,
  onSubmit,
}: CategorySheetProps) {
  const [values, setValues] = useState<FormValues>(() => toValues(editing));
  const [touched, setTouched] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const initial = useRef<FormValues>(toValues(editing));

  // Choosing this category as a parent would make it its own descendant, so
  // it and everything already under it are excluded — grouping can nest to
  // any depth otherwise. A category that already holds articles directly
  // can't become a parent, either — it would keep those articles invisible
  // next to its own subcategories.
  const excludedIds = editing
    ? new Set([editing.id, ...descendantIds(categories, editing.id)])
    : new Set<string>();
  const parentOptions: Array<SelectOption<string>> = [
    { value: '', label: 'None (top level)' },
    ...categories
      .filter(
        (category) =>
          !excludedIds.has(category.id) && category.articleCount === 0,
      )
      .map((category) => ({
        value: category.id,
        label: categoryPathLabel(category, categories),
      })),
  ];

  useEffect(() => {
    if (!open) return;
    const next = toValues(editing);
    setValues(next);
    initial.current = next;
    setTouched(false);
    const timer = setTimeout(() => nameRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [open, editing]);

  const trimmedName = values.name.trim();
  const isDirty =
    trimmedName !== initial.current.name.trim() ||
    values.description.trim() !== initial.current.description.trim() ||
    values.isActive !== initial.current.isActive ||
    values.parentId !== initial.current.parentId ||
    (values.coverImage?.id ?? null) !==
      (initial.current.coverImage?.id ?? null);

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
      parentId: values.parentId,
      coverImageId: values.coverImage?.id ?? null,
    });
  }

  function requestClose(next: boolean) {
    if (next) return onOpenChange(true);
    if (isDirty && !window.confirm('Discard your unsaved changes?')) return;
    onOpenChange(false);
  }

  const picker = (
    <MediaPickerDialog
      open={pickerOpen}
      selectedId={values.coverImage?.id ?? null}
      onOpenChange={setPickerOpen}
      onSelect={(asset) => {
        setValues((current) => ({
          ...current,
          coverImage: asset
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
  );

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
            data-shortcut="save"
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
            maxLength={CATEGORY_NAME_MAX}
            placeholder="e.g. Udupi"
            invalid={Boolean(nameError)}
            onBlur={() => setTouched(true)}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
          />
        </Field>

        <Field
          label="Parent Category"
          htmlFor="category-parent"
          hint="Choose a parent to group this under another category, at any depth, or leave it as a top-level category. Only a category with no articles of its own can be a parent."
        >
          <Select
            id="category-parent"
            value={values.parentId ?? ''}
            onValueChange={(parentId) =>
              setValues((current) => ({
                ...current,
                parentId: parentId || null,
              }))
            }
            options={parentOptions}
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
          <Textarea
            id="category-description"
            rows={4}
            maxLength={CATEGORY_DESCRIPTION_MAX}
            showCount
            value={values.description}
            placeholder="A short line shown on the category page."
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <span className="text-ink-muted block text-sm font-medium">
            Cover image
            <span className="text-ink-subtle ml-1 font-normal">(optional)</span>
          </span>

          {values.coverImage ? (
            <div className="border-hairline flex items-center gap-3 rounded-lg border p-3">
              <img
                src={values.coverImage.url}
                alt=""
                width={64}
                height={48}
                className="h-12 w-16 shrink-0 rounded-md object-cover"
              />
              <p className="text-ink-muted min-w-0 flex-1 truncate text-sm">
                {values.coverImage.width}×{values.coverImage.height}
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
                aria-label="Remove cover image"
                onClick={() =>
                  setValues((current) => ({ ...current, coverImage: null }))
                }
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
          ) : null}

          {values.coverImage && (
            <p className="text-ink-subtle text-xs">
              Changing or removing this deletes the image from the library,
              unless something else uses it.
            </p>
          )}

          {!values.coverImage && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="border-hairline bg-surface-sunken hover:border-accent hover:bg-accent-soft flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors"
            >
              <span className="text-ink-subtle bg-surface grid size-10 shrink-0 place-items-center rounded-full">
                <ImagePlus className="size-5" aria-hidden />
              </span>
              <span className="text-sm">
                <span className="text-ink-muted block font-medium">
                  Choose an image
                </span>
                <span className="text-ink-subtle block text-xs">
                  Shown on the category page.
                </span>
              </span>
            </button>
          )}
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
        {picker}
      </form>
    </Sheet>
  );
}
