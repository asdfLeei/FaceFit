import { API_URL } from './api-config';

export type Salon = {
  id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  website: string | null;
  source: string | null;
  source_url: string | null;
  rating: number;
  opening_time: string | null;
  closing_time: string | null;
};

export type SalonService = {
  id: number;
  salon_id: number;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
};

export type SalonStaff = {
  id: number;
  name: string;
  specialties: string | null;
  isAvailable: boolean;
};

export type SalonReview = {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerName: string;
  imageUrl: string | null;
};

export type SalonReviewSummary = { count: number; average: number };
export type MySalonReview = {
  id: number;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  createdAt: string;
};

export type AuthUser = { id: number; fullName: string; email: string; phone: string | null; role: string };
export type UserProfile = AuthUser & {
  createdAt: string;
  hairType: string | null;
  hairLength: string | null;
  hairTexture: string | null;
  faceShape: string | null;
};
type AuthResponse = { data: { user: AuthUser; token: string } };
export type Booking = {
  id: number;
  appointmentAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  serviceId: number;
  serviceName: string;
  price: number;
  durationMinutes: number;
  salonId: number;
  salonName: string;
  stylistName: string | null;
};
export type AccountItem = { id: number; title: string; detail?: string; isRead?: boolean; createdAt: string };
export type PrivacySettings = { notificationsEnabled: boolean; saveScanHistory: boolean };
export type OwnerDashboard = {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  rating: number;
  reviewCount: number;
  serviceCount: number;
  availableStaff: number;
  todayBookings: number;
  pendingBookings: number;
};
export type OwnerBooking = {
  id: number;
  appointmentAt: string;
  status: Booking['status'];
  notes: string | null;
  serviceName: string;
  price: number;
  durationMinutes: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  stylistName: string | null;
};
export type OwnerService = SalonService & { isActive: boolean };
export type OwnerStaff = SalonStaff & { email: string; phone: string | null };
export type OwnerSalonProfile = {
  id: number;
  name: string;
  description: string | null;
  address: string;
  city: string;
  phone: string | null;
  website: string | null;
  rating: number;
  openingTime: string | null;
  closingTime: string | null;
  isActive: boolean;
};
export type OwnerManagement = {
  salon: OwnerSalonProfile;
  services: OwnerService[];
  staff: OwnerStaff[];
  bookings: OwnerBooking[];
  reviews: SalonReview[];
};

async function fetchApi(path: string, options?: RequestInit) {
  try {
    return await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      `Cannot connect to the FaceFit server at ${API_URL}. Start the server and keep this device on the same Wi-Fi network.`
    );
  }
}

export function getApiAssetUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetchApi(path);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: object): Promise<T> {
  const response = await fetchApi(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result as T;
}

export async function signup(input: { fullName: string; email: string; phone: string; password: string; role: 'customer' | 'owner' }) {
  return (await apiPost<AuthResponse>('/api/auth/signup', input)).data;
}

export async function login(input: { email: string; password: string }) {
  return (await apiPost<AuthResponse>('/api/auth/login', input)).data;
}

export async function getProfile(token: string) {
  const response = await fetchApi('/api/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: UserProfile }).data;
}

export async function getOwnerDashboard(token: string) {
  const response = await fetchApi('/api/owner/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: OwnerDashboard }).data;
}

export async function getOwnerManagement(token: string) {
  const response = await fetchApi('/api/owner/management', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: OwnerManagement }).data;
}

export async function updateOwnerBooking(token: string, bookingId: number, status: 'confirmed' | 'completed' | 'cancelled') {
  const response = await fetchApi(`/api/owner/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as { id: number; status: string };
}

export async function getAccountItems(token: string, section: 'saved' | 'salons' | 'notifications' | 'reviews') {
  const response = await fetchApi(`/api/account/${section}`, { headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: AccountItem[] }).data;
}

export async function saveHairstyle(token: string, title: string) {
  const response = await fetchApi('/api/account/saved', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as { title: string };
}

export async function getFavoriteSalons(token: string) {
  const response = await fetchApi('/api/favorite-salons', { headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: number[] }).data;
}

export async function setFavoriteSalon(token: string, salonId: number, favorite: boolean) {
  const response = await fetchApi(`/api/favorite-salons/${salonId}`, {
    method: favorite ? 'PUT' : 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as { salonId: number; favorite: boolean };
}

export async function getPrivacySettings(token: string) {
  const response = await fetchApi('/api/privacy-settings', { headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: PrivacySettings }).data;
}

export async function updatePrivacySettings(token: string, settings: PrivacySettings) {
  const response = await fetchApi('/api/privacy-settings', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: PrivacySettings }).data;
}

export async function getSalons() {
  const response = await apiRequest<{ data: Salon[] }>('/api/salons');
  return response.data;
}

export async function getSalonServices(salonId: number) {
  const response = await apiRequest<{ data: SalonService[] }>(`/api/salons/${salonId}/services`);
  return response.data;
}

export async function getSalonStaff(salonId: number) {
  const response = await apiRequest<{ data: SalonStaff[] }>(`/api/salons/${salonId}/staff`);
  return response.data;
}

export async function getSalonReviews(salonId: number) {
  const response = await apiRequest<{ data: { reviews: SalonReview[]; summary: SalonReviewSummary } }>(`/api/salons/${salonId}/reviews`);
  return response.data;
}

export async function getMySalonReviews(token: string, salonId: number) {
  const response = await fetchApi(`/api/salons/${salonId}/my-reviews`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as MySalonReview[];
}

export async function createSalonReview(token: string, salonId: number, input: { rating: number; comment: string; imageData?: string | null }) {
  const response = await fetchApi(`/api/salons/${salonId}/reviews`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as { id: number; rating: number; comment: string | null; imageUrl: string | null; summary: SalonReviewSummary };
}

export async function updateSalonReview(token: string, reviewId: number, input: { rating: number; comment: string; imageData?: string | null }) {
  const response = await fetchApi(`/api/reviews/${reviewId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as { id: number; rating: number; comment: string | null; imageUrl: string | null; summary: SalonReviewSummary };
}

export async function getBookings(token: string) {
  const response = await fetchApi('/api/bookings', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: Booking[] }).data;
}

export async function createBooking(token: string, input: { serviceId: number; stylistId?: number; appointmentAt: string; notes?: string }) {
  const response = await fetchApi('/api/bookings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as { id: number; status: string };
}
