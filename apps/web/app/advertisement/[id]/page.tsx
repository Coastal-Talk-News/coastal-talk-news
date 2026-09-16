import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AdCallToAction } from '../../../components/news/AdCallToAction';
import { ArticleBody } from '../../../components/news/ArticleBody';
import { ShareLinks } from '../../../components/news/ShareLinks';
import { StoryImage } from '../../../components/news/StoryImage';
import { getAdvertisement, getSite } from '../../../lib/api';
import { getDictionary } from '../../../lib/i18n/dictionaries';
import { getLocale } from '../../../lib/i18n/server';
import { buildMetadata } from '../../../lib/seo';
import { getOrigin } from '../../../lib/site-url';

interface AdvertisementPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AdvertisementPageProps): Promise<Metadata> {
  const { id } = await params;
  const [advertisement, { settings }, locale, origin] = await Promise.all([
    getAdvertisement(id),
    getSite(),
    getLocale(),
    getOrigin(),
  ]);
  if (!advertisement) return { title: 'Advertisement not found' };

  return buildMetadata({
    settings,
    locale,
    origin,
    title: advertisement.advertiserName,
    description: advertisement.metaDescription,
    image: advertisement.detailImage ?? advertisement.image,
    path: `/advertisement/${advertisement.id}`,
  });
}

export default async function AdvertisementPage({
  params,
}: AdvertisementPageProps) {
  const { id } = await params;
  const [advertisement, locale] = await Promise.all([
    getAdvertisement(id),
    getLocale(),
  ]);
  if (!advertisement) notFound();

  const dictionary = getDictionary(locale);
  const ad = dictionary.advertisement;
  const shareUrl = `${await getOrigin()}/advertisement/${advertisement.id}`;
  // The detail creative is the point of this page; the banner stands in for it
  // when the advertiser only supplied the one image.
  const image = advertisement.detailImage ?? advertisement.image;

  return (
    <article className="max-w-[44rem] xl:max-w-[52rem] py-6 pb-24 sm:py-8 sm:pb-8">
      <nav
        aria-label="Breadcrumb"
        className="text-ink-subtle mb-4 flex items-center gap-1.5 text-sm"
      >
        <Link href="/" className="hover:text-brand transition-colors">
          {dictionary.common.home}
        </Link>
        <span aria-hidden>/</span>
        <Link
          href="/advertisements"
          className="hover:text-brand transition-colors"
        >
          {ad.allTitle}
        </Link>
      </nav>

      <header>
        {/* Tinted rather than solid, so the button below stays the only strong
            red on the page. No letter-spacing and no uppercase: both are Latin
            habits, and tracking pulls Kannada conjuncts apart. */}
        <Link
          href="/advertisements"
          className="bg-brand-soft text-brand hover:bg-brand inline-flex w-fit items-center rounded-sm px-2.5 py-1 text-xs font-semibold transition-colors hover:text-white"
        >
          {dictionary.common.advertisement}
        </Link>

        <h1 className="mt-2 font-serif text-3xl leading-tight font-bold text-balance sm:text-4xl">
          {advertisement.advertiserName}
        </h1>

        {/* Hidden on a phone, where the fixed bar below is the one CTA -
            showing both would just repeat the same button twice. */}
        {advertisement.destinationUrl && (
          <div className="mt-5 hidden sm:block">
            <AdCallToAction
              url={advertisement.destinationUrl}
              label={ad.visitWebsite}
            />
          </div>
        )}
      </header>

      {/* Runs the full width of the column so both its edges line up with the
          type, rather than floating inside a margin of its own. No frame:
          artwork that already has a border does not need a second one, and it
          is never drawn larger than the file the advertiser supplied. */}
      <figure className="border-rule mt-6 border-t pt-6">
        <StoryImage
          image={image}
          alt={advertisement.advertiserName}
          priority
          sizes="(min-width: 768px) 704px, 100vw"
          className="rounded-card h-auto w-full"
          style={{ maxWidth: image.width }}
        />
      </figure>

      {advertisement.description && (
        <div className="mt-6">
          <ArticleBody content={advertisement.description} />
        </div>
      )}

      <footer className="border-rule mt-8 border-t pt-5">
        <ShareLinks
          url={shareUrl}
          headline={advertisement.advertiserName}
          locale={locale}
        />
      </footer>

      <p className="mt-6">
        <Link
          href="/advertisements"
          className="text-brand hover:text-brand-hover text-sm font-semibold transition-colors"
        >
          &larr; {ad.backToAll}
        </Link>
      </p>

      {advertisement.destinationUrl && (
        <AdCallToAction
          url={advertisement.destinationUrl}
          label={ad.visitWebsite}
          variant="sticky"
        />
      )}
    </article>
  );
}
