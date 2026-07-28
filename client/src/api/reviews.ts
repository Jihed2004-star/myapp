import apiClient from './client';

export interface ReviewResponse {
  id: string;
  elementId: string;
  bookingId: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ElementRatingSummary {
  averageRating: number;
  reviewCount: number;
}

export interface ReviewRequest {
  bookingId: string;
  rating: number;
  comment: string | null;
}

export async function getReviewsByElement(elementId: string): Promise<ReviewResponse[]> {
  const res = await apiClient.get<ReviewResponse[]>(`/reviews/by-element/${elementId}`);
  return res.data;
}

export async function getRatingSummary(elementId: string): Promise<ElementRatingSummary> {
  const res = await apiClient.get<ElementRatingSummary>(`/reviews/summary/${elementId}`);
  return res.data;
}

export async function createReview(data: ReviewRequest): Promise<ReviewResponse> {
  const res = await apiClient.post<ReviewResponse>('/reviews', data);
  return res.data;
}