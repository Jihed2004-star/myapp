import type { Category } from '../../types/catalog';
import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/Badge';

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Card
      imageAlt={category.name}
      cornerBadge={<StatusBadge isActive={category.isActive} />}
      footerLabel="Browse services"
      footerTo={`/categories/${category.id}/services`}
    >
      <h3 className="text-lg font-bold text-slate-900">{category.name}</h3>
      {category.description && (
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {category.description}
        </p>
      )}
    </Card>
  );
}