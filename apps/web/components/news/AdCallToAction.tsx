interface AdCallToActionProps {
  url: string;
  label: string;
  /**
   * `lead` sits above the creative, `closing` ends the page, and `sticky` is
   * the phone-only bar that keeps the link reachable however far the reader
   * has scrolled.
   */
  variant?: 'lead' | 'closing' | 'sticky';
}

/**
 * The advertiser's own link. It is a button rather than a line of text, and it
 * appears before the creative as well as after it, because a reader who came
 * here by clicking an ad is looking for the advertiser - not for us.
 */
export function AdCallToAction({
  url,
  label,
  variant = 'lead',
}: AdCallToActionProps) {
  const host = safeHost(url);
  if (!host) return null;

  if (variant === 'sticky') {
    return (
      <div
        className="border-rule bg-paper/95 fixed inset-x-0 bottom-0 z-30 border-t px-4 pt-3 backdrop-blur sm:hidden"
        style={{
          paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <p className="text-ink-subtle mb-1.5 text-center text-[11px] break-all">
          {host}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="bg-brand hover:bg-brand-hover flex h-12 w-full items-center justify-center gap-2 rounded-sm text-base font-semibold text-white transition-colors"
        >
          {label}
          <ExternalArrow />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`bg-brand hover:bg-brand-hover inline-flex items-center gap-2 rounded-sm font-semibold text-white shadow-sm transition-colors ${
          variant === 'lead' ? 'h-12 px-7 text-base' : 'h-11 px-6 text-sm'
        }`}
      >
        {label}
        <ExternalArrow />
      </a>
      {/* Naming the destination up front is what makes the button safe to
          click: the reader knows where it goes before it goes there. */}
      <span className="text-ink-subtle text-sm break-all">{host}</span>
    </div>
  );
}

function ExternalArrow() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      className="size-4 shrink-0"
    >
      <path
        d="M7 13 13 7m0 0H8m5 0v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Only http(s) links are ever rendered. The URL is advertiser-supplied and
 * reaches the page as data, so a `javascript:` href would be stored XSS.
 */
function safeHost(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.host.replace(/^www\./, '');
  } catch {
    return null;
  }
}
