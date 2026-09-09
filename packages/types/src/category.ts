import type { Id, IsoDateTime } from './api.js';
import type { MediaSummaryDto } from './media.js';

export interface CategoryDto {
  id: Id;
  name: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  coverImage: MediaSummaryDto | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** CMS view. articleCount drives the disabled state of the delete button. */
export interface CmsCategoryDto extends CategoryDto {
  articleCount: number;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
  isActive?: boolean;
  displayOrder?: number;
  coverImageId?: Id | null;
}

export type UpdateCategoryRequest = Partial<CreateCategoryRequest>;

export interface ReorderCategoriesRequest {
  ids: Id[];
}
