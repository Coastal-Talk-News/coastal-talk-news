import { Type } from '@sinclair/typebox';
import { IsoDateTime } from './envelope.js';
import { MediaSummarySchema } from './media.js';

export const SETTINGS_SITE_NAME_MAX = 120;
export const SETTINGS_TAGLINE_MAX = 160;
export const SETTINGS_DESCRIPTION_MAX = 160;
export const SETTINGS_EMAIL_MAX = 254;
export const SETTINGS_PHONE_MAX = 32;
export const SETTINGS_ADDRESS_MAX = 200;
export const SETTINGS_SOCIAL_URL_MAX = 300;
export const SETTINGS_SEO_TITLE_MAX = 60;
export const SETTINGS_META_DESCRIPTION_MAX = 160;

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
  description: Type.Union([Type.String(), Type.Null()]),
  logo: NullableMedia,
  favicon: NullableMedia,
  contactEmail: Type.Union([Type.String(), Type.Null()]),
  contactPhone: Type.Union([Type.String(), Type.Null()]),
  contactAddress: Type.Union([Type.String(), Type.Null()]),
  facebookUrl: Type.Union([Type.String(), Type.Null()]),
  instagramUrl: Type.Union([Type.String(), Type.Null()]),
  youtubeUrl: Type.Union([Type.String(), Type.Null()]),
  xUrl: Type.Union([Type.String(), Type.Null()]),
  defaultSeoTitle: Type.Union([Type.String(), Type.Null()]),
  defaultMetaDescription: Type.Union([Type.String(), Type.Null()]),
  defaultOgImage: NullableMedia,
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});

// Fully optional/nullable, matching actual DB nullability — even siteName,
// which is required at the column level, stays optional here so a PATCH from
// one tab (e.g. SEO) doesn't need to resend fields it doesn't own. "Required
// to save" for General-tab fields is enforced client-side only, not here.
export const UpdateSiteSettingsBodySchema = Type.Object(
  {
    siteName: Type.Optional(
      Type.String({ minLength: 1, maxLength: SETTINGS_SITE_NAME_MAX }),
    ),
    tagline: Type.Optional(nullableString(SETTINGS_TAGLINE_MAX)),
    description: Type.Optional(nullableString(SETTINGS_DESCRIPTION_MAX)),
    logoMediaId: Type.Optional(NullableId),
    faviconMediaId: Type.Optional(NullableId),
    contactEmail: Type.Optional(nullableFormatted('email', SETTINGS_EMAIL_MAX)),
    contactPhone: Type.Optional(nullableString(SETTINGS_PHONE_MAX)),
    contactAddress: Type.Optional(nullableString(SETTINGS_ADDRESS_MAX)),
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
    defaultSeoTitle: Type.Optional(nullableString(SETTINGS_SEO_TITLE_MAX)),
    defaultMetaDescription: Type.Optional(
      nullableString(SETTINGS_META_DESCRIPTION_MAX),
    ),
    defaultOgImageId: Type.Optional(NullableId),
  },
  {
    // Rejects an empty PATCH rather than reporting success for a no-op.
    minProperties: 1,
    additionalProperties: false,
  },
);
