'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PlusCircle, Home, DollarSign, Users, MapPin,
  Edit, Loader2, CalendarDays, Clock, CheckCircle2,
  XCircle, TrendingUp, BedDouble, LayoutGrid, Trash2, X, Upload, ImageIcon
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import {
  fetchHostListings,
  fetchHostBookings,
  deleteListing,
  updateListing,
  deleteListingImage,
  addListingImages
} from '@/lib/api';
import { Listing, Booking } from '@/types';
import toast from 'react-hot-toast';
import { format, parseISO, differenceInDays } from 'date-fns';

function ImageOrFallback({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
        <span className="text-3xl mb-1">🏠</span>
        <p className="text-gray-400 text-xs font-medium">Add your image here</p>
      </div>
    );
  }
  return (
    <Image src={src} alt={alt} fill className="object-cover"
      onError={() => setError(true)} sizes="300px" />
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  confirmed: { label: 'Confirmed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  pending:   { label: 'Pending',   color: 'bg-amber-50 text-amber-700 border-amber-200',       icon: Clock },
  cancelled: { label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-200',             icon: XCircle },
};

const PROPERTY_TYPES = [
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'cabin', label: 'Cabin' },
  { value: 'cottage', label: 'Cottage' },
  { value: 'beach_house', label: 'Beach House' },
  { value: 'treehouse', label: 'Treehouse' },
  { value: 'loft', label: 'Loft' },
  { value: 'studio', label: 'Studio' },
  { value: 'mansion', label: 'Mansion' },
];

const COMMON_AMENITIES = [
  'WiFi', 'Kitchen', 'Air Conditioning', 'Washer', 'Dryer',
  'Parking', 'Pool', 'Hot Tub', 'Gym', 'BBQ Grill',
  'Fireplace', 'Beach Access', 'Mountain View', 'Smart TV',
  'Workspace', 'Pet Friendly',
];

type Tab = 'listings' | 'bookings';

export default function HostDashboard() {
  const { user, isHost } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // ── Edit Modal State ───────────────────────────────────────────
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editGuests, setEditGuests] = useState(2);
  const [editType, setEditType] = useState('house');
  const [editLocation, setEditLocation] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editExistingImages, setEditExistingImages] = useState<Listing['images']>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isHost) { setLoadingListings(false); setLoadingBookings(false); return; }

    fetchHostListings(user!.id)
      .then(setListings)
      .catch(() => toast.error('Failed to load listings'))
      .finally(() => setLoadingListings(false));

    fetchHostBookings(user!.id)
      .then(setBookings)
      .catch(() => toast.error('Failed to load bookings'))
      .finally(() => setLoadingBookings(false));
  }, [isHost, user]);

  if (!isHost) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Host access only</h1>
        <p className="text-gray-500 mb-8">Switch to Host Mode from the user menu to access your dashboard.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#E00B41] transition-colors">
          <Home className="w-4 h-4" /> Browse Listings
        </Link>
      </div>
    );
  }

  // ── Stats ──────────────────────────────────────────────────────
  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + parseFloat(b.total_price), 0);

  const totalNights = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + differenceInDays(parseISO(b.check_out), parseISO(b.check_in)), 0);

  const stats = [
    { label: 'Total Listings',   value: listings.length,           icon: LayoutGrid,   color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Bookings',   value: bookings.filter(b => b.status === 'confirmed').length, icon: CalendarDays, color: 'bg-purple-50 text-purple-600' },
    { label: 'Nights Booked',    value: totalNights,                icon: BedDouble,    color: 'bg-orange-50 text-orange-600' },
    { label: 'Total Revenue',    value: `$${totalRevenue.toFixed(0)}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
  ];

  // ── CRUD: Delete Listing ────────────────────────────────────────
  async function handleDeleteListing(id: number) {
    if (!window.confirm('Are you sure you want to delete this listing? All bookings and reviews will be removed.')) return;
    try {
      await deleteListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success('Listing deleted successfully');
    } catch {
      toast.error('Failed to delete listing');
    }
  }

  // ── CRUD: Edit Modal Open ───────────────────────────────────────
  function openEditModal(listing: Listing) {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditDesc(listing.description);
    setEditPrice(parseFloat(listing.price_per_night).toFixed(0));
    setEditGuests(listing.max_guests);
    setEditType(listing.property_type);
    setEditLocation(listing.location || '');
    setEditCity(listing.city || '');
    setEditCountry(listing.country || '');
    setEditAmenities(listing.amenities || []);
    setEditExistingImages(listing.images || []);
    setNewImageFiles([]);
  }

  // ── Edit: Toggle Amenity ────────────────────────────────────────
  function toggleAmenity(amenity: string) {
    setEditAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  }

  // ── Edit: Delete Existing Image ──────────────────────────────────
  async function handleDeleteImage(imageId: number) {
    if (!editingListing) return;
    if (!window.confirm('Delete this image?')) return;
    try {
      await deleteListingImage(editingListing.id, imageId);
      setEditExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      // Update main listing state to update cover/etc.
      setListings((prev) =>
        prev.map((l) =>
          l.id === editingListing.id
            ? { ...l, images: l.images.filter((img) => img.id !== imageId) }
            : l
        )
      );
      toast.success('Image removed');
    } catch {
      toast.error('Failed to remove image');
    }
  }

  // ── Edit: Handle File Select ─────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setNewImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeNewFile(index: number) {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  // ── CRUD: Save Changes ──────────────────────────────────────────
  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingListing) return;
    setSavingEdit(true);

    try {
      // 1. Submit text details
      const fd = new FormData();
      fd.append('title', editTitle);
      fd.append('description', editDesc);
      fd.append('price_per_night', editPrice);
      fd.append('max_guests', String(editGuests));
      fd.append('property_type', editType);
      fd.append('location', editLocation);
      fd.append('city', editCity);
      fd.append('country', editCountry);
      fd.append('amenities', JSON.stringify(editAmenities));

      const updated = await updateListing(editingListing.id, fd);

      // 2. Upload new images if any
      if (newImageFiles.length > 0) {
        const imgFd = new FormData();
        newImageFiles.forEach((file) => {
          imgFd.append('images', file);
        });
        await addListingImages(editingListing.id, imgFd);
      }

      // Fetch fresh listings list
      const freshListings = await fetchHostListings(user!.id);
      setListings(freshListings);

      toast.success('Listing updated successfully!');
      setEditingListing(null);
    } catch {
      toast.error('Failed to update listing');
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Host Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, <span className="font-semibold text-gray-700">{user?.name || user?.email}</span>
          </p>
        </div>
        <Link
          href="/host/create"
          className="flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#E00B41] transition-colors shadow-lg hover:shadow-[#FF385C]/30"
        >
          <PlusCircle className="w-4 h-4" /> New Listing
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
        {([
          { id: 'listings', label: 'My Listings', icon: Home,        count: listings.length },
          { id: 'bookings', label: 'Bookings',    icon: CalendarDays, count: bookings.length },
        ] as const).map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === id ? 'bg-[#FF385C] text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Listings Tab ─────────────────────────────────────────── */}
      {activeTab === 'listings' && (
        loadingListings ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-[#FF385C] animate-spin" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
            <span className="text-6xl mb-6 block">🏠</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No listings yet</h2>
            <p className="text-gray-500 mb-8">Create your first listing and start hosting guests.</p>
            <Link href="/host/create" className="inline-flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#E00B41] transition-colors">
              <PlusCircle className="w-4 h-4" /> Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => {
              const listingBookings = bookings.filter(
                (b) => b.listing === listing.id && b.status === 'confirmed'
              );
              const listingRevenue = listingBookings.reduce(
                (sum, b) => sum + parseFloat(b.total_price), 0
              );
              return (
                <div key={listing.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  <div className="relative h-48 bg-gray-100">
                    <ImageOrFallback src={listing.cover_image} alt={listing.title} />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm capitalize">
                        {listing.property_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 hover:text-[#FF385C] transition-colors truncate">{listing.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin className="w-3.5 h-3.5" />{listing.location || `${listing.city}, ${listing.country}`}
                    </p>

                    {/* Mini booking stats per listing */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold">{listingBookings.length}</span>
                        <span className="text-gray-400">bookings</span>
                      </div>
                      <span className="text-gray-200">|</span>
                      <div className="flex items-center gap-1 text-gray-600">
                        <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-semibold text-emerald-600">${listingRevenue.toFixed(0)}</span>
                        <span className="text-gray-400">earned</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <span className="text-lg font-bold text-gray-900">${parseFloat(listing.price_per_night).toFixed(0)}</span>
                        <span className="text-sm text-gray-400 ml-1">/ night</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Users className="w-3.5 h-3.5 text-gray-400" />{listing.max_guests} max
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => openEditModal(listing)}
                        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 py-2.5 rounded-xl transition-colors"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        className="flex items-center justify-center gap-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 py-2.5 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Bookings Tab ─────────────────────────────────────────── */}
      {activeTab === 'bookings' && (
        loadingBookings ? (
          <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-[#FF385C] animate-spin" /></div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
            <span className="text-6xl mb-6 block">📅</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No bookings yet</h2>
            <p className="text-gray-500">Bookings from guests will appear here once they reserve your listings.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">Property</div>
              <div className="col-span-2">Guest</div>
              <div className="col-span-2">Check-in</div>
              <div className="col-span-2">Check-out</div>
              <div className="col-span-1 text-center">Nights</div>
              <div className="col-span-1 text-right">Total</div>
            </div>

            {/* Booking Rows */}
            <div className="divide-y divide-gray-50">
              {bookings.map((booking) => {
                const checkIn  = parseISO(booking.check_in);
                const checkOut = parseISO(booking.check_out);
                const nights   = differenceInDays(checkOut, checkIn);
                const cfg      = STATUS_CONFIG[booking.status] || STATUS_CONFIG.confirmed;
                const StatusIcon = cfg.icon;

                return (
                  <div
                    key={booking.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Property */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {booking.cover_image ? (
                          <Image src={booking.cover_image} alt={booking.listing_title}
                            fill className="object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            sizes="48px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">🏠</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/listings/${booking.listing}`}
                          className="text-sm font-semibold text-gray-900 hover:text-[#FF385C] transition-colors truncate block">
                          {booking.listing_title}
                        </Link>
                        <p className="text-xs text-gray-400 truncate">{booking.listing_city}</p>
                      </div>
                    </div>

                    {/* Guest */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-[#FF385C] to-[#FF5A5F] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {booking.guest_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{booking.guest_name}</p>
                          <p className="text-xs text-gray-400">{booking.guests_count} guest{booking.guests_count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>

                    {/* Check-in */}
                    <div className="col-span-2">
                      <p className="text-sm font-semibold text-gray-900">{format(checkIn, 'MMM d, yyyy')}</p>
                      <p className="text-xs text-gray-400">{format(checkIn, 'EEEE')}</p>
                    </div>

                    {/* Check-out */}
                    <div className="col-span-2">
                      <p className="text-sm font-semibold text-gray-900">{format(checkOut, 'MMM d, yyyy')}</p>
                      <p className="text-xs text-gray-400">{format(checkOut, 'EEEE')}</p>
                    </div>

                    {/* Nights */}
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-sm font-bold text-gray-700">
                        {nights}
                      </span>
                    </div>

                    {/* Total + Status */}
                    <div className="col-span-1 text-right">
                      <p className="text-sm font-bold text-gray-900">${parseFloat(booking.total_price).toFixed(0)}</p>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer summary */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {bookings.length} total booking{bookings.length !== 1 ? 's' : ''} ·{' '}
                {bookings.filter(b => b.status === 'confirmed').length} confirmed
              </p>
              <p className="text-sm font-bold text-gray-900">
                Total revenue:{' '}
                <span className="text-emerald-600">${totalRevenue.toFixed(0)}</span>
              </p>
            </div>
          </div>
        )
      )}

      {/* ── Edit Modal ────────────────────────────────────────────── */}
      {editingListing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-gray-900">Edit Listing</h2>
              <button 
                onClick={() => setEditingListing(null)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
              
              {/* Basic Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-2">Basic Details</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Listing Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Property Type</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
                    >
                      {PROPERTY_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Max Guests</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editGuests}
                      onChange={(e) => setEditGuests(parseInt(e.target.value))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price per night ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-2">Location</h3>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location Details (e.g. Malibu, California, USA)</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      required
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
                    />
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-2">Amenities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {COMMON_AMENITIES.map((amenity) => {
                    const isSelected = editAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`text-left px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                          isSelected 
                            ? 'border-[#FF385C] bg-red-50 text-[#FF385C]' 
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {amenity}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-800 text-lg border-b border-gray-100 pb-2 font-semibold">Images</h3>
                
                {/* Existing Images list */}
                {editExistingImages.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Current Images</p>
                    <div className="grid grid-cols-4 gap-3">
                      {editExistingImages.map((img) => (
                        <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 group">
                          {img.image && (
                            <Image 
                              src={img.image} 
                              alt="listing image" 
                              fill 
                              className="object-cover"
                              sizes="120px"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(img.id)}
                            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black transition-colors"
                            title="Delete image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Images input */}
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Upload More Images</p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full border-2 border-dashed border-gray-200 rounded-2xl py-6 hover:border-[#FF385C] hover:bg-red-50/20 transition-all group"
                  >
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#FF385C] mb-2" />
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-[#FF385C]">Choose files</span>
                    <span className="text-xs text-gray-400 mt-0.5">JPEG, PNG up to 10MB</span>
                  </button>

                  {/* Previews of new files */}
                  {newImageFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">New Images to Upload</p>
                      <div className="grid grid-cols-4 gap-3">
                        {newImageFiles.map((file, idx) => (
                          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                            <Image 
                              src={URL.createObjectURL(file)} 
                              alt="New image preview" 
                              fill 
                              className="object-cover"
                              sizes="120px"
                            />
                            <button
                              type="button"
                              onClick={() => removeNewFile(idx)}
                              className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-5 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#E00B41] disabled:opacity-50 transition-colors text-sm shadow-md"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
