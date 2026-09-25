import type { ArticleContent, SiteSettingsDto } from '@coastal-talk-news/types';
import { Button } from '@coastal-talk-news/ui/button';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { TiptapEditor } from '../../components/TiptapEditor.js';
import { hasText } from './SettingsPageForm.js';
import { useUpdateSettings } from './useUpdateSettings.js';
import { SettingsNote } from './SettingsNote.js';

export function SettingsPrivacyForm({
  settings,
}: {
  settings: SiteSettingsDto;
}) {
  const [content, setContent] = useState<ArticleContent | null>(
    settings.privacyContent,
  );
  const initial = useRef<ArticleContent | null>(settings.privacyContent);
  const mutation = useUpdateSettings();

  useEffect(() => {
    setContent(settings.privacyContent);
    initial.current = settings.privacyContent;
  }, [settings.privacyContent]);

  const isDirty = JSON.stringify(content) !== JSON.stringify(initial.current);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isDirty) return;
    mutation.mutate(
      { privacyContent: hasText(content) ? content : null },
      { onSuccess: () => toast.success('Privacy policy saved.') },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <SettingsNote>
        This is the Privacy Policy page on your website, reached from the
        “Privacy Policy” link in the footer. Until you write something here,
        that page shows a short note that it hasn’t been added yet.
      </SettingsNote>

      <div className="space-y-1.5">
        <span className="text-ink-muted block text-sm font-medium">
          Privacy policy text
        </span>
        <TiptapEditor
          content={content}
          placeholder="Type or paste your privacy policy here…"
          onChange={(next) => setContent(next as ArticleContent)}
        />
        <p className="text-ink-subtle text-xs">
          Headings, lists and links work the same as in a news article.
        </p>
      </div>

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
