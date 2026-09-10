import type {
  ArticleContent,
  ArticleDto,
  CreateArticleRequest,
  MediaSummaryDto,
  UpdateArticleRequest,
} from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { cn } from '@coastal-talk-news/ui/cn';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import { Field } from '@coastal-talk-news/ui/field';
import { Input } from '@coastal-talk-news/ui/input';
import { ErrorState, LoadingState } from '@coastal-talk-news/ui/states';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ImageOff, ImagePlus, Link as LinkIcon } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { articlesApi } from '../api/articles.js';
import { categoriesApi } from '../api/categories.js';
import { ApiError } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { PRIORITY_OPTIONS } from '../features/articles/priority.js';
import { hasText } from '../features/articles/readTime.js';
import { TagsInput } from '../features/articles/TagsInput.js';
import { TiptapEditor } from '../features/articles/TiptapEditor.js';
import { useArticleMutations } from '../features/articles/useArticleMutations.js';
import { MediaPickerDialog } from '../features/media/MediaPickerDialog.js';
import { formatDate, formatTime } from '../lib/format.js';

const HEADLINE_MAX = 200;
const SUMMARY_MAX = 300;
const SEO_TITLE_MAX = 70;
const META_DESCRIPTION_MAX = 300;

type PublishChoice = 'PUBLISHED' | 'DRAFT';

interface FormValues {
  language: 'ENGLISH' | 'KANNADA' | '';
  categoryId: string;
  priority: 'LEAD_STORY' | 'FEATURED' | 'NORMAL';
  headline: string;
  summary: string;
  content: object | null;
  featuredImage: MediaSummaryDto | null;
  youtubeUrl: string;
  tags: string[];
  seoTitle: string;
  metaDescription: string;
}

function toValues(article: ArticleDto | null): FormValues {
  if (!article) {
    return {
      language: '',
      categoryId: '',
      priority: 'NORMAL',
      headline: '',
      summary: '',
      content: null,
      featuredImage: null,
      youtubeUrl: '',
      tags: [],
      seoTitle: '',
      metaDescription: '',
    };
  }
  return {
    language: article.language,
    // Nullable at the DB level; falls back to an empty selection, which the
    // form's own "Choose a category" validation already requires filling in.
    categoryId: article.categoryId ?? '',
    priority: article.priority,
    headline: article.headline,
    summary: article.summary,
    content: article.content,
    featuredImage: article.featuredImage,
    youtubeUrl: article.youtubeUrl ?? '',
    tags: article.tags,
    seoTitle: article.seoTitle ?? '',
    metaDescription: article.metaDescription ?? '',
  };
}

const selectClass =
  'ring-hairline text-ink h-11 w-full rounded-lg bg-surface px-3 text-sm ring-1 focus:ring-2 focus:ring-accent focus:outline-none';

const textareaClass =
  'ring-hairline w-full resize-none rounded-lg bg-surface px-3 py-2.5 text-sm ring-1 transition-shadow placeholder:text-ink-subtle hover:ring-ink-subtle/40 focus:ring-2 focus:outline-none';

