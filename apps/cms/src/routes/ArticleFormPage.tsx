import type {
  ArticleContent,
  ArticleStatus,
  CreateArticleRequest,
  Language,
} from '@coastal-talk-news/types';
import { Badge } from '@coastal-talk-news/ui/badge';
import { Button } from '@coastal-talk-news/ui/button';
import { ConfirmDialog } from '@coastal-talk-news/ui/confirm-dialog';
import type { SelectOption } from '@coastal-talk-news/ui/select';
import { ErrorState, LoadingState } from '@coastal-talk-news/ui/states';
import { useQuery } from '@tanstack/react-query';
import { ArchiveRestore, ArrowLeft, Send, Undo2 } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { articlesApi } from '../api/articles.js';
import { categoriesApi } from '../api/categories.js';
import { ApiError } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { ArticleBasicFields } from '../features/articles/ArticleBasicFields.js';
import { ArticleMediaFields } from '../features/articles/ArticleMediaFields.js';
import { ArticleSeoFields } from '../features/articles/ArticleSeoFields.js';
import { toValues, type FormValues } from '../features/articles/formValues.js';
import { hasText } from '../features/articles/readTime.js';
import { TagsInput } from '../features/articles/TagsInput.js';
import { TiptapEditor } from '../features/articles/TiptapEditor.js';
import { STATUS_LABELS, STATUS_TONES } from '../features/articles/status.js';
import { useArticleMutations } from '../features/articles/useArticleMutations.js';
import { MediaPickerDialog } from '../features/media/MediaPickerDialog.js';
import { formatDate, formatTime } from '../lib/format.js';

type PublishChoice = 'PUBLISHED' | 'DRAFT';
type PendingAction = 'save' | 'publish';

