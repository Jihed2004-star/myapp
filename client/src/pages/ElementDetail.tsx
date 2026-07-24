import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getElementById, getAvailability, getBookedRanges, createBooking } from '../api/elements';
import { useAuth } from '../context/AuthContext';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg } from '@fullcalendar/core';
import '../index.css';

export default function ElementDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

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
  const { data: bookedRanges } = useQuery({
    queryKey: ['bookedRanges', id],
    queryFn: () => getBookedRanges(id!),
    enabled: !!id,
  });

  const bookingMutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      setBookingSuccess(true);
      setBookingError(null);
      queryClient.invalidateQueries({ queryKey: ['availability', id] });
      queryClient.invalidateQueries({ queryKey: ['bookedRanges', id] });
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message ?? 'Could not create booking.';
      setBookingError(message);
      setBookingSuccess(false);
    },
  });

  function handleBook() {
    if (!id || !startTime || !endTime) return;
    setBookingSuccess(false);
    bookingMutation.mutate({
      elementId: id,
      startTime,
      endTime,
    });
  }
  function handleSelect(info: DateSelectArg) {
    if (info.allDay) {
      // Use FullCalendar's date-only strings (YYYY-MM-DD) and force UTC midnight,
      // avoiding local-timezone shift that toISOString() would introduce.
      setStartTime(`${info.startStr}T00:00:00.000Z`);
      setEndTime(`${info.endStr}T00:00:00.000Z`);
    } else {
      setStartTime(info.start.toISOString());
      setEndTime(info.end.toISOString());
    }
    setBookingSuccess(false);
    setBookingError(null);
  }

  if (isLoading) return <p className="text-white p-6">Loading...</p>;
  if (error) return <p className="text-white p-6">Failed to load element.</p>;
  if (!element) return <p className="text-white p-6">Element not found.</p>;

  return (
    <div className="text-white p-6 max-w-lg">
      <h1 className="text-2xl font-bold mb-1">{element.name}</h1>
      <p className="text-slate-300 mb-4">${element.price}</p>

      <h2 className="text-lg font-semibold mb-2">Details</h2>
      <ul className="space-y-1 mb-6">
        {Object.entries(element.attributes).map(([key, value]) => (
          <li key={key} className="text-slate-300">
            <span className="text-slate-400">{key}:</span> {value}
          </li>
        ))}
      </ul>

      <h2 className="text-lg font-semibold mb-2">Availability</h2>
      <div
        className="mb-6 bg-slate-900 border border-slate-800 rounded-xl p-4 fc-dark-theme"
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={element.bookingUnit === 'Hourly' ? 'timeGridWeek' : 'dayGridMonth'}
          selectable={!!user}
          select={handleSelect}
          events={[
            ...(slots?.map((slot) => ({
              id: `avail-${slot.id}`,
              start: slot.startTime,
              end: slot.endTime,
              display: 'background',
              color: '#3b82f6',
              allDay: element.bookingUnit !== 'Hourly',
            })) ?? []),
            ...(bookedRanges?.map((range, i) => ({
              id: `booked-${i}`,
              start: range.startTime,
              end: range.endTime,
              title: 'Booked',
              display: 'block',
              backgroundColor: '#ef4444',
              borderColor: '#ef4444',
              textColor: '#ffffff',
              allDay: element.bookingUnit !== 'Hourly',
            })) ?? []),
          ]}
          height="auto"
        />
      </div>

      {user ? (
        <div className="border-t border-slate-800 pt-4">
          <h2 className="text-lg font-semibold mb-3">Book this element</h2>

          {startTime && endTime ? (
            <p className="text-slate-300 text-sm mb-3">
              Selected: {new Date(startTime).toLocaleString()} — {new Date(endTime).toLocaleString()}
            </p>
          ) : (
            <p className="text-slate-500 text-sm mb-3">Drag on the calendar above to select a time.</p>
          )}

          <button
            onClick={handleBook}
            disabled={bookingMutation.isPending || !startTime || !endTime}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2"
          >
            {bookingMutation.isPending ? 'Booking...' : 'Book'}
          </button>

          {bookingError && (
            <p className="text-amber-500 text-sm mt-3">{bookingError}</p>
          )}
          {bookingSuccess && (
            <p className="text-green-400 text-sm mt-3">Booking confirmed!</p>
          )}
        </div>
      ) : (
        <p className="text-slate-400 border-t border-slate-800 pt-4">
          Log in to book this element.
        </p>
      )}
    </div>
  );
}
