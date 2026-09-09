import { Button } from '@coastal-talk-news/ui/button';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-accent-text text-sm font-semibold">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-1 mb-6 text-sm text-ink-muted">
        This section of the CMS hasn&rsquo;t been built yet.
      </p>
      <Link to="/">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  );
}
