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

export type AuthUser = { id: number; fullName: string; email: string; phone: string | null; role: string };
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

const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

async function apiRequest<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `API request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

async function apiPost<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
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

export async function getSalons() {
  const response = await apiRequest<{ data: Salon[] }>('/api/salons');
  return response.data;
}

export async function getSalonServices(salonId: number) {
  const response = await apiRequest<{ data: SalonService[] }>(`/api/salons/${salonId}/services`);
  return response.data;
}

export async function getBookings(token: string) {
  const response = await fetch(`${API_URL}/api/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: Booking[] }).data;
}

export async function createBooking(token: string, input: { serviceId: number; appointmentAt: string; notes?: string }) {
  const response = await fetch(`${API_URL}/api/bookings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as { id: number; status: string };
}
