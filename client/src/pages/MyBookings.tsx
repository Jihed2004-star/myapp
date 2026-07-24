import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyBookings, cancelBooking } from '../api/elements';
import { useAuth } from '../context/AuthContext';

export default function MyBookings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookings,
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      setCancelError(null);
      queryClient.invalidateQueries({ queryKey: ['myBookings'] });
    },
    onError: (err: any) => {
      setCancelError(err?.response?.data?.message ?? 'Could not cancel booking.');
    },
  });

  if (!user) {
    return (
      <div className="text-white p-6">
        <p className="text-slate-400">Log in to see your bookings.</p>
      </div>
    );
  }

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-white p-6">Failed to load bookings.</p>;

  const isUpcoming = (endTime: string) => new Date(endTime) > new Date();

  return (
    <div className="text-white p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {cancelError && (
        <p className="text-amber-500 text-sm mb-4">{cancelError}</p>
      )}

      {bookings?.length === 0 && (
        <p className="text-slate-400">You have no bookings yet.</p>
      )}

      <ul className="space-y-3">
        {bookings?.map((booking) => (
          <li
            key={booking.id}
            className="bg-slate-900 border border-slate-800 rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <Link
                  to={`/elements/${booking.elementId}`}
                  className="text-blue-400 hover:text-blue-300 font-semibold"
                >
                  {booking.elementName}
                </Link>
                <p className="text-slate-400 text-sm">{booking.serviceName}</p>
                <p className="text-slate-300 text-sm mt-2">
                  {new Date(booking.startTime).toLocaleString()} — {new Date(booking.endTime).toLocaleString()}
                </p>
              </div>

              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  booking.status === 'Confirmed'
                    ? 'bg-blue-900/50 text-blue-300'
                    : booking.status === 'Cancelled'
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-green-900/50 text-green-300'
                }`}
              >
                {booking.status}
              </span>
            </div>

            {booking.status === 'Confirmed' && isUpcoming(booking.startTime) && (
              <button
                onClick={() => cancelMutation.mutate(booking.id)}
                disabled={cancelMutation.isPending}
                className="mt-3 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                Cancel booking
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}