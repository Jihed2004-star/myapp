import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCategories } from '../api/catalog';

export default function Categories() {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  if (isLoading) return <p>Loading categories...</p>;
  if (error) return <p>Failed to load categories.</p>;

  return (
  <div className="text-white p-6">
    <h1 className="text-2xl font-bold mb-4">Categories</h1>
    <ul className="space-y-2">
      {categories?.map((category) => (
        <li key={category.id}>
          <Link to={`/categories/${category.id}/services`} className="text-blue-400 hover:underline">
            {category.name}
          </Link>
          {category.description && <p className="text-slate-400 text-sm">{category.description}</p>}
        </li>
      ))}
    </ul>
  </div>
);
}
