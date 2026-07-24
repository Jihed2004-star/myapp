import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllUsers, updateUserRole } from '../api/users';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Customer', 'Provider', 'Admin'];

export default function UserManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [roleError, setRoleError] = useState<string | null>(null);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['allUsers'],
    queryFn: getAllUsers,
    enabled: user?.role === 'Admin',
  });

  const mutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRole(id, role),
    onSuccess: () => {
      setRoleError(null);
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
    },
    onError: (err: any) => {
      setRoleError(err?.response?.data?.message ?? 'Could not update role.');
    },
  });

  if (!user || user.role !== 'Admin') {
    return <div className="text-white p-6"><p className="text-slate-400">You don't have access to this page.</p></div>;
  }

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-white p-6">Failed to load users.</p>;

  return (
    <div className="text-white p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {roleError && <p className="text-amber-500 text-sm mb-4">{roleError}</p>}

      <div className="space-y-2">
        {users?.map((u) => (
          <div
            key={u.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{u.fullName}</p>
              <p className="text-slate-400 text-sm">{u.email}</p>
            </div>

            <select
              value={u.role}
              onChange={(e) => mutation.mutate({ id: u.id, role: e.target.value })}
              disabled={mutation.isPending}
              className="bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-1.5 text-sm disabled:opacity-50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}