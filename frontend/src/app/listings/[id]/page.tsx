import { notFound } from 'next/navigation';
import { MapPin, Users, Home, Star, Share } from 'lucide-react';
import { fetchListing, fetchBookedDates } from '@/lib/api';
import { Listing, BookedDateRange } from '@/types';
import { ListingGallery, AmenitiesGrid } from '@/components/ListingDetail';
import ReservationWidget from '@/components/ReservationWidget';
import ReviewSection from '@/components/ReviewSection';

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingPageProps) {
  try {
    const { id } = await params;
    const listing: Listing = await fetchListing(id);
    return {
      title: `${listing.title} – Airbnb Clone`,
      description: listing.description,
    };
  } catch {
    return { title: 'Listing Not Found' };
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;

  let listing: Listing;
  let bookedDates: BookedDateRange[] = [];

  try {
    listing = await fetchListing(id);
    bookedDates = await fetchBookedDates(id);
  } catch {
    notFound();
  }

  const price = parseFloat(listing!.price_per_night);
  const locationDisplay = listing!.location || [listing!.city, listing!.country].filter(Boolean).join(', ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{listing!.title}</h1>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-700 dark:text-zinc-300">
            {listing!.average_rating && (
              <>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-gray-900 dark:fill-white text-gray-900 dark:text-white" />
                  <span className="font-semibold">{listing!.average_rating.toFixed(2)}</span>
                  <span className="text-gray-400 dark:text-zinc-500">· {listing!.review_count} review{listing!.review_count !== 1 ? 's' : ''}</span>
                </div>
                <span className="text-gray-300 dark:text-zinc-700">·</span>
              </>
            )}
            {locationDisplay && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="underline cursor-pointer">{locationDisplay}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-zinc-350 hover:bg-gray-100 dark:hover:bg-zinc-900 px-3 py-2 rounded-xl transition-colors underline">
              <Share className="w-4 h-4" /> Share
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="mb-8">
        <ListingGallery listing={listing!} />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column – Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Host Info */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-zinc-800">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Hosted by {listing!.host_name}
              </h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />{listing!.max_guests} guests
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 capitalize">
                  <Home className="w-4 h-4" />{listing!.property_type.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[#FF385C] to-[#FF5A5F] rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {listing!.host_name.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-gray-200 dark:border-zinc-800">
            {[
              { icon: '🏆', title: 'Verified Host', desc: 'Identity and details verified' },
              { icon: '📍', title: 'Great location', desc: 'Guests love the location' },
              { icon: '🗝️', title: 'Self check-in', desc: 'Check yourself in with the lockbox' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</p>
                  <p className="text-sm text-gray-505 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          {listing!.description && (
            <div className="pb-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About this place</h2>
              <p className="text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">{listing!.description}</p>
            </div>
          )}

          {/* Amenities */}
          {listing!.amenities?.length > 0 && (
            <div className="pb-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">What this place offers</h2>
              <AmenitiesGrid amenities={listing!.amenities} />
            </div>
          )}

          {/* Real Reviews Section (client component) */}
          <ReviewSection listingId={listing!.id} />
        </div>

        {/* Right Column – Sticky Reservation Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <ReservationWidget listing={listing!} bookedDates={bookedDates} />
          </div>
        </div>
      </div>
    </div>
  );
}
