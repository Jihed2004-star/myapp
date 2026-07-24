import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getServices } from '../api/catalog';

export default function Services() {
  const { categoryId } = useParams<{ categoryId: string }>();

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services', categoryId],
    queryFn: () => getServices(categoryId),
    enabled: !!categoryId,
  });

  if (isLoading) return <p className="text-white p-6">Loading services...</p>;
  if (error) return <p className="text-white p-6">Failed to load services.</p>;

  return (
    <div className="text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Services</h1>
      <ul className="space-y-2">
        {services?.map((service) => (
          <li key={service.id}>
            <Link to={`/services/${service.id}`} className="text-blue-400 hover:underline">
              {service.name}
            </Link>
            {service.description && (
              <p className="text-slate-400 text-sm">{service.description}</p>
            )}
          </li>
        ))}
        {services?.length === 0 && <li className="text-slate-400">No services in this category yet.</li>}
      </ul>
    </div>
  );
}
