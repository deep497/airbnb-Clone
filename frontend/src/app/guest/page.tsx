'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar, Heart, User, MapPin, CalendarDays, XCircle, Trash2,
  Edit3, Save, X, Loader2, Star, CheckCircle2, Clock
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  fetchGuestBookings,
  fetchFavorites,
  cancelBooking,
  removeFavorite,
  updateMe
} from '@/lib/api';
import { Booking, Favorite } from '@/types';
import { format, parseISO, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

function ImageFallback({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-full h-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl">
        🏠
      </div>
    );
  }
  return (
    <Image src={src} alt={alt} fill className="object-cover"
      onError={() => setError(true)} sizes="100px" />
  );
}

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  confirmed: { label: 'Confirmed', color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-250 dark:border-emerald-900/50', icon: CheckCircle2 },
  pending:   { label: 'Pending',   color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-705 dark:text-amber-450 border-amber-250 dark:border-amber-900/50',       icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 dark:bg-red-950/20 text-red-650 dark:text-red-450 border-red-250 dark:border-red-900/50',             icon: XCircle },
};

type Tab = 'trips' | 'favorites' | 'profile';

// ── Trips Tab ─────────────────────────────────────────────────────
function TripsTab({ userId }: { userId: number }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchGuestBookings(userId).then(setBookings).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  async function handleCancel(id: number) {
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch {
      toast.error('Failed to cancel booking');
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-[#FF385C] animate-spin" /></div>;
  if (!bookings.length) return (
    <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
      <span className="text-5xl block mb-4">✈️</span>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No trips yet</h3>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">Time to start planning your next adventure!</p>
      <Link href="/" className="inline-flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#E00B41] transition-colors text-sm">
        Explore Listings
      </Link>
    </div>
  );

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const nights = differenceInDays(parseISO(b.check_out), parseISO(b.check_in));
        const cfg    = STATUS_CFG[b.status] || STATUS_CFG.confirmed;
        const Icon   = cfg.icon;
        return (
          <div key={b.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex gap-4 p-4">
              <div className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                <ImageFallback src={b.cover_image} alt={b.listing_title} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/listings/${b.listing}`} className="font-bold text-gray-900 dark:text-white hover:text-[#FF385C] dark:hover:text-[#FF385C] transition-colors truncate text-sm">
                    {b.listing_title}
                  </Link>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 flex-shrink-0 ${cfg.color}`}>
                    <Icon className="w-3 h-3" />{b.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />{b.listing_location || b.listing_city}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500" />
                    {format(parseISO(b.check_in), 'MMM d')} – {format(parseISO(b.check_out), 'MMM d, yyyy')}
                  </div>
                  <span className="text-gray-300 dark:text-zinc-700">·</span>
                  <span>{nights} night{nights !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">${parseFloat(b.total_price).toFixed(0)} total</span>
                  {b.status === 'confirmed' && (
                    <button onClick={() => handleCancel(b.id)}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium hover:underline flex items-center gap-1 cursor-pointer">
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Favorites Tab ─────────────────────────────────────────────────
function FavoritesTab({ userId }: { userId: number }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetchFavorites(userId).then(setFavorites).catch(() => {}).finally(() => setLoading(false));
  }, [userId]);

  async function handleRemove(favId: number) {
    try {
      await removeFavorite(favId);
      setFavorites((prev) => prev.filter((f) => f.id !== favId));
      toast.success('Removed from favorites');
    } catch {
      toast.error('Failed to remove favorite');
    }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-[#FF385C] animate-spin" /></div>;
  if (!favorites.length) return (
    <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl">
      <span className="text-5xl block mb-4">❤️</span>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
      <p className="text-gray-500 dark:text-zinc-400 text-sm mb-6">Tap the heart on any listing to save it here.</p>
      <Link href="/" className="inline-flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#E00B41] transition-colors text-sm">
        Browse Listings
      </Link>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {favorites.map((fav) => {
        const l = fav.listing_detail;
        return (
          <div key={fav.id} className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
            <Link href={`/listings/${l.id}`}>
              <div className="relative h-40 bg-gray-100 dark:bg-zinc-800">
                {l.cover_image ? (
                  <Image src={l.cover_image} alt={l.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="300px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl">🏠</div>
                )}
              </div>
            </Link>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/listings/${l.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-[#FF385C] dark:hover:text-[#FF385C] transition-colors text-sm truncate">
                  {l.title}
                </Link>
                <div className="flex items-center gap-0.5 flex-shrink-0 text-gray-900 dark:text-white">
                  <Star className="w-3.5 h-3.5 fill-gray-900 dark:fill-white text-gray-900 dark:text-white" />
                  <span className="text-xs font-semibold">{l.average_rating?.toFixed(1) || '—'}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" />{l.location || l.city}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-sm font-bold text-gray-900 dark:text-white">${parseFloat(l.price_per_night).toFixed(0)}<span className="font-normal text-gray-400 text-xs"> / night</span></span>
                <button onClick={() => handleRemove(fav.id)}
                  className="text-gray-300 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────
function ProfileTab() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName]       = useState(user?.name || '');
  const [role, setRole]       = useState<'guest' | 'host'>(user?.role || 'guest');
  const [saving, setSaving]   = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    try {
      await updateMe({ name, role });
      await refreshUser();
      setEditing(false);
      toast.success('Profile updated!');
      if (role === 'host') router.push('/host');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-850 rounded-2xl shadow-sm p-6 transition-colors duration-200">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF385C] to-[#FF5A5F] rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">{user?.name || 'No name set'}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{user?.email}</p>
            <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${
              user?.role === 'host' ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-350' : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-350'
            }`}>{user?.role === 'host' ? '🏠 Host' : '🧳 Guest'}</span>
          </div>
        </div>

        {!editing ? (
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 text-sm font-semibold text-[#FF385C] border border-[#FF385C] px-4 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/10 transition-colors cursor-pointer">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Display Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name"
                className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121212] text-gray-950 dark:text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">Account Role</label>
              <div className="flex gap-3">
                {(['guest', 'host'] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                      role === r ? 'border-[#FF385C] bg-red-50 dark:bg-red-950/10 text-[#FF385C]' : 'border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-zinc-400 hover:border-gray-350'
                    }`}>
                    {r === 'host' ? '🏠 Host' : '🧳 Guest'}
                  </button>
                ))}
              </div>
              {role === 'host' && <p className="text-xs text-amber-600 mt-1.5">⚠ Switching to Host will redirect you to the Host Dashboard.</p>}
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-[#E00B41] disabled:opacity-50 transition-colors text-sm cursor-pointer">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
              <button onClick={() => setEditing(false)}
                className="flex items-center gap-2 border border-gray-200 dark:border-zinc-800 text-gray-650 dark:text-zinc-400 font-semibold px-4 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-sm cursor-pointer">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-850 rounded-2xl p-5 transition-colors duration-200">
        <h4 className="text-sm font-bold text-gray-705 dark:text-zinc-350 mb-2">Account Info</h4>
        <div className="space-y-2 text-sm text-gray-600 dark:text-zinc-400">
          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-550">Email</span><span className="font-semibold text-gray-900 dark:text-white">{user?.email}</span></div>
          <div className="flex justify-between"><span className="text-gray-400 dark:text-zinc-550">Member since</span>
            <span className="font-semibold text-gray-900 dark:text-white">{user?.date_joined ? format(parseISO(user.date_joined), 'MMM yyyy') : '—'}</span></div>
        </div>
      </div>
    </div>
  );
}

// ── Main Guest Dashboard ──────────────────────────────────────────
function GuestDashboardInner() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(
    (searchParams.get('tab') as Tab) || 'trips'
  );

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    router.push(`/guest?tab=${tab}`, { scroll: false });
  }

  if (isLoading) return <div className="flex justify-center py-32"><Loader2 className="w-8 h-8 text-[#FF385C] animate-spin" /></div>;
  if (!isAuthenticated) return (
    <div className="max-w-lg mx-auto px-4 py-32 text-center">
      <span className="text-6xl block mb-6">🔒</span>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Sign in required</h1>
      <p className="text-gray-500 dark:text-zinc-400 mb-8">Please sign in to access your dashboard.</p>
      <Link href="/login" className="inline-flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#E00B41] transition-colors">
        Sign In
      </Link>
    </div>
  );

  const tabs = [
    { id: 'trips'     as Tab, label: 'My Trips',  icon: Calendar },
    { id: 'favorites' as Tab, label: 'Favorites', icon: Heart    },
    { id: 'profile'   as Tab, label: 'Profile',   icon: User     },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Hello, {user?.name || user?.email?.split('@')[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 mt-1 font-medium">Manage your trips, favorites, and profile.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-zinc-900 p-1 rounded-xl w-fit mb-8 transition-colors duration-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => handleTabChange(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
              activeTab === id 
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'trips'     && <TripsTab userId={user!.id} />}
      {activeTab === 'favorites' && <FavoritesTab userId={user!.id} />}
      {activeTab === 'profile'   && <ProfileTab />}
    </div>
  );
}

export default function GuestDashboard() {
  return (
    <Suspense fallback={<div className="flex justify-center py-32"><Loader2 className="w-8 h-8 text-[#FF385C] animate-spin" /></div>}>
      <GuestDashboardInner />
    </Suspense>
  );
}
