'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-3xl font-bold sm:text-4xl">
        We could not load the news
      </h1>
      <p className="text-ink-muted mt-3 max-w-md leading-relaxed">
        Something went wrong while fetching the latest stories. Please try again
        in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="bg-brand hover:bg-brand-hover mt-8 inline-flex h-11 items-center rounded-sm px-6 text-sm font-semibold text-white transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
