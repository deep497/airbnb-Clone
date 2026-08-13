const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// ── Token helpers ─────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('airbnb_token');
}

export function setToken(token: string) {
  localStorage.setItem('airbnb_token', token);
}

export function removeToken() {
  localStorage.removeItem('airbnb_token');
}

// ── Base fetch wrapper ────────────────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Token ${token}`;
  // Only set Content-Type for JSON (not FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(JSON.stringify(err));
  }
  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// ─────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────

export async function requestOTP(email: string, mode: 'signin' | 'signup') {
  return apiFetch('/api/auth/request-otp/', {
    method: 'POST',
    body: JSON.stringify({ email, mode }),
  });
}

export async function verifyOTP(
  email: string,
  otp: string,
  mode: 'signin' | 'signup',
  role?: 'host' | 'guest',
  name?: string
) {
  return apiFetch('/api/auth/verify-otp/', {
    method: 'POST',
    body: JSON.stringify({ email, otp, mode, role, name }),
  });
}

export async function fetchMe() {
  return apiFetch('/api/auth/me/');
}

export async function updateMe(data: { name?: string; role?: string }) {
  return apiFetch('/api/auth/me/', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function logout() {
  return apiFetch('/api/auth/logout/', { method: 'POST' });
}

// ─────────────────────────────────────────────────────────────────
// Listings
// ─────────────────────────────────────────────────────────────────

export async function fetchListings(params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API_URL}/api/listings/${query}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

export async function fetchListing(id: string | number) {
  const res = await fetch(`${API_URL}/api/listings/${id}/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch listing');
  return res.json();
}

export async function createListing(formData: FormData) {
  return apiFetch('/api/listings/', { method: 'POST', body: formData });
}

export async function updateListing(id: number, formData: FormData) {
  return apiFetch(`/api/listings/${id}/`, { method: 'PATCH', body: formData });
}

export async function deleteListing(id: number) {
  return apiFetch(`/api/listings/${id}/`, { method: 'DELETE' });
}

export async function fetchHostListings(hostId: number) {
  return apiFetch(`/api/listings/?host=${hostId}`);
}

export async function fetchBookedDates(listingId: string | number) {
  const res = await fetch(`${API_URL}/api/listings/${listingId}/booked-dates/`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch booked dates');
  return res.json();
}

export async function addListingImages(listingId: number, formData: FormData) {
  return apiFetch(`/api/listings/${listingId}/add-images/`, { method: 'POST', body: formData });
}

export async function deleteListingImage(listingId: number, imageId: number) {
  return apiFetch(`/api/listings/${listingId}/images/${imageId}/`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────────

export async function createBooking(data: {
  guest: number; listing: number;
  check_in: string; check_out: string; guests_count: number;
}) {
  return apiFetch('/api/bookings/', { method: 'POST', body: JSON.stringify(data) });
}

export async function fetchGuestBookings(guestId: number) {
  return apiFetch(`/api/bookings/?guest=${guestId}`);
}

export async function fetchHostBookings(hostId: number) {
  return apiFetch(`/api/bookings/?host=${hostId}`);
}

export async function cancelBooking(id: number) {
  return apiFetch(`/api/bookings/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'cancelled' }),
  });
}

// ─────────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────────

export async function fetchReviews(listingId: number) {
  const res = await fetch(`${API_URL}/api/reviews/?listing=${listingId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch reviews');
  return res.json();
}

export async function createReview(data: { listing: number; guest: number; rating: number; comment: string }) {
  return apiFetch('/api/reviews/', { method: 'POST', body: JSON.stringify(data) });
}

export async function deleteReview(id: number) {
  return apiFetch(`/api/reviews/${id}/`, { method: 'DELETE' });
}

// ─────────────────────────────────────────────────────────────────
// Favorites
// ─────────────────────────────────────────────────────────────────

export async function fetchFavorites(guestId: number) {
  return apiFetch(`/api/favorites/?guest=${guestId}`);
}

export async function addFavorite(guestId: number, listingId: number) {
  return apiFetch('/api/favorites/', {
    method: 'POST',
    body: JSON.stringify({ guest: guestId, listing: listingId }),
  });
}

export async function removeFavorite(favoriteId: number) {
  return apiFetch(`/api/favorites/${favoriteId}/`, { method: 'DELETE' });
}