export function ArticleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const articleQuery = useQuery({
    queryKey: queryKeys.article(id ?? 'new'),
    queryFn: () => articlesApi.get(id as string),
    enabled: editing,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categoryList({ limit: 100 }),
    queryFn: () => categoriesApi.list({ limit: 100 }),
  });

  const mutations = useArticleMutations();
  const article = articleQuery.data ?? null;

  const [values, setValues] = useState<FormValues>(() => toValues(null));
  const [publishChoice, setPublishChoice] =
    useState<PublishChoice>('PUBLISHED');
  const [touched, setTouched] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const initialized = useRef(false);

  // Populate the form once the article loads — create mode has nothing to
  // wait for, so this runs on the first render there.
  useEffect(() => {
    if (editing && !article) return;
    if (initialized.current) return;
    initialized.current = true;
    setValues(toValues(article));
    setPublishChoice(article?.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED');
  }, [editing, article]);

  const trimmedHeadline = values.headline.trim();
  const trimmedSummary = values.summary.trim();
  const contentFilled = hasText(values.content);

  const headlineError =
    touched && !trimmedHeadline ? 'Headline is required.' : undefined;
  const summaryError =
    touched && !trimmedSummary ? 'Summary is required.' : undefined;
  const categoryError =
    touched && !values.categoryId ? 'Choose a category.' : undefined;
  const languageError =
    touched && !values.language ? 'Choose a language.' : undefined;
  const contentError =
    touched && !contentFilled ? 'Write some content before saving.' : undefined;

  const canSubmit =
    Boolean(trimmedHeadline) &&
    Boolean(trimmedSummary) &&
    Boolean(values.categoryId) &&
    Boolean(values.language) &&
    contentFilled;

  function buildPayload(status: PublishChoice): CreateArticleRequest {
    return {
      categoryId: values.categoryId,
      language: values.language as 'ENGLISH' | 'KANNADA',
      headline: trimmedHeadline,
      summary: trimmedSummary,
      // canSubmit already required contentFilled, so this is never null here.
      content: values.content as ArticleContent,
      featuredImageId: values.featuredImage?.id ?? null,
      youtubeUrl: values.youtubeUrl.trim() || undefined,
      tags: values.tags,
      priority: values.priority,
      status,
      seoTitle: values.seoTitle.trim() || undefined,
      metaDescription: values.metaDescription.trim() || undefined,
    };
  }

  function submit(status: PublishChoice) {
    setTouched(true);
    if (!canSubmit) return;
    const payload = buildPayload(status);
    if (editing && id) {
      mutations.update.mutate(
        { id, body: payload as UpdateArticleRequest },
        { onSuccess: () => navigate('/articles') },
      );
    } else {
      mutations.create.mutate(payload, {
        onSuccess: () => navigate('/articles'),
      });
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(publishChoice);
  }

  const saveError = editing ? mutations.update.error : mutations.create.error;
  const saving = mutations.create.isPending || mutations.update.isPending;

  if (editing && articleQuery.isPending) {
    return <LoadingState label="Loading article…" />;
  }
  if (editing && articleQuery.isError) {
    return (
      <ErrorState
        message={
          articleQuery.error instanceof ApiError
            ? articleQuery.error.message
            : 'Could not load this article.'
        }
        onRetry={() => void articleQuery.refetch()}
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-ink text-[28px] leading-tight font-bold tracking-tight">
            {editing ? 'Edit Article' : 'Create Article'}
          </h1>
          <p className="text-ink-muted mt-1.5 text-sm">
            {editing
              ? 'Update this article. Changes apply once you save below.'
              : 'Write and publish news that matters to your community.'}
          </p>
        </div>
        <Link
          to="/articles"
          className="ring-hairline text-ink-muted inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium ring-1 transition-colors hover:bg-surface-sunken"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Articles
        </Link>
      </div>

      <form
        id="article-form"
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          <section className="border-hairline rounded-card space-y-5 border bg-surface p-5 shadow-sm">
            <div>
              <h2 className="text-ink text-base font-semibold">
                Basic Information
              </h2>
              <p className="text-ink-muted mt-0.5 text-sm">
                Add the essential details about your article.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                label="Language"
                htmlFor="article-language"
                required
                error={languageError}
              >
                <select
                  id="article-language"
                  value={values.language}
                  onBlur={() => setTouched(true)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      language: event.target.value as FormValues['language'],
                    }))
                  }
                  className={cn(
                    selectClass,
                    languageError && 'ring-danger focus:ring-danger',
                  )}
                >
                  <option value="">Select language</option>
                  <option value="ENGLISH">English</option>
                  <option value="KANNADA">Kannada</option>
                </select>
              </Field>

              <Field
                label="Category"
                htmlFor="article-category"
                required
                error={categoryError}
              >
                <select
                  id="article-category"
                  value={values.categoryId}
                  onBlur={() => setTouched(true)}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      categoryId: event.target.value,
                    }))
                  }
                  className={cn(
                    selectClass,
                    categoryError && 'ring-danger focus:ring-danger',
                  )}
                >
                  <option value="">Select category</option>
                  {categoriesQuery.data?.data.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Editorial Priority"
                htmlFor="article-priority"
                hint="Controls placement on the homepage."
              >
                <select
                  id="article-priority"
                  value={values.priority}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      priority: event.target.value as FormValues['priority'],
                    }))
                  }
                  className={selectClass}
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field
              label="Headline"
              htmlFor="article-headline"
              required
              error={headlineError}
            >
              <Input
                id="article-headline"
                value={values.headline}
                maxLength={HEADLINE_MAX}
                placeholder="Enter a clear and concise headline"
                invalid={Boolean(headlineError)}
                onBlur={() => setTouched(true)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    headline: event.target.value,
                  }))
                }
              />
            </Field>

            <Field
              label="Summary"
              htmlFor="article-summary"
              required
              error={summaryError}
              hint={
                summaryError
                  ? undefined
                  : 'Shown in article listings and social previews.'
              }
            >
              <textarea
                id="article-summary"
                rows={3}
                maxLength={SUMMARY_MAX}
                value={values.summary}
                placeholder="Write a short summary (2–3 lines) that appears in article listings and on social media."
                onBlur={() => setTouched(true)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                className={cn(
                  textareaClass,
                  summaryError
                    ? 'ring-danger focus:ring-danger'
                    : 'focus:ring-accent',
                )}
              />
              <p className="text-ink-subtle text-right text-xs tabular-nums">
                {values.summary.length}/{SUMMARY_MAX}
              </p>
            </Field>
          </section>

          <section className="border-hairline rounded-card space-y-3 border bg-surface p-5 shadow-sm">
            <div>
              <h2 className="text-ink text-base font-semibold">Content</h2>
              <p className="text-ink-muted mt-0.5 text-sm">
                Write the full article content. You can format text, add images,
                links, etc.
              </p>
            </div>
            <TiptapEditor
              content={values.content}
              onChange={(content) =>
                setValues((current) => ({ ...current, content }))
              }
            />
            {contentError && (
              <p role="alert" className="text-danger-text text-xs">
                {contentError}
              </p>
            )}
          </section>

          <section className="border-hairline rounded-card space-y-4 border bg-surface p-5 shadow-sm">
            <div>
              <h2 className="text-ink text-base font-semibold">
                Media{' '}
                <span className="text-ink-subtle font-normal">(Optional)</span>
              </h2>
              <p className="text-ink-muted mt-0.5 text-sm">
                Add a featured image and/or YouTube video.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <span className="text-ink-muted block text-sm font-medium">
                  Featured Image
                </span>
                {values.featuredImage ? (
                  <div className="group border-hairline relative overflow-hidden rounded-lg border">
                    <img
                      src={values.featuredImage.url}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setImagePickerOpen(true)}
                      >
                        Change
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          setValues((current) => ({
                            ...current,
                            featuredImage: null,
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setImagePickerOpen(true)}
                    className="border-hairline hover:bg-surface-sunken/70 flex w-full flex-col items-center gap-2 rounded-lg border border-dashed bg-surface-sunken px-4 py-8 text-center transition-colors"
                  >
                    <ImagePlus className="text-ink-subtle size-6" aria-hidden />
                    <p className="text-ink-muted text-sm font-medium">
                      Choose an image
                    </p>
                    <p className="text-ink-subtle text-xs">
                      From the Media Library, or upload a new one.
                    </p>
                  </button>
                )}
              </div>
              <Field
                label="YouTube Video"
                htmlFor="article-youtube"
                optional
                hint="Renders inline on the article page if set."
              >
                <Input
                  id="article-youtube"
                  type="url"
                  value={values.youtubeUrl}
                  placeholder="Paste YouTube video URL"
                  icon={<LinkIcon className="size-4" aria-hidden />}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      youtubeUrl: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          </section>

          <section className="border-hairline rounded-card space-y-3 border bg-surface p-5 shadow-sm">
            <div>
              <h2 className="text-ink text-base font-semibold">
                Tags{' '}
                <span className="text-ink-subtle font-normal">(Optional)</span>
              </h2>
              <p className="text-ink-muted mt-0.5 text-sm">
                Add relevant tags to help with search and discovery.
              </p>
            </div>
            <TagsInput
              value={values.tags}
              onChange={(tags) =>
                setValues((current) => ({ ...current, tags }))
              }
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="border-hairline rounded-card space-y-4 border bg-surface p-5 shadow-sm">
            <div>
              <h2 className="text-ink text-base font-semibold">Publish</h2>
              <p className="text-ink-muted mt-0.5 text-sm">
                Set the status and publication details.
              </p>
            </div>

            <div className="space-y-2">
              {(['PUBLISHED', 'DRAFT'] as const).map((choice) => (
                <label
                  key={choice}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    publishChoice === choice
                      ? 'border-accent bg-accent-soft'
                      : 'border-hairline hover:bg-surface-sunken',
                  )}
                >
                  <input
                    type="radio"
                    name="publish-choice"
                    className="accent-accent mt-0.5"
                    checked={publishChoice === choice}
                    onChange={() => setPublishChoice(choice)}
                  />
                  <span>
                    <span className="text-ink block text-sm font-medium">
                      {choice === 'PUBLISHED' ? 'Publish Now' : 'Save as Draft'}
                    </span>
                    <span className="text-ink-muted text-xs">
                      {choice === 'PUBLISHED'
                        ? 'Make this article live immediately.'
                        : 'Keep as a draft and publish later.'}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {article?.publicationDate && (
              <p className="text-ink-subtle text-xs">
                First published {formatDate(article.publicationDate)} at{' '}
                {formatTime(article.publicationDate)}
              </p>
            )}
            {article?.status === 'ARCHIVED' && (
              <p className="bg-warn-soft text-warn-text rounded-lg px-3 py-2 text-xs">
                This article is archived. Saving below restores it to the status
                you choose here.
              </p>
            )}

            <div className="space-y-2">
              <Button
                type="submit"
                className="w-full"
                loading={saving}
                disabled={!canSubmit}
              >
                {publishChoice === 'PUBLISHED'
                  ? editing
                    ? 'Save & Publish'
                    : 'Publish Article'
                  : 'Save Draft'}
              </Button>
              {publishChoice === 'PUBLISHED' && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  loading={saving}
                  disabled={!canSubmit}
                  onClick={() => submit('DRAFT')}
                >
                  Save as Draft instead
                </Button>
              )}
            </div>

            {saveError && (
              <p
                role="alert"
                className="bg-danger-soft text-danger-text rounded-lg px-3 py-2 text-sm"
              >
                {saveError instanceof ApiError
                  ? saveError.message
                  : 'Could not save this article.'}
              </p>
            )}
          </section>

          <section className="border-hairline rounded-card space-y-3 border bg-surface p-5 shadow-sm">
            <h2 className="text-ink text-sm font-semibold">
              Additional Settings
            </h2>
            <details>
              <summary className="text-ink-muted cursor-pointer text-sm font-medium">
                SEO Settings{' '}
                <span className="text-ink-subtle text-xs font-normal">
                  (Optional)
                </span>
              </summary>
              <div className="mt-3 space-y-3">
                <Field label="SEO Title" htmlFor="article-seo-title" optional>
                  <Input
                    id="article-seo-title"
                    value={values.seoTitle}
                    maxLength={SEO_TITLE_MAX}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        seoTitle: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field
                  label="Meta Description"
                  htmlFor="article-meta-description"
                  optional
                >
                  <textarea
                    id="article-meta-description"
                    rows={3}
                    maxLength={META_DESCRIPTION_MAX}
                    value={values.metaDescription}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        metaDescription: event.target.value,
                      }))
                    }
                    className={cn(textareaClass, 'focus:ring-accent')}
                  />
                </Field>
                <div className="space-y-1.5">
                  <span className="text-ink-muted block text-sm font-medium">
                    Social preview image
                  </span>
                  <div className="border-hairline flex items-center gap-3 rounded-lg border border-dashed bg-surface-sunken px-4 py-4">
                    <span className="text-ink-subtle grid size-10 shrink-0 place-items-center rounded-full bg-surface">
                      <ImageOff className="size-5" aria-hidden />
                    </span>
                    <div className="text-sm">
                      <p className="text-ink-muted font-medium">Coming soon</p>
                      <p className="text-ink-subtle text-xs">
                        Falls back to the featured image once set.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </section>

          {editing && (
            <section className="border-hairline rounded-card space-y-3 border bg-surface p-5 shadow-sm">
              <h2 className="text-ink text-sm font-semibold">Actions</h2>
              <Button
                type="button"
                variant="danger"
                className="w-full"
                onClick={() => setPendingDelete(true)}
              >
                Delete Article
              </Button>
            </section>
          )}
        </div>
      </form>

      <MediaPickerDialog
        open={imagePickerOpen}
        selectedId={values.featuredImage?.id ?? null}
        onOpenChange={setImagePickerOpen}
        onSelect={(asset) => {
          setValues((current) => ({ ...current, featuredImage: asset }));
          setImagePickerOpen(false);
        }}
      />

      <ConfirmDialog
        open={pendingDelete}
        onOpenChange={setPendingDelete}
        title={`Delete "${article?.headline}"?`}
        description="This permanently removes the article. It cannot be undone."
        confirmLabel="Delete article"
        loading={mutations.remove.isPending}
        onConfirm={() => {
          if (!article) return;
          mutations.remove.mutate(article, {
            onSuccess: () => navigate('/articles'),
            onSettled: () => setPendingDelete(false),
          });
        }}
      />
    </>
  );
}
