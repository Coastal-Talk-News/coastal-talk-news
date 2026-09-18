import type { Id, IsoDateTime } from './api.js';
import type { MediaSummaryDto } from './media.js';

export interface CategoryDto {
  id: Id;
  name: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  /** Null means top-level. Capped at two levels — see the schema doc-comment. */
  parentId: Id | null;
  coverImage: MediaSummaryDto | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface CmsCategoryDto extends CategoryDto {
  articleCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  parentId?: Id | null;
  coverImageId?: Id | null;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface ReorderCategoriesRequest {
  /** Null reorders the top-level group; an id reorders that parent's children. */
  parentId: Id | null;
  ids: Id[];
}
