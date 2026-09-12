import type { PublicAdvertisementDto } from '@coastal-talk-news/types';

export type AdZone = 'top' | 'sidebar';

/** A firm cap, not a target — the top band never carries more than this. */
const TOP_CAPACITY = 3;

/**
 * Every advertisement lands in exactly one zone, never both: the first
 * TOP_CAPACITY go in the top band, everything else goes in the sidebar.
 */
export function adsForZone(
  advertisements: PublicAdvertisementDto[],
  zone: AdZone,
): PublicAdvertisementDto[] {
  return zone === 'top'
    ? advertisements.slice(0, TOP_CAPACITY)
    : advertisements.slice(TOP_CAPACITY);
}

export function adAspectRatio(image: PublicAdvertisementDto['image']): number {
  return image.width / image.height;
}

export interface AdRow {
  /** Stable React key for the row. */
  key: string;
  ads: PublicAdvertisementDto[];
  /** Sum of the row's aspect ratios — the row's width-to-height factor. */
  ratioSum: number;
}

interface GalleryOptions {
  maxPerRow: number;
  /**
   * Close a row once its ratios reach this. Row height works out as
   * containerWidth / ratioSum, so a larger budget means shorter rows.
   */
  ratioBudget: number;
}

/**
 * Packs creatives into rows the way a photo gallery does: a row is filled until
 * its combined width-to-height reaches the budget, so wide strips take a row to
 * themselves while squarer ones sit side by side. Nothing is sized in advance —
 * the grouping falls out of the creatives' own resolutions.
 */
export function galleryRows(
  advertisements: PublicAdvertisementDto[],
  { maxPerRow, ratioBudget }: GalleryOptions,
): AdRow[] {
  const rows: AdRow[] = [];
  let ads: PublicAdvertisementDto[] = [];
  let ratioSum = 0;

  const close = () => {
    const [first] = ads;
    if (first) rows.push({ key: first.id, ads, ratioSum });
    ads = [];
    ratioSum = 0;
  };

  for (const ad of advertisements) {
    const ratio = adAspectRatio(ad.image);
    if (ads.length >= maxPerRow || ratioSum + ratio > ratioBudget) close();
    ads.push(ad);
    ratioSum += ratio;
  }
  close();

  return rows;
}

/**
 * Within a row every creative keeps its own ratio and they share one height, so
 * the row is only capped by limiting how wide it may grow.
 */
export function rowMaxWidth(
  row: AdRow,
  maxHeight: number,
  gap: number,
): number {
  return Math.round(maxHeight * row.ratioSum + gap * (row.ads.length - 1));
}
