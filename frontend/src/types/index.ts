// ── User ──────────────────────────────────────────────────────────
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'host' | 'guest';
  date_joined: string;
}

// ── Listing Image ─────────────────────────────────────────────────
export interface ListingImage {
  id: number;
  image: string;
  is_cover: boolean;
  uploaded_at: string;
}

// ── Listing ───────────────────────────────────────────────────────
export interface Listing {
  id: number;
  host: number;
  host_name: string;
  title: string;
  description: string;
  location: string;
  city: string;
  country: string;
  property_type: string;
  price_per_night: string;
  max_guests: number;
  amenities: string[];
  images: ListingImage[];
  cover_image: string | null;
  average_rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
}

// ── Booking ───────────────────────────────────────────────────────
export interface Booking {
  id: number;
  guest: number;
  listing: number;
  listing_title: string;
  listing_city: string;
  listing_location: string;
  cover_image: string | null;
  guest_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  total_price: string;
  guests_count: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

// ── Review ────────────────────────────────────────────────────────
export interface Review {
  id: number;
  listing: number;
  guest: number;
  guest_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

// ── Favorite ──────────────────────────────────────────────────────
export interface Favorite {
  id: number;
  guest: number;
  listing: number;
  listing_detail: Listing;
  saved_at: string;
}

// ── Booked Date Range ─────────────────────────────────────────────
export interface BookedDateRange {
  check_in: string;
  check_out: string;
}

// ── Auth ──────────────────────────────────────────────────────────
export interface AuthResponse {
  token: string;
  user: User;
  is_new_user: boolean;
}
