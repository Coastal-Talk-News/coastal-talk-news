export const ARTICLE_HEADLINE_MAX = 200;
export const ARTICLE_SUMMARY_MAX = 300;
export const ARTICLE_SEO_TITLE_MAX = 70;
export const ARTICLE_META_DESCRIPTION_MAX = 300;
export const ARTICLE_TAG_MAX = 40;
export const ARTICLE_TAGS_MAX = 10;

export const CATEGORY_NAME_MAX = 60;
export const CATEGORY_DESCRIPTION_MAX = 500;

export const BREAKING_NEWS_HEADLINE_MAX = 150;

export const ADVERTISER_NAME_MAX = 120;
export const DESTINATION_URL_MAX = 2048;

export const SETTINGS_SITE_NAME_MAX = 120;
export const SETTINGS_TAGLINE_MAX = 160;
export const SETTINGS_EMAIL_MAX = 254;
export const SETTINGS_PHONE_MAX = 32;
export const SETTINGS_ADDRESS_MAX = 200;
export const SETTINGS_SOCIAL_URL_MAX = 300;
/** About / Contact / Advertise each have their own heading and standfirst. */
export const SETTINGS_PAGE_TITLE_MAX = 120;
export const SETTINGS_PAGE_INTRO_MAX = 300;
export const SETTINGS_HOURS_MAX = 120;

export const SETTINGS_SEO_TITLE_MAX = 60;
export const SETTINGS_META_DESCRIPTION_MAX = 160;

/** 5 minutes to 7 days - below that isn't worth caching, above it risks a
 *  correction sitting live too long if the automatic on-save invalidation
 *  were ever missed. */
export const SETTINGS_ARTICLE_CACHE_MINUTES_MIN = 5;
export const SETTINGS_ARTICLE_CACHE_MINUTES_MAX = 10_080;

export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt reads only the first 72 bytes of its input and silently ignores the
 *  rest, so a longer password would be weaker than it looks. */
export const PASSWORD_MAX_BYTES = 72;

/** Room for a six-digit code or a formatted recovery code with stray spaces. */
export const TWO_FACTOR_CODE_MAX = 32;

/** An image narrower than this is too small to be worth placing. */
export const IMAGE_WIDTH_MIN_PERCENT = 10;
export const IMAGE_WIDTH_MAX_PERCENT = 100;
/** Smallest crop side, as a fraction of the picture, so a stray click on the
 *  crop tool cannot leave a sliver. */
export const IMAGE_CROP_MIN_FRACTION = 0.05;
export const IMAGE_CAPTION_MAX = 300;
/** Width for a picture the editor has not sized, and for older body images
 *  that were saved before sizes existed. */
export const IMAGE_DEFAULT_WIDTH_PERCENT = 60;
