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

export async function getProfile(token: string) {
  const response = await fetch(`${API_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: UserProfile }).data;
}

export async function getAccountItems(token: string, section: 'saved' | 'salons' | 'notifications' | 'reviews') {
  const response = await fetch(`${API_URL}/api/account/${section}`, { headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: AccountItem[] }).data;
}

export async function saveHairstyle(token: string, title: string) {
  const response = await fetch(`${API_URL}/api/account/saved`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as { title: string };
}

export async function getFavoriteSalons(token: string) {
  const response = await fetch(`${API_URL}/api/favorite-salons`, { headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: number[] }).data;
}

export async function setFavoriteSalon(token: string, salonId: number, favorite: boolean) {
  const response = await fetch(`${API_URL}/api/favorite-salons/${salonId}`, {
    method: favorite ? 'PUT' : 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return result.data as { salonId: number; favorite: boolean };
}

export async function getPrivacySettings(token: string) {
  const response = await fetch(`${API_URL}/api/privacy-settings`, { headers: { Authorization: `Bearer ${token}` } });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `API request failed (${response.status})`);
  return (result as { data: PrivacySettings }).data;
}

export async function updatePrivacySettings(token: string, settings: PrivacySettings) {
  const response = await fetch(`${API_URL}/api/privacy-settings`, {
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
