import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getCategories, createService } from '../api/catalog';
import type { BookingUnit } from '../types/catalog';
import { useAuth } from '../context/AuthContext';

export default function CreateService() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bookingUnit, setBookingUnit] = useState<BookingUnit>('Hourly');
  const [formError, setFormError] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const mutation = useMutation({
    mutationFn: createService,
    onSuccess: (service) => {
      navigate(`/provider/services/${service.id}`);
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Could not create service.');
    },
  });

  function handleSubmit() {
    if (!categoryId || !name) {
      setFormError('Category and name are required.');
      return;
    }
    setFormError(null);
    mutation.mutate({
      categoryId,
      name,
      description: description || null,
      isActive: true,
      bookingUnit,
    });
  }

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return (
      <div className="text-white p-6">
        <p className="text-slate-400">You don't have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="text-white p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">New Service</h1>

      <label className="block text-sm text-slate-400 mb-1">Category</label>
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm mb-4"
      >
        <option value="">Select a category</option>
        {categories?.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      <label className="block text-sm text-slate-400 mb-1">Name</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm mb-4"
      />

      <label className="block text-sm text-slate-400 mb-1">Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm mb-4"
        rows={3}
      />

      <label className="block text-sm text-slate-400 mb-1">Booking granularity</label>
      <select
        value={bookingUnit}
        onChange={(e) => setBookingUnit(e.target.value as BookingUnit)}
        className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm mb-6"
      >
        <option value="Hourly">Hourly</option>
        <option value="Daily">Daily</option>
      </select>

      <button
        onClick={handleSubmit}
        disabled={mutation.isPending}
        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
      >
        {mutation.isPending ? 'Creating...' : 'Create Service'}
      </button>

      {formError && <p className="text-amber-500 text-sm mt-3">{formError}</p>}
    </div>
  );
}