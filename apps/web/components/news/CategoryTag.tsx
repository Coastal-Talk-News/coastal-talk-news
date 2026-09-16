import { Tag } from '../ui/Tag';

interface CategoryTagProps {
  category: { id: string; name: string } | null;
  tone?: 'solid' | 'quiet';
}

export function CategoryTag({ category, tone = 'quiet' }: CategoryTagProps) {
  if (!category) return null;

  return (
    <Tag href={`/category/${category.id}`} tone={tone}>
      {category.name}
    </Tag>
  );
}