export function ArticleFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editing = Boolean(id);

  const articleQuery = useQuery({
    queryKey: queryKeys.article(id ?? 'new'),
    queryFn: ({ signal }) => articlesApi.get(id!, signal),
    enabled: editing,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categoryList({ limit: 100 }),
    queryFn: ({ signal }) => categoriesApi.list({ limit: 100 }, signal),
  });

  const mutations = useArticleMutations();
  const article = articleQuery.data ?? null;

  const [values, setValues] = useState<FormValues>(() => toValues(null));
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const initialized = useRef(false);
  const savedSnapshot = useRef(JSON.stringify(toValues(null)));

  const categoryOptions: SelectOption[] = (
    categoriesQuery.data?.data ?? []
  ).map((category) => ({ value: category.id, label: category.name }));

  useEffect(() => {
    if (editing && !article) return;
    if (initialized.current) return;
    initialized.current = true;
    const loaded = toValues(article);
    setValues(loaded);
    savedSnapshot.current = JSON.stringify(loaded);
  }, [editing, article]);

  const isDirty = JSON.stringify(values) !== savedSnapshot.current;

  const status: ArticleStatus = article?.status ?? 'DRAFT';
  const statusHint =
    status === 'PUBLISHED'
      ? 'This article is live on the website.'
      : status === 'ARCHIVED'
        ? 'Archived, so it is off the website.'
        : 'Not on the website yet.';

  function update(patch: Partial<FormValues>) {
    setValues((current) => ({ ...current, ...patch }));
  }

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  function confirmLeave(event: MouseEvent<HTMLAnchorElement>) {
    if (!isDirty) return;
    if (!window.confirm('Leave without saving your changes?')) {
      event.preventDefault();
    }
  }

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

  function buildPayload(
    language: Language,
    content: ArticleContent,
    status: PublishChoice,
  ): CreateArticleRequest {
    return {
      categoryId: values.categoryId,
      language,
      headline: trimmedHeadline,
      summary: trimmedSummary,
      content,
      featuredImageId: values.featuredImage?.id ?? null,
      ogImageId: values.ogImage?.id ?? null,
      youtubeUrl: values.youtubeUrl.trim() || undefined,
      tags: values.tags,
      priority: values.priority,
      status,
      seoTitle: values.seoTitle.trim() || undefined,
      metaDescription: values.metaDescription.trim() || undefined,
    };
  }

  function submit(nextStatus: PublishChoice, action: PendingAction) {
    setTouched(true);
    const { language, content } = values;
    if (!canSubmit || !language || !content) return;

    setPending(action);
    const payload = buildPayload(language, content, nextStatus);
    const settle = () => {
      savedSnapshot.current = JSON.stringify(values);
    };

    if (editing && id) {
      mutations.update.mutate(
        { id, body: payload },
        { onSuccess: settle, onSettled: () => setPending(null) },
      );
      return;
    }

    mutations.create.mutate(payload, {
      onSuccess: (created) => {
        settle();
        navigate(`/articles/${created.id}/edit`, { replace: true });
      },
      onSettled: () => setPending(null),
    });
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT', 'save');
  }

  const saveError = editing ? mutations.update.error : mutations.create.error;
  const busy =
    pending !== null ||
    mutations.unpublish.isPending ||
    mutations.restore.isPending;
  const canSave = canSubmit && isDirty;

  if (editing && articleQuery.isPending) {
    return <LoadingState label="Loading article…" />;
  }
  if (editing && articleQuery.isError && !article) {
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
          <div className="flex items-center gap-3">
            <h1 className="text-ink text-[28px] leading-tight font-bold tracking-tight">
              {editing ? 'Edit Article' : 'Create Article'}
            </h1>
            {editing && (
              <Badge tone={STATUS_TONES[status]} dot>
                {STATUS_LABELS[status]}
              </Badge>
            )}
          </div>
          <p className="text-ink-muted mt-1.5 text-sm">
            {editing
              ? 'Update this article. Changes apply once you save below.'
              : 'Write and publish news that matters to your community.'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {isDirty && (
            <span className="text-ink-subtle text-xs">Unsaved changes</span>
          )}
          <Link
            to="/articles"
            onClick={confirmLeave}
            className="ring-hairline text-ink-muted inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium ring-1 transition-colors hover:bg-surface-sunken"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Articles
          </Link>
        </div>
      </div>

      <form
        id="article-form"
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]"
      >
        <div className="space-y-6">
          <ArticleBasicFields
            values={values}
            categoryOptions={categoryOptions}
            errors={{
              language: languageError,
              category: categoryError,
              headline: headlineError,
              summary: summaryError,
            }}
            onChange={update}
            onBlur={() => setTouched(true)}
          />

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

          <ArticleMediaFields
            values={values}
            onChange={update}
            onPickImage={() => setImagePickerOpen(true)}
          />

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

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <section className="border-hairline rounded-card space-y-4 border bg-surface p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-ink text-base font-semibold">Publish</h2>
                <p className="text-ink-muted mt-0.5 text-sm">{statusHint}</p>
              </div>
              <Badge tone={STATUS_TONES[status]} dot>
                {STATUS_LABELS[status]}
              </Badge>
            </div>

            {article?.publicationDate && (
              <p className="text-ink-subtle text-xs">
                First published {formatDate(article.publicationDate)} at{' '}
                {formatTime(article.publicationDate)}
              </p>
            )}

            <div className="space-y-2">
              {status === 'PUBLISHED' ? (
                <Button
                  type="submit"
                  className="w-full"
                  loading={pending === 'save'}
                  disabled={!canSave || busy}
                >
                  Save changes
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    className="w-full"
                    loading={pending === 'publish'}
                    disabled={!canSubmit || busy}
                    onClick={() => submit('PUBLISHED', 'publish')}
                  >
                    <Send className="size-4" aria-hidden />
                    Publish article
                  </Button>
                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full"
                    loading={pending === 'save'}
                    disabled={!canSave || busy}
                  >
                    {editing ? 'Save changes' : 'Save as draft'}
                  </Button>
                </>
              )}

              {/* Status-only, so they never quietly save half-finished edits. */}
              {editing && article && status === 'PUBLISHED' && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  loading={mutations.unpublish.isPending}
                  disabled={busy}
                  onClick={() => mutations.unpublish.mutate(article)}
                >
                  <Undo2 className="size-4" aria-hidden />
                  Move back to drafts
                </Button>
              )}
              {editing && article && status === 'ARCHIVED' && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  loading={mutations.restore.isPending}
                  disabled={busy}
                  onClick={() => mutations.restore.mutate(article)}
                >
                  <ArchiveRestore className="size-4" aria-hidden />
                  Restore to drafts
                </Button>
              )}
            </div>

            {!canSubmit ? (
              touched && (
                <p className="text-ink-subtle text-xs">
                  Fill in the required fields above before saving.
                </p>
              )
            ) : !isDirty && editing ? (
              <p className="text-ink-subtle text-xs">No changes to save.</p>
            ) : null}

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

          <ArticleSeoFields values={values} onChange={update} />

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
