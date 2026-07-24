import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory, updateCategory, deleteCategory, getAllCategoriesAdmin, toggleCategoryActive } from '../api/catalog';
import { useAuth } from '../context/AuthContext';

export default function CategoryManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['allCategoriesAdmin'],
    queryFn: getAllCategoriesAdmin,
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: resetForm,
    onError: (err: any) => setFormError(err?.response?.data?.message ?? 'Could not create category.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string | null } }) =>
      updateCategory(id, data),
    onSuccess: resetForm,
    onError: (err: any) => setFormError(err?.response?.data?.message ?? 'Could not update category.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      setDeleteError(null);
      queryClient.invalidateQueries({ queryKey: ['allCategoriesAdmin'] });
    },
    onError: (err: any) => setDeleteError(err?.response?.data?.message ?? 'Could not delete category.'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleCategoryActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCategoriesAdmin'] });
    },
  });

  function resetForm() {
    setFormError(null);
    setName('');
    setDescription('');
    setEditingId(null);
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  }

  function startEdit(cat: { id: string; name: string; description: string | null }) {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description ?? '');
    setFormError(null);
  }

  function handleSubmit() {
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    const data = { name, description: description || null };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  }

  if (!user || user.role !== 'Admin') {
    return <div className="text-white p-6"><p className="text-slate-400">You don't have access to this page.</p></div>;
  }

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-white p-6">Failed to load categories.</p>;

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="text-white p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Category Management</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">{editingId ? 'Edit Category' : 'New Category'}</h2>

        <label className="block text-sm text-slate-400 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm mb-3"
        />

        <label className="block text-sm text-slate-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm mb-4"
          rows={2}
        />

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            {isPending ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button
              onClick={resetForm}
              className="text-sm text-slate-400 hover:text-white px-4 py-2"
            >
              Cancel
            </button>
          )}
        </div>

        {formError && <p className="text-amber-500 text-sm mt-3">{formError}</p>}
      </div>

      {deleteError && <p className="text-amber-500 text-sm mb-4">{deleteError}</p>}

      <ul className="space-y-2">
        {categories?.map((cat) => (
          <li
            key={cat.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{cat.name}</p>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    cat.isActive
                      ? 'bg-green-900/50 text-green-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {cat.description && <p className="text-slate-400 text-sm">{cat.description}</p>}
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => startEdit(cat)}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Edit
              </button>
              <button
                onClick={() => toggleMutation.mutate(cat.id)}
                disabled={toggleMutation.isPending}
                className="text-sm text-slate-400 hover:text-white disabled:opacity-50"
              >
                {cat.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={() => deleteMutation.mutate(cat.id)}
                disabled={deleteMutation.isPending}
                className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}