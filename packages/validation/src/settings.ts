import { Type } from '@sinclair/typebox';
import { ArticleContentSchema } from './article.js';
import { IsoDateTime } from './envelope.js';
import { MediaSummarySchema } from './media.js';
import {
  SETTINGS_SITE_NAME_MAX,
  SETTINGS_TAGLINE_MAX,
  SETTINGS_EMAIL_MAX,
  SETTINGS_PHONE_MAX,
  SETTINGS_ADDRESS_MAX,
  SETTINGS_SOCIAL_URL_MAX,
  SETTINGS_PAGE_TITLE_MAX,
  SETTINGS_PAGE_INTRO_MAX,
  SETTINGS_HOURS_MAX,
  SETTINGS_SEO_TITLE_MAX,
  SETTINGS_META_DESCRIPTION_MAX,
} from './limits.js';

export {
  SETTINGS_SITE_NAME_MAX,
  SETTINGS_TAGLINE_MAX,
  SETTINGS_EMAIL_MAX,
  SETTINGS_PHONE_MAX,
  SETTINGS_ADDRESS_MAX,
  SETTINGS_SOCIAL_URL_MAX,
  SETTINGS_PAGE_TITLE_MAX,
  SETTINGS_PAGE_INTRO_MAX,
  SETTINGS_HOURS_MAX,
  SETTINGS_SEO_TITLE_MAX,
  SETTINGS_META_DESCRIPTION_MAX,
};

const NullableId = Type.Union([Type.String({ format: 'uuid' }), Type.Null()]);
const NullableMedia = Type.Union([MediaSummarySchema, Type.Null()]);

function nullableString(maxLength: number) {
  return Type.Union([Type.String({ maxLength }), Type.Null()]);
}

function nullableFormatted(format: 'email' | 'uri', maxLength: number) {
  return Type.Union([Type.String({ format, maxLength }), Type.Null()]);
}

export const SiteSettingsSchema = Type.Object({
  id: Type.String(),
  siteName: Type.String(),
  tagline: Type.Union([Type.String(), Type.Null()]),
  logo: NullableMedia,
  favicon: NullableMedia,
  contactEmail: Type.Union([Type.String(), Type.Null()]),
  contactPhone: Type.Union([Type.String(), Type.Null()]),
  contactAddress: Type.Union([Type.String(), Type.Null()]),
  aboutTitle: Type.Union([Type.String(), Type.Null()]),
  aboutIntro: Type.Union([Type.String(), Type.Null()]),
  aboutContent: Type.Union([ArticleContentSchema, Type.Null()]),
  aboutContentKannada: Type.Union([ArticleContentSchema, Type.Null()]),
  contactTitle: Type.Union([Type.String(), Type.Null()]),
  contactIntro: Type.Union([Type.String(), Type.Null()]),
  contactHours: Type.Union([Type.String(), Type.Null()]),
  advertiseTitle: Type.Union([Type.String(), Type.Null()]),
  advertiseIntro: Type.Union([Type.String(), Type.Null()]),
  advertiseContent: Type.Union([ArticleContentSchema, Type.Null()]),
  privacyContent: Type.Union([ArticleContentSchema, Type.Null()]),
  facebookUrl: Type.Union([Type.String(), Type.Null()]),
  instagramUrl: Type.Union([Type.String(), Type.Null()]),
  youtubeUrl: Type.Union([Type.String(), Type.Null()]),
  xUrl: Type.Union([Type.String(), Type.Null()]),
  whatsappEnglishUrl: Type.Union([Type.String(), Type.Null()]),
  whatsappKannadaUrl: Type.Union([Type.String(), Type.Null()]),
  defaultSeoTitle: Type.Union([Type.String(), Type.Null()]),
  defaultMetaDescription: Type.Union([Type.String(), Type.Null()]),
  defaultOgImage: NullableMedia,
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});

export const UpdateSiteSettingsBodySchema = Type.Object(
  {
    siteName: Type.Optional(
      Type.String({ minLength: 1, maxLength: SETTINGS_SITE_NAME_MAX }),
    ),
    tagline: Type.Optional(nullableString(SETTINGS_TAGLINE_MAX)),
    logoMediaId: Type.Optional(NullableId),
    faviconMediaId: Type.Optional(NullableId),
    contactEmail: Type.Optional(nullableFormatted('email', SETTINGS_EMAIL_MAX)),
    contactPhone: Type.Optional(nullableString(SETTINGS_PHONE_MAX)),
    contactAddress: Type.Optional(nullableString(SETTINGS_ADDRESS_MAX)),
    aboutTitle: Type.Optional(nullableString(SETTINGS_PAGE_TITLE_MAX)),
    aboutIntro: Type.Optional(nullableString(SETTINGS_PAGE_INTRO_MAX)),
    aboutContent: Type.Optional(
      Type.Union([ArticleContentSchema, Type.Null()]),
    ),
    aboutContentKannada: Type.Optional(
      Type.Union([ArticleContentSchema, Type.Null()]),
    ),
    contactTitle: Type.Optional(nullableString(SETTINGS_PAGE_TITLE_MAX)),
    contactIntro: Type.Optional(nullableString(SETTINGS_PAGE_INTRO_MAX)),
    contactHours: Type.Optional(nullableString(SETTINGS_HOURS_MAX)),
    advertiseTitle: Type.Optional(nullableString(SETTINGS_PAGE_TITLE_MAX)),
    advertiseIntro: Type.Optional(nullableString(SETTINGS_PAGE_INTRO_MAX)),
    advertiseContent: Type.Optional(
      Type.Union([ArticleContentSchema, Type.Null()]),
    ),
    privacyContent: Type.Optional(
      Type.Union([ArticleContentSchema, Type.Null()]),
    ),
    facebookUrl: Type.Optional(
      nullableFormatted('uri', SETTINGS_SOCIAL_URL_MAX),
    ),
    instagramUrl: Type.Optional(
      nullableFormatted('uri', SETTINGS_SOCIAL_URL_MAX),
    ),
    youtubeUrl: Type.Optional(
      nullableFormatted('uri', SETTINGS_SOCIAL_URL_MAX),
    ),
    xUrl: Type.Optional(nullableFormatted('uri', SETTINGS_SOCIAL_URL_MAX)),
    whatsappEnglishUrl: Type.Optional(
      nullableFormatted('uri', SETTINGS_SOCIAL_URL_MAX),
    ),
    whatsappKannadaUrl: Type.Optional(
      nullableFormatted('uri', SETTINGS_SOCIAL_URL_MAX),
    ),
    defaultSeoTitle: Type.Optional(nullableString(SETTINGS_SEO_TITLE_MAX)),
    defaultMetaDescription: Type.Optional(
      nullableString(SETTINGS_META_DESCRIPTION_MAX),
    ),
    defaultOgImageId: Type.Optional(NullableId),
  },
  {
    minProperties: 1,
    additionalProperties: false,
  },
);
