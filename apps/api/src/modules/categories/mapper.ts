import type { CategoryDto, CmsCategoryDto } from '@coastal-talk-news/types';

interface MediaRow {
  id: string;
  storageKey: string;
  width: number;
  height: number;
}

export interface CategoryEntity {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  media: MediaRow | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ToPublicUrl = (storageKey: string) => string;

export function toCategoryDto(
  category: CategoryEntity,
  toPublicUrl: ToPublicUrl,
): CategoryDto {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    displayOrder: category.displayOrder,
    coverImage: category.media
      ? {
          id: category.media.id,
          url: toPublicUrl(category.media.storageKey),
          width: category.media.width,
          height: category.media.height,
        }
      : null,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function toCmsCategoryDto(
  category: CategoryEntity & { _count: { articles: number } },
  toPublicUrl: ToPublicUrl,
): CmsCategoryDto {
  return {
    ...toCategoryDto(category, toPublicUrl),
    articleCount: category._count.articles,
  };
}
