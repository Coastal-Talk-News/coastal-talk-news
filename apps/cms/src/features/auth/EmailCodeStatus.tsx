interface EmailCodeStatusProps {
  pending: boolean;
  failed: boolean;
  /** Seconds left before a resend is allowed again. */
  cooldown: number;
  onResend: () => void;
}

/**
 * The status line for the email screen - purely a readout of what the
 * parent's send mutation is doing. It owns no state and makes no requests
 * itself, so this is the one place that text lives, instead of being
 * duplicated between a field hint and a separate status message.
 */
export function EmailCodeStatus({
  pending,
  failed,
  cooldown,
  onResend,
}: EmailCodeStatusProps) {
  if (failed) {
    return (
      <p className="text-danger-text text-xs">
        Could not send the code.{' '}
        <button
          type="button"
          onClick={onResend}
          className="font-medium underline"
        >
          Try again
        </button>
      </p>
    );
  }

  if (pending) {
    return (
      <p className="text-ink-subtle text-xs">Sending the code to your email…</p>
    );
  }

  return (
    <p className="text-ink-subtle text-xs">
      We&rsquo;ve emailed you a 6-digit code.{' '}
      {cooldown > 0 ? (
        `Resend in ${cooldown}s`
      ) : (
        <button
          type="button"
          onClick={onResend}
          className="text-accent-text font-medium underline"
        >
          Resend code
        </button>
      )}
    </p>
  );
}
