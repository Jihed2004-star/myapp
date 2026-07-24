export interface Category {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  isActive: boolean;
}

export type BookingUnit = 'Hourly' | 'Daily' | 'Monthly';

export interface ElementItem {
  id: string;
  serviceId: string;
  name: string;
  orderIndex: number;
  price: number;
  attributes: Record<string, string>;
  bookingUnit: BookingUnit;
  isActive: boolean;
}

export interface Service {
  id: string;
  categoryId: string;
  categoryName: string;
  providerId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  elements: ElementItem[];
  bookingUnit: BookingUnit;
}

export interface AvailabilitySlot {
  id: string;
  elementId: string;
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  elementId: string;
  elementName: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}
