'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Users, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { fetchGuestBookings } from '@/lib/api';
import { Booking } from '@/types';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

function ImageOrFallback({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-xl">
        <span className="text-3xl">🏠</span>
      </div>
    );
  }
  return (
    <Image src={src} alt={alt} fill className="object-cover" onError={() => setError(true)} sizes="120px" />
  );
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function TripsPage() {
  const { user, isHost } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchGuestBookings(user.id)
      .then(setBookings)
      .catch(() => toast.error('Failed to load trips'))
      .finally(() => setLoading(false));
  }, [user]);

  if (isHost) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <span className="text-6xl block mb-6">🏠</span>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">You&apos;re in Host Mode</h1>
        <p className="text-gray-500 mb-8">Switch to Guest Mode to view your trips.</p>
        <Link href="/" className="inline-flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#E00B41] transition-colors">
          Browse Listings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Trips</h1>
        <p className="text-gray-500 mt-1">All your upcoming and past adventures.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 text-[#FF385C] animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-2xl">
          <span className="text-6xl mb-6 block">✈️</span>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No trips yet</h2>
          <p className="text-gray-500 mb-8">Time to start your next adventure!</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#E00B41] transition-colors">
            Explore Listings
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex gap-4 p-4">
                {/* Image */}
                <div className="relative w-28 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  <ImageOrFallback src={booking.cover_image} alt={booking.listing_title} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 truncate">{booking.listing_title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {booking.listing_city}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 capitalize ${STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {format(parseISO(booking.check_in), 'MMM d')} – {format(parseISO(booking.check_out), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-gray-900">${parseFloat(booking.total_price).toFixed(0)} total</span>
                    <Link
                      href={`/listings/${booking.listing}`}
                      className="text-sm text-[#FF385C] font-semibold hover:underline"
                    >
                      View listing →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
