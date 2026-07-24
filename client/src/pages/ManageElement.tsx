import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getElementById, getAvailability, generateAvailability, getBookingsForProvider, toggleElementActive, deleteElement, cancelBooking } from '../api/elements';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function ManageElement() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: element, isLoading, error } = useQuery({
    queryKey: ['element', id],
    queryFn: () => getElementById(id!),
    enabled: !!id,
  });

  const { data: slots } = useQuery({
    queryKey: ['availability', id],
    queryFn: () => getAvailability(id!),
    enabled: !!id,
  });

  const { data: bookings } = useQuery({
    queryKey: ['providerBookings', id],
    queryFn: () => getBookingsForProvider(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: generateAvailability,
    onSuccess: (res) => {
      const skippedNote = res.slotsSkipped > 0 ? ` (${res.slotsSkipped} skipped — already existed)` : '';
      setSuccessMsg(`Created ${res.slotsCreated} availability slots${skippedNote}.`);
      setFormError(null);
      queryClient.invalidateQueries({ queryKey: ['availability', id] });
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message ?? 'Could not generate availability.');
      setSuccessMsg(null);
    },
  });


  const navigate = useNavigate();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteElement,
    onSuccess: () => navigate(`/provider/services/${element?.serviceId}`),
    onError: (err: any) => setDeleteError(err?.response?.data?.message ?? 'Could not delete element.'),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleElementActive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['element', id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providerBookings', id] });
    },
  });

  function toggleDay(day: string) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function handleGenerate() {
    if (!id || selectedDays.length === 0 || !fromDate || !toDate) {
      setFormError('Select at least one day and a full date range.');
      return;
    }
    setSuccessMsg(null);

    const isFullDay = element?.bookingUnit !== 'Hourly';
    mutation.mutate({
      elementId: id,
      daysOfWeek: selectedDays,
      startTime: isFullDay ? '00:00:00' : `${startTime}:00`,
      endTime: isFullDay ? '00:00:00' : `${endTime}:00`,
      fromDate,
      toDate,
    });
  }

  if (!user || (user.role !== 'Provider' && user.role !== 'Admin')) {
    return <div className="text-white p-6"><p className="text-slate-400">You don't have access to this page.</p></div>;
  }

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error || !element) return <p className="text-white p-6">Failed to load element.</p>;

  return (
    <div className="text-white p-6 max-w-2xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">{element.name}</h1>
          <p className="text-slate-400">${element.price} · {element.bookingUnit} booking</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleMutation.mutate(element.id)}
            disabled={toggleMutation.isPending}
            className={`text-xs font-medium px-3 py-1.5 rounded-full disabled:opacity-50 ${
              element.isActive
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-green-600 text-white hover:bg-green-500'
            }`}
          >
            {element.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => {
              if (confirm('Delete this element permanently? This cannot be undone.')) {
                deleteMutation.mutate(element.id);
              }
            }}
            disabled={deleteMutation.isPending}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-900/50 text-red-300 hover:bg-red-900 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
        {deleteError && <p className="text-amber-500 text-sm mb-4">{deleteError}</p>}
      </div>

      <h2 className="text-lg font-semibold mb-3">Generate Availability</h2>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 mb-8">
        <label className="block text-sm text-slate-400 mb-2">Days of week</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                selectedDays.includes(day)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>

        {element.bookingUnit === 'Hourly' && (
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">Start time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-400 mb-1">End time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm text-slate-400 mb-1">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-slate-400 mb-1">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-800/50 border border-slate-800 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={mutation.isPending}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          {mutation.isPending ? 'Generating...' : 'Generate'}
        </button>

        {formError && <p className="text-amber-500 text-sm mt-3">{formError}</p>}
        {successMsg && <p className="text-green-400 text-sm mt-3">{successMsg}</p>}

        <p className="text-slate-500 text-xs mt-3">
          Currently {slots?.length ?? 0} availability slot{slots?.length !== 1 ? 's' : ''} set.
        </p>
      </div>

      <h2 className="text-lg font-semibold mb-3">Bookings</h2>
      <ul className="space-y-2">
        {bookings?.map((b) => (
          <li key={b.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex justify-between items-center">
            <p className="text-slate-300 text-sm">
              {new Date(b.startTime).toLocaleString()} — {new Date(b.endTime).toLocaleString()}
            </p>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  b.status === 'Confirmed'
                    ? 'bg-blue-900/50 text-blue-300'
                    : b.status === 'Cancelled'
                    ? 'bg-slate-800 text-slate-400'
                    : 'bg-green-900/50 text-green-300'
                }`}
              >
                {b.status}
              </span>
              {b.status === 'Confirmed' && (
                <button
                  onClick={() => cancelMutation.mutate(b.id)}
                  disabled={cancelMutation.isPending}
                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </li>
        ))}
        {bookings?.length === 0 && <p className="text-slate-400">No bookings yet.</p>}
      </ul>
    </div>
  );
}