import type { PublicAdvertisementDto } from '@coastal-talk-news/types';

export type AdZone = 'rightColumn' | 'headerBand' | 'midBand' | 'footerBand';

const BAND_ZONES: AdZone[] = ['headerBand', 'midBand', 'footerBand'];

/** How many creatives a single horizontal band carries. */
const BAND_CAPACITY = 5;

/**
 * The side column is the house list: it carries every advertisement, so a
 * reader on any page can see the whole roster. The bands are highlight slots
 * that take a slice off the top of the same ordering, which means a banded
 * creative also appears in the column — deliberate here, unlike the zones,
 * which never repeat each other.
 */
export function adsForZone(
  advertisements: PublicAdvertisementDto[],
  zone: AdZone,
): PublicAdvertisementDto[] {
  if (zone === 'rightColumn') return advertisements;

  const bandIndex = BAND_ZONES.indexOf(zone);
  return advertisements.slice(
    bandIndex * BAND_CAPACITY,
    (bandIndex + 1) * BAND_CAPACITY,
  );
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
