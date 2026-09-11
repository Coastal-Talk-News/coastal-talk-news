import Link from 'next/link';
import type { PublicBreakingNewsDto } from '@coastal-talk-news/types';

export function BreakingTicker({ items }: { items: PublicBreakingNewsDto[] }) {
  if (items.length === 0) return null;

  return (
    <section aria-label="Breaking news" className="bg-brand text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <span className="text-brand shrink-0 rounded-sm bg-white px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase">
          Breaking
        </span>
        <ul className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto text-sm font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => (
            <li key={item.id} className="shrink-0">
              {item.articleUrl ? (
                <Link
                  href={item.articleUrl}
                  className="whitespace-nowrap transition-opacity hover:opacity-80"
                >
                  {item.headline}
                </Link>
              ) : (
                <span className="whitespace-nowrap">{item.headline}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
