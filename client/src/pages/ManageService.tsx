import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServiceById, toggleServiceActive, deleteService } from '../api/catalog';
import { createElement } from '../api/elements';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ManageService() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [attrPairs, setAttrPairs] = useState([{ key: '', value: '' }]);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: service, isLoading, error } = useQuery({
    queryKey: ['service', id],
    queryFn: () => getServiceById(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: createElement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setName('');
      setPrice('');
      setAttrPairs([{ key: '', value: '' }]);
      setShowForm(false);
      setFormError(null);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Could not create element.');
    },
  });


  const navigate = useNavigate();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => navigate('/provider/dashboard'),
    onError: (err: any) => setDeleteError(err?.response?.data?.message ?? 'Could not delete service.'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleServiceActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
    },
  });
  function updatePair(index: number, field: 'key' | 'value', value: string) {
    const next = [...attrPairs];
    next[index][field] = value;
    setAttrPairs(next);
  }

  function handleSubmit() {
    if (!id || !name || !price) {
      setFormError('Name and price are required.');
      return;
    }
    const attributes: Record<string, string> = {};
    attrPairs.forEach((p) => {
      if (p.key.trim()) attributes[p.key.trim()] = p.value;
    });

    mutation.mutate({
      serviceId: id,
      name,
      orderIndex: service?.elements.length ?? 0,
      price: parseFloat(price),
      attributes,
    });
  }

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return <div className="text-white p-6"><p className="text-slate-400">You don't have access to this page.</p></div>;
  }

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error || !service) return <p className="text-white p-6">Failed to load service.</p>;

  return (
    <div className="text-white p-6 max-w-2xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{service.name}</h1>
          <p className="text-slate-400">{service.categoryName} · {service.bookingUnit}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleMutation.mutate(service.id)}
            disabled={toggleMutation.isPending}
            className={`text-xs font-medium px-3 py-1.5 rounded-full disabled:opacity-50 ${
              service.isActive
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
          >
            {service.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this service permanently? This cannot be undone.')) {
                deleteMutation.mutate(service.id);
              }
            }}
            disabled={deleteMutation.isPending}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-900/50 text-red-300 hover:bg-red-900 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Elements</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg px-3 py-1.5"
        >
          {showForm ? 'Cancel' : '+ Add Element'}
        </button>
      </div>

      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
          <label className="block text-sm text-slate-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm mb-3"
          />

          <label className="block text-sm text-slate-400 mb-1">Price</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm mb-3"
          />

          <label className="block text-sm text-slate-400 mb-1">Attributes</label>
          {attrPairs.map((pair, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="key (e.g. color)"
                value={pair.key}
                onChange={(e) => updatePair(i, 'key', e.target.value)}
                className="w-1/2 bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="value (e.g. Red)"
                value={pair.value}
                onChange={(e) => updatePair(i, 'value', e.target.value)}
                className="w-1/2 bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          ))}
          <button
            onClick={() => setAttrPairs([...attrPairs, { key: '', value: '' }])}
            className="text-sm text-blue-400 hover:text-blue-300 mb-4"
          >
            + Add attribute
          </button>

          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="block bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            {mutation.isPending ? 'Creating...' : 'Create Element'}
          </button>

          {formError && <p className="text-amber-500 text-sm mt-3">{formError}</p>}
        </div>
      )}
      
        {deleteError && <p className="text-amber-500 text-sm mb-4">{deleteError}</p>}
      <ul className="space-y-3">
        {service.elements.map((el) => (
          <li key={el.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{el.name}</p>
                <p className="text-slate-400 text-sm">${el.price}</p>
              </div>
              <Link
                to={`/provider/elements/${el.id}`}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Manage availability →
              </Link>
            </div>
          </li>
        ))}
        {service.elements.length === 0 && (
          <p className="text-slate-400">No elements yet.</p>
        )}
      </ul>
    </div>
  );
}