/**
 * The crop math itself lives in @coastal-talk-news/types so the reader site
 * draws exactly the same frame this preview does - this file just keeps the
 * CMS's own import names and defaults unchanged for everything that already
 * imports from it.
 */
export {
  AD_ZOOM_MAX as ZOOM_MAX,
  AD_ZOOM_MIN as ZOOM_MIN,
  DEFAULT_AD_CROP as DEFAULT_CROP,
  clampAdCrop as clampCrop,
  coverZoom,
  visibleAdBox,
} from '@coastal-talk-news/types';
