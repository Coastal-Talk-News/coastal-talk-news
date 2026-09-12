/**
 * Accepts the URL shapes an editor is likely to paste — watch links, youtu.be
 * short links, embeds and shorts — and renders nothing at all if the id can't
 * be read, since a malformed URL must never reach the iframe src.
 */
function videoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    const candidate =
      host === 'youtu.be'
        ? parsed.pathname.slice(1)
        : (parsed.searchParams.get('v') ??
          parsed.pathname.split('/').filter(Boolean).pop() ??
          '');
    return /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function YoutubeEmbed({ url, title }: { url: string; title: string }) {
  const id = videoId(url);
  if (!id) return null;

  return (
    <figure className="my-8">
      <div className="bg-paper-sunken relative aspect-video w-full overflow-hidden rounded-card">
        <iframe
          // nocookie keeps YouTube from setting tracking cookies until play.
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={`${title} — video`}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </figure>
  );
}
