import type { Id, IsoDateTime } from './api.js';
import type { MediaSummaryDto } from './media.js';

export interface CategoryDto {
  id: Id;
  name: string;
  /** Required on every new or edited category. Null only on categories saved
   * before it was required — the reader site falls back to `name` for those. */
  nameKannada: string | null;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  /** Null means top-level. Capped at two levels — see the schema doc-comment. */
  parentId: Id | null;
  coverImage: MediaSummaryDto | null;
  /** The public address is /category/<slug>. Null only on categories saved
   * before slugs existed and not yet backfilled. */
  slug: string | null;
  /** Search-result title and description; the public site falls back to
   * "<name> News | <site>" and a generic line when these are empty. */
  seoTitle: string | null;
  metaDescription: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CmsCategoryDto extends CategoryDto {
  articleCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  nameKannada: string;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  parentId?: Id | null;
  coverImageId?: Id | null;
  /** Omitted on create: made from the name. A rename never changes it. */
  slug?: string;
  seoTitle?: string | null;
  metaDescription?: string | null;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface ReorderCategoriesRequest {
  /** Null reorders the top-level group; an id reorders that parent's children. */
  parentId: Id | null;
  ids: Id[];
}
