import type { PublicAdvertisementDto } from '@coastal-talk-news/types';

export type AdZone = 'masthead' | 'top' | 'sidebar';

const ZONE_PLACEMENT: Record<AdZone, PublicAdvertisementDto['placement']> = {
  masthead: 'MASTHEAD',
  top: 'TOP',
  sidebar: 'SIDEBAR',
};

/**
 * Every creative links to the ad's own page rather than straight out to the
 * advertiser, because that page is where the detail image, the copy and the
 * advertiser's own link live.
 */
export function adHref(id: string): string {
  return `/advertisement/${id}`;
}

/**
 * Every advertisement lands in exactly one zone, driven by its CMS-assigned
 * placement. Masthead holds 1 and Top 3, both capped server-side (apps/api);
 * Sidebar is uncapped.
 */
export function adsForZone(
  advertisements: PublicAdvertisementDto[],
  zone: AdZone,
): PublicAdvertisementDto[] {
  return advertisements.filter((ad) => ad.placement === ZONE_PLACEMENT[zone]);
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
  /**
   * How different two creatives' shapes may be before they stop sharing a row.
   * Everything in a row is drawn at one height, so a portrait beside a wide
   * landscape is squeezed to a sliver — in a narrow column that is worse than
   * simply giving each its own row.
   */
  maxShapeSpread?: number;
}

/**
 * Packs creatives into rows the way a photo gallery does: a row is filled until
 * its combined width-to-height reaches the budget, so wide strips take a row to
 * themselves while squarer ones sit side by side. Nothing is sized in advance —
 * the grouping falls out of the creatives' own resolutions.
 */
export function galleryRows(
  advertisements: PublicAdvertisementDto[],
  { maxPerRow, ratioBudget, maxShapeSpread = Infinity }: GalleryOptions,
): AdRow[] {
  const rows: AdRow[] = [];
  let ads: PublicAdvertisementDto[] = [];
  let ratios: number[] = [];

  const close = () => {
    const [first] = ads;
    if (first) {
      rows.push({
        key: first.id,
        ads,
        ratioSum: ratios.reduce((sum, ratio) => sum + ratio, 0),
      });
    }
    ads = [];
    ratios = [];
  };

  for (const ad of advertisements) {
    const ratio = adAspectRatio(ad.image);
    const ratioSum = ratios.reduce((sum, value) => sum + value, 0);
    const spread =
      ratios.length === 0
        ? 1
        : Math.max(...ratios, ratio) / Math.min(...ratios, ratio);

    const full =
      ads.length >= maxPerRow ||
      ratioSum + ratio > ratioBudget ||
      spread > maxShapeSpread;
    if (full) close();

    ads.push(ad);
    ratios.push(ratio);
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

/**
 * Sidebar advertisers all buy the same zone, so no one of them owns the top of
 * it. Shuffling per request shares that position out: over a run, every ad
 * spends time at the top instead of the same one holding it for weeks.
 *
 * The Top band is deliberately not shuffled - those three slots are sold by
 * position, and the API already returns them in their CMS-assigned order.
 */
export function rotated(
  advertisements: PublicAdvertisementDto[],
): PublicAdvertisementDto[] {
  const order = [...advertisements];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]] as [
      PublicAdvertisementDto,
      PublicAdvertisementDto,
    ];
  }
  return order;
}
