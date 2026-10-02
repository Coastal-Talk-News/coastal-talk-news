import { categoryName } from '../../lib/category-name';
import type { Locale } from '../../lib/i18n/types';
import { Tag } from '../ui/Tag';

interface CategoryTagProps {
  category: { id: string; name: string; nameKannada: string | null } | null;
  locale: Locale;
  tone?: 'solid' | 'quiet';
}

export function CategoryTag({
  category,
  locale,
  tone = 'quiet',
}: CategoryTagProps) {
  if (!category) return null;

  return (
    <Tag href={`/category/${category.id}`} tone={tone}>
      {categoryName(category, locale)}
    </Tag>
  );
}
