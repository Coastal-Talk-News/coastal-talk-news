import Link from 'next/link';
import { getSite } from '../lib/api';

export const metadata = { title: 'Page not found' };

export default async function NotFound() {
  let categories: Array<{ id: string; name: string }> = [];
  try {
    categories = (await getSite()).categories;
  } catch {
    categories = [];
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <p className="text-brand font-serif text-6xl font-bold sm:text-7xl">
        404
      </p>
      <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Page not found</h1>
      <p className="text-ink-muted mt-3 max-w-md leading-relaxed">
        The page you are looking for does not exist or may have been moved.
      </p>

      <Link
        href="/"
        className="bg-brand hover:bg-brand-hover mt-8 inline-flex h-11 items-center rounded-sm px-6 text-sm font-semibold text-white transition-colors"
      >
        Go to homepage
      </Link>

      {categories.length > 0 && (
        <div className="mt-12 w-full">
          <p className="text-ink-subtle text-xs font-semibold tracking-[0.12em] uppercase">
            Popular sections
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="border-rule hover:border-brand hover:text-brand rounded-sm border px-4 py-2 text-sm font-medium transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
