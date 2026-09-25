import { Button } from '@coastal-talk-news/ui/button';
import { Download, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { CopyButton } from '../../components/CopyButton.js';

const FILE_NAME = 'coastal-talk-news-recovery-codes.txt';

function asTextFile(codes: string[], email: string | undefined): string {
  return [
    'Coastal Talk News - CMS recovery codes',
    ...(email ? [`Account: ${email}`] : []),
    `Created: ${new Date().toLocaleDateString()}`,
    '',
    ...codes.map(
      (code, index) => `${String(index + 1).padStart(2, ' ')}. ${code}`,
    ),
    '',
    'Each code works once, in place of an authenticator code.',
    'Keep this file somewhere private. Anyone with a code and your password can sign in.',
    '',
  ].join('\n');
}

function download(codes: string[], email: string | undefined) {
  const url = URL.createObjectURL(
    new Blob([asTextFile(codes, email)], { type: 'text/plain' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
}

interface RecoveryCodesProps {
  codes: string[];
  email?: string;
  confirmLabel: string;
  onConfirm: () => void;
}

/**
 * The one time the codes are ever shown, so the way out is deliberately
 * slower than the way in: the button stays off until the person says they
 * have kept them.
 */
export function RecoveryCodes({
  codes,
  email,
  confirmLabel,
  onConfirm,
}: RecoveryCodesProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-5">
      <div className="bg-warn-soft text-warn-text flex gap-3 rounded-lg p-4 text-sm">
        <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>
          Save these recovery codes now. If you lose your authenticator, each
          one signs you in once.{' '}
          <strong>They won&rsquo;t be shown again.</strong>
        </p>
      </div>

      <ol
        aria-label="Recovery codes"
        className="bg-surface-sunken border-hairline grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-lg border p-4 font-mono text-sm tracking-wider"
      >
        {codes.map((code, index) => (
          <li key={code} className="text-ink flex items-baseline gap-2">
            <span className="text-ink-subtle w-5 text-right text-xs tabular-nums">
              {index + 1}
            </span>
            {code}
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-2">
        <CopyButton text={codes.join('\n')} label="Copy all" />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => download(codes, email)}
        >
          <Download className="size-4" aria-hidden />
          Download
        </Button>
      </div>

      <label className="text-ink-muted flex cursor-pointer items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
          className="accent-accent mt-0.5 size-4 shrink-0"
        />
        I&rsquo;ve saved my recovery codes somewhere safe.
      </label>

      <Button
        type="button"
        className="w-full"
        disabled={!saved}
        onClick={onConfirm}
      >
        {confirmLabel}
      </Button>
    </div>
  );
}
