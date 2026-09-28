import type { ImageCrop, ImagePlacement } from '@coastal-talk-news/types';

/**
 * What an image node carries in the editor. Unset values stay null and are
 * dropped when the API saves the document.
 */
export interface ImageAttrs {
  /** The library picture. Null for one pasted in from outside. */
  mediaId: string | null;
  /** The original's URL, filled in by the API on the way in. */
  src: string | null;
  /** Shown as the caption, and read aloud when there is no other text. */
  title: string | null;
  widthPercent: number | null;
  placement: ImagePlacement | null;
  crop: ImageCrop | null;
  /** The original's pixel size, needed to draw a crop. */
  naturalWidth: number | null;
  naturalHeight: number | null;
}
