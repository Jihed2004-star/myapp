import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getServices } from '../api/catalog';
import { ServiceCard } from '../components/cards/ServiceCard';
import { CardSkeletonGrid } from '../components/ui/CardSkeleton';
import Footer from '../components/Footer';

export default function Services() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [search, setSearch] = useState('');

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services', categoryId],
    queryFn: () => getServices(categoryId),
    enabled: !!categoryId,
  });

  const filtered = useMemo(() => {
    if (!services) return [];
    const query = search.trim().toLowerCase();
    if (!query) return services;
    return services.filter((service) =>
      service.name.toLowerCase().includes(query)
    );
  }, [services, search]);

  // categoryName isn't fetched separately here — it rides along on each
  // Service from the API, so use it from the first result once loaded.
  const categoryName = services?.[0]?.categoryName;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link
          to="/Categories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All categories
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {categoryName ?? 'Services'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Pick a service to see what's bookable.
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
              placeholder="Search services..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-8">
          {isLoading && <CardSkeletonGrid count={6} />}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
              <p className="font-semibold text-rose-700">Couldn't load services</p>
              <p className="mt-1 text-sm text-rose-500">
                Something went wrong on our end — try refreshing the page.
              </p>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <p className="font-semibold text-slate-900">
                {search ? 'No services match your search' : 'No services in this category yet'}
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
              {filtered.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}