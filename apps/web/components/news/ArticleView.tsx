import Image from 'next/image';
import type {
  PublicArticleDto,
  PublicSiteSettingsDto,
} from '@coastal-talk-news/types';
import { formatDateTime } from '../../lib/format';
import { getDictionary } from '../../lib/i18n/dictionaries';
import type { Locale } from '../../lib/i18n/types';
import { ArticleBody } from './ArticleBody';
import { ArticleTags } from './ArticleTags';
import { ArticleFigure } from './ArticleFigure';
import { CategoryTag } from './CategoryTag';
import { ShareLinks } from './ShareLinks';
import { YoutubeEmbed } from './YoutubeEmbed';

interface ArticleViewProps {
  article: PublicArticleDto;
  settings: PublicSiteSettingsDto;
  locale: Locale;
  shareUrl: string;
}

/**
 * The article page as a reader gets it. Shared by the published page and the
 * editor's preview, so a preview can never drift from the real thing.
 */
export function ArticleView({
  article,
  settings,
  locale,
  shareUrl,
}: ArticleViewProps) {
  const dictionary = getDictionary(locale);

  return (
    // A news column is capped by line length rather than by the grid: past
    // roughly 70 characters a reader starts losing their place between lines.
    <article className="text-ink [--color-ink-muted:#000000] [--color-ink:#000000] max-w-[44rem] min-[1120px]:max-w-[52rem] py-6 sm:py-8">
      {/* The room under the header is what sets the cover apart from the byline
          rule; without it the picture sits right against the line. */}
      <header className="mb-8 sm:mb-10">
        <CategoryTag category={article.category} locale={locale} />

        {/* Never larger than the masthead: these track Brand's NAME_SIZE.lg
            breakpoint for breakpoint. */}
        <h1 className="headline-xl mt-3 font-serif leading-tight font-bold text-balance">
          {article.headline}
        </h1>

        {/* The standfirst. A handful of articles open the body with this same
            sentence, in which case it reads twice — but that is an authoring
            habit, and dropping it would cost every other article its summary. */}
        {/* Set at the body's size: the standfirst is the article's opening
            paragraph, so anything larger reads as a second headline. */}
        <p className="text-ink-muted font-article mt-3 text-[1rem] leading-relaxed text-justify sm:text-[1.125rem]">
          {article.summary}
        </p>

        <div className="border-rule mt-5 flex flex-wrap items-center justify-between gap-4 border-y py-3">
          <time
            dateTime={article.publicationDate}
            className="text-ink-subtle text-sm"
          >
            {formatDateTime(article.publicationDate)}
          </time>
          <ShareLinks
            url={shareUrl}
            headline={article.headline}
            locale={locale}
            whatsappEnglishUrl={settings.whatsappEnglishUrl}
            whatsappKannadaUrl={settings.whatsappKannadaUrl}
          />
        </div>
      </header>

      {article.coverImage && (
        <ArticleFigure
          placement={article.coverImage.placement}
          widthPercent={article.coverImage.widthPercent}
        >
          <Image
            src={article.coverImage.url}
            alt=""
            width={article.coverImage.width}
            height={article.coverImage.height}
            priority
            sizes="(min-width: 768px) 704px, 100vw"
            className="rounded-card h-auto w-full"
          />
        </ArticleFigure>
      )}

      <ArticleBody content={article.content} />

      {article.youtubeUrl && (
        <YoutubeEmbed url={article.youtubeUrl} title={article.headline} />
      )}

      <ArticleTags tags={article.tags} label={dictionary.article.tagsLabel} />

      <footer className="border-rule bg-paper-sunken rounded-card mt-8 border p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div>
            <h2 className="font-serif text-lg font-bold">
              {dictionary.article.shareHeading}
            </h2>
            <p className="text-ink-subtle mt-1 text-sm">
              {dictionary.article.shareDescription}
            </p>
          </div>
          <ShareLinks
            url={shareUrl}
            headline={article.headline}
            locale={locale}
            variant="panel"
            whatsappEnglishUrl={settings.whatsappEnglishUrl}
            whatsappKannadaUrl={settings.whatsappKannadaUrl}
          />
        </div>
      </footer>
    </article>
  );
}
