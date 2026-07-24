import apiClient from './client';
import type { ElementItem } from '../types/catalog';

export async function getElementById(id: string): Promise<ElementItem> {
  const res = await apiClient.get<ElementItem>(`/elements/${id}`);
  return res.data;
}

export interface AvailabilitySlot {
  id: string;
  elementId: string;
  startTime: string;
  endTime: string;
}

export async function getAvailability(elementId: string): Promise<AvailabilitySlot[]> {
  const res = await apiClient.get<AvailabilitySlot[]>('/availability', {
    params: { elementId },
  });
  return res.data;
}
export interface BookedRange {
  startTime: string;
  endTime: string;
}

export async function getBookedRanges(elementId: string): Promise<BookedRange[]> {
  const res = await apiClient.get<BookedRange[]>(`/bookings/by-element/${elementId}`);
  return res.data;
}
export interface BookingRequest {
  elementId: string;
  startTime: string;
  endTime: string;
}

export interface BookingResponse {
  id: string;
  elementId: string;
  elementName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

export async function createBooking(data: BookingRequest): Promise<BookingResponse> {
  const res = await apiClient.post<BookingResponse>('/bookings', data);
  return res.data;
}
export async function getMyBookings(): Promise<BookingResponse[]> {
  const res = await apiClient.get<BookingResponse[]>('/bookings/mine');
  return res.data;
}

export async function cancelBooking(bookingId: string): Promise<BookingResponse> {
  const res = await apiClient.put<BookingResponse>(`/bookings/${bookingId}/cancel`);
  return res.data;
}

export interface ElementRequest {
  serviceId: string;
  name: string;
  orderIndex: number;
  price: number;
  attributes: Record<string, string>;
}

export async function createElement(data: ElementRequest): Promise<ElementItem> {
  const res = await apiClient.post<ElementItem>('/elements', data);
  return res.data;
}

export async function toggleElementActive(id: string): Promise<ElementItem> {
  const res = await apiClient.patch<ElementItem>(`/elements/${id}/toggle-active`);
  return res.data;
}

export interface GenerateAvailabilityRequest {
  elementId: string;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  fromDate: string;
  toDate: string;
}

export interface GenerateAvailabilityResponse {
  slotsCreated: number;
  slotsSkipped: number;
  fromDate: string;
  toDate: string;
}

export async function generateAvailability(data: GenerateAvailabilityRequest): Promise<GenerateAvailabilityResponse> {
  const res = await apiClient.post<GenerateAvailabilityResponse>('/availability/generate', data);
  return res.data;
}

export async function getBookingsForProvider(elementId: string): Promise<BookingResponse[]> {
  const res = await apiClient.get<BookingResponse[]>(`/bookings/for-provider/${elementId}`);
  return res.data;
}

export async function deleteElement(id: string): Promise<void> {
  await apiClient.delete(`/elements/${id}`);
}

