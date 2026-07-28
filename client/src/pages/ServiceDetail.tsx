import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getServiceById } from '../api/catalog';
import { ElementCard } from '../components/cards/ElementCard';
import { StatusBadge } from '../components/ui/Badge';
import { CardSkeletonGrid } from '../components/ui/CardSkeleton';
import Footer from '../components/Footer';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [search, setSearch] = useState('');

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => getServiceById(id!),
    enabled: !!id,
  });

  const filtered = useMemo(() => {
    if (!service) return [];
    const query = search.trim().toLowerCase();
    if (!query) return service.elements;
    return service.elements.filter((el) =>
      el.name.toLowerCase().includes(query)
    );
  }, [service, search]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-8 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-8">
            <CardSkeletonGrid count={3} />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center">
            <p className="font-semibold text-rose-700">
              {error ? "Couldn't load this service" : 'Service not found'}
            </p>
            <p className="mt-1 text-sm text-rose-500">
              {error
                ? 'Something went wrong on our end — try refreshing the page.'
                : "This service doesn't exist or may have been removed."}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link
          to={`/categories/${service.categoryId}/services`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-indigo-600"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to {service.categoryName}
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-indigo-600">
            {service.categoryName}
          </span>
          <StatusBadge isActive={service.isActive} />
        </div>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          {service.name}
        </h1>
        {service.description && (
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            {service.description}
          </p>
        )}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Elements</h2>

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
              placeholder="Search elements..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-6">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-16 text-center">
              <p className="font-semibold text-slate-900">
                {search ? 'No elements match your search' : 'No elements listed yet'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? 'Try a different name.'
                  : 'The provider hasn\u2019t added anything bookable here yet.'}
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((element) => (
                <ElementCard key={element.id} element={element} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}