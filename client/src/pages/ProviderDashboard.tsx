import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyServices } from '../api/catalog';
import { useAuth } from '../context/AuthContext';

export default function ProviderDashboard() {
  const { user } = useAuth();

  const { data: services, isLoading, error } = useQuery({
    queryKey: ['myServices'],
    queryFn: getMyServices,
    enabled: !!user && (user.role === 'Provider' || user.role === 'Admin'),
  });

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return (
      <div className="text-white p-6">
        <p className="text-slate-400">You don't have access to this page.</p>
      </div>
    );
  }

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-white p-6">Failed to load your services.</p>;

  return (
    <div className="text-white p-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Services</h1>
        <Link
          to="/provider/services/new"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          + New Service
        </Link>
      </div>

      {services?.length === 0 && (
        <p className="text-slate-400">You haven't created any services yet.</p>
      )}

      <ul className="space-y-3">
        {services?.map((service) => (
          <li
            key={service.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{service.name}</p>
                <p className="text-slate-400 text-sm">{service.categoryName}</p>
                <p className="text-slate-500 text-xs mt-1">
                  {service.elements.length} element{service.elements.length !== 1 ? 's' : ''} · {service.bookingUnit}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  service.isActive
                    ? 'bg-green-900/50 text-green-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {service.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <Link
              to={`/provider/services/${service.id}`}
              className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              Manage →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}