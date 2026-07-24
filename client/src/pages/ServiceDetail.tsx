import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getServiceById } from '../api/catalog';

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => getServiceById(id!),
    enabled: !!id,
  });

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-white p-6">Failed to load service.</p>;
  if (!service) return <p className="text-white p-6">Service not found.</p>;

  return (
    <div className="text-white p-6">
      <p className="text-slate-400 text-sm mb-1">{service.categoryName}</p>
      <h1 className="text-2xl font-bold mb-2">{service.name}</h1>
      {service.description && <p className="text-slate-300 mb-6">{service.description}</p>}

      <h2 className="text-lg font-semibold mb-2">Elements</h2>
      <ul className="space-y-2">
        {service.elements.map((el) => (
          <li key={el.id}>
            <Link to={`/elements/${el.id}`} className="text-blue-400 hover:underline">
              {el.name} — ${el.price}
            </Link>
          </li>
        ))}
        {service.elements.length === 0 && (
          <li className="text-slate-400">No elements listed yet.</li>
        )}
      </ul>
    </div>
  );
}
