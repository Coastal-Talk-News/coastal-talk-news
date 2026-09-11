import Link from 'next/link';

interface CategoryTagProps {
  category: { id: string; name: string } | null;
  tone?: 'solid' | 'quiet';
}

export function CategoryTag({ category, tone = 'quiet' }: CategoryTagProps) {
  if (!category) return null;

  const className =
    tone === 'solid'
      ? 'bg-brand text-white'
      : 'bg-brand-soft text-brand hover:bg-brand hover:text-white';

  return (
    <Link
      href={`/category/${category.id}`}
      className={`${className} inline-flex w-fit items-center rounded-sm px-2 py-0.5 text-[11px] font-semibold tracking-[0.08em] uppercase transition-colors`}
    >
      {category.name}
    </Link>
  );
}
