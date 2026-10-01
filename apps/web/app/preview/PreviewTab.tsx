'use client';

import { useEffect, useState } from 'react';
import type {
  PublicArticleDto,
  PublicSiteSettingsDto,
} from '@coastal-talk-news/types';
import { ArticleView } from '../../components/news/ArticleView';
import type { Locale } from '../../lib/i18n/types';

const READY_MESSAGE = 'ctn-preview:ready';
const DATA_MESSAGE = 'ctn-preview:data';

// Generous: it only has to outlast the CMS's own draft-build request.
const WAIT_TIMEOUT_MS = 15_000;

// sessionStorage, not a server round trip: scoped to this one tab, gone the
// moment it closes, and lets a reload show the same draft again without
// asking the CMS - which may not even still be open - to build it again.
const STORAGE_KEY = 'ctn-preview-article';

interface PreviewTabProps {
  settings: PublicSiteSettingsDto;
  locale: Locale;
  shareUrl: string;
}

type Status = 'waiting' | 'ready' | 'unavailable';

/**
 * Renders whatever the CMS hands over through `postMessage` - nothing here
 * is ever fetched from or stored on a server. A copy lives in this tab's own
 * `sessionStorage` purely so a reload can show it again without repeating
 * the handshake; it's gone the moment the tab closes. The CMS's origin
 * travels in the URL fragment it set when opening this tab (never sent to a
 * server), so this page only trusts messages from the exact window that
 * opened it and claims that origin.
 */
export function PreviewTab({ settings, locale, shareUrl }: PreviewTabProps) {
  const [article, setArticle] = useState<PublicArticleDto | null>(null);
  const [status, setStatus] = useState<Status>('waiting');

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setArticle(JSON.parse(stored) as PublicArticleDto);
        setStatus('ready');
        return;
      }
    } catch {
      // Unavailable (private browsing, storage disabled) - fall through to
      // the opener handshake below, same as this tab's first load.
    }

    const originParam = new URLSearchParams(window.location.hash.slice(1)).get(
      'origin',
    );

    let openerOrigin: string;
    try {
      openerOrigin = originParam ? new URL(originParam).origin : '';
    } catch {
      openerOrigin = '';
    }

    if (!openerOrigin || !window.opener) {
      setStatus('unavailable');
      return;
    }

    function onMessage(event: MessageEvent) {
      if (event.source !== window.opener || event.origin !== openerOrigin) {
        return;
      }
      const data = event.data as {
        type?: unknown;
        article?: PublicArticleDto;
      } | null;
      if (data?.type !== DATA_MESSAGE || !data.article) return;
      setArticle(data.article);
      setStatus('ready');
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data.article));
      } catch {
        // A reload just won't have it to restore from - not fatal.
      }
      // Only once the handshake has actually paid off: React's Strict Mode
      // runs this effect twice in development, and clearing the fragment
      // any earlier would blank it out before the second run gets to read it.
      history.replaceState(null, '', window.location.pathname);
    }

    window.addEventListener('message', onMessage);
    window.opener.postMessage({ type: READY_MESSAGE }, openerOrigin);

    const timeout = setTimeout(() => {
      setStatus((current) => (current === 'waiting' ? 'unavailable' : current));
    }, WAIT_TIMEOUT_MS);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(timeout);
    };
  }, []);

  if (status === 'unavailable') {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <h1 className="font-serif text-2xl font-bold">
          This preview has ended
        </h1>
        <p className="text-ink-muted mt-3">
          Previews only work when opened from the editor. Go back and press
          Preview again.
        </p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <p className="text-ink-muted">Loading preview…</p>
      </div>
    );
  }

  return (
    <>
      <div
        role="note"
        className="border-brand/30 bg-brand/5 text-ink-muted rounded-card flex items-center gap-2 border px-4 py-2.5 text-sm"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand size-4 shrink-0"
          aria-hidden
        >
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
        <span>
          <strong className="text-ink font-semibold">Preview.</strong> This is
          how the article will look once it is published. It is not on the
          website yet.
        </span>
      </div>
      <ArticleView
        article={article}
        settings={settings}
        locale={locale}
        // The draft has no public address of its own, so sharing points home.
        shareUrl={shareUrl}
      />
    </>
  );
}
