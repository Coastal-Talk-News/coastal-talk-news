import { Button } from '@coastal-talk-news/ui/button';
import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const CONFIRMATION_MS = 2000;

/** Copies text and says so, then goes back to being a copy button. */
export function CopyButton({
  text,
  label = 'Copy',
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard access can be refused (an insecure origin, a permissions
      // policy). Nothing to fall back to that wouldn't lie about having copied.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), CONFIRMATION_MS);
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={copy}>
      {copied ? (
        <Check className="text-success-text size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </Button>
  );
}
