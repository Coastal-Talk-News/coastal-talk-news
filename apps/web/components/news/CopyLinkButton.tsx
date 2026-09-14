'use client';

import { useEffect, useRef, useState } from 'react';

interface CopyLinkButtonProps {
  url: string;
  label: string;
  copiedLabel: string;
  /** Icon only, for the compact row above the article. */
  iconOnly?: boolean;
  className: string;
  copiedClassName: string;
}

const RESET_DELAY = 2000;

async function writeToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // The async clipboard is unavailable outside a secure context and in a
    // few in-app browsers, which is exactly where readers open shared links.
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    document.execCommand('copy');
    field.remove();
  }
}

export function CopyLinkButton({
  url,
  label,
  copiedLabel,
  iconOnly = false,
  className,
  copiedClassName,
}: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleClick() {
    await writeToClipboard(url);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), RESET_DELAY);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={iconOnly ? label : undefined}
      className={`${className} ${copied ? copiedClassName : ''}`}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
        {copied ? (
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1 1m-2 6a3.5 3.5 0 0 1-5 0 3.54 3.54 0 0 1 0-5l3-3a3.5 3.5 0 0 1 5 0"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {iconOnly ? (
        // Nothing visible changes in the icon-only button beyond the tick, so
        // the confirmation has to be announced instead.
        <span role="status" aria-live="polite" className="sr-only">
          {copied ? copiedLabel : ''}
        </span>
      ) : (
        <span>{copied ? copiedLabel : label}</span>
      )}
    </button>
  );
}
