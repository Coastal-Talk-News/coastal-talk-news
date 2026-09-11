import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  description: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      <p className="text-ink-muted mt-3 max-w-md leading-relaxed">
        {description}
      </p>
      <Link
        href="/"
        className="border-rule hover:border-brand hover:text-brand mt-8 inline-flex h-11 items-center rounded-sm border px-6 text-sm font-semibold transition-colors"
      >
        Back to homepage
      </Link>
    </div>
  );
}
