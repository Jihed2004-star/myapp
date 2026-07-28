import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/catalog';
import { CategoryCard } from '../components/cards/CategoryCard';
import { CardSkeletonGrid } from '../components/ui/CardSkeleton';
import Footer from '../components/Footer';

export default function Categories() {
  const [search, setSearch] = useState('');

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const filtered = useMemo(() => {
    if (!categories) return [];
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [categories, search]);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Browse categories
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Pick a category to see the services and elements available to book.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-8">
          {isLoading && <CardSkeletonGrid count={6} />}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
              <p className="font-semibold text-rose-700">Couldn't load categories</p>
              <p className="mt-1 text-sm text-rose-500">
                Something went wrong on our end — try refreshing the page.
              </p>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <p className="font-semibold text-slate-900">
                {search ? 'No categories match your search' : 'No categories yet'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? 'Try a different name.'
                  : 'Check back soon — providers are still setting things up.'}
              </p>
            </div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}