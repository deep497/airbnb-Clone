'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Listing } from '@/types';
import { addFavorite, removeFavorite } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import toast from 'react-hot-toast';

interface Props {
  listing: Listing;
  favoriteId?: number | null;   // Pass if already in favorites
  onFavoriteChange?: (listingId: number, newFavoriteId: number | null) => void;
}

export default function ListingCard({ listing, favoriteId, onFavoriteChange }: Props) {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [imgError, setImgError]   = useState(false);
  const [currentImg, setCurrentImg] = useState(0);
  const [isFav, setIsFav]         = useState<number | null>(favoriteId ?? null);
  const [favLoading, setFavLoading] = useState(false);

  const images = listing.images.map((i) => i.image).filter(Boolean);
  const hasImages = images.length > 0 && !imgError;
  const price = parseFloat(listing.price_per_night).toFixed(0);

  // Deterministic rating based on listing.id (no Math.random = no hydration error)
  const rating = listing.average_rating
    ? listing.average_rating.toFixed(2)
    : (4.5 + (listing.id % 10) * 0.049).toFixed(2);

  function prevImg(e: React.MouseEvent) {
    e.preventDefault();
    setCurrentImg((p) => (p === 0 ? images.length - 1 : p - 1));
  }
  function nextImg(e: React.MouseEvent) {
    e.preventDefault();
    setCurrentImg((p) => (p === images.length - 1 ? 0 : p + 1));
  }

  async function toggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    if (!isAuthenticated || !isGuest || !user) {
      toast.error('Sign in as a guest to save favorites');
      return;
    }
    setFavLoading(true);
    try {
      if (isFav !== null) {
        await removeFavorite(isFav);
        setIsFav(null);
        onFavoriteChange?.(listing.id, null);
        toast.success('Removed from favorites');
      } else {
        const fav = await addFavorite(user.id, listing.id);
        setIsFav(fav.id);
        onFavoriteChange?.(listing.id, fav.id);
        toast.success('Saved to favorites');
      }
    } catch {
      toast.error('Failed to update favorites');
    } finally {
      setFavLoading(false);
    }
  }

  return (
    <Link href={`/listings/${listing.id}`} className="group block">
      <div className="relative">
        {/* Image area */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 transition-colors duration-200">
          {hasImages ? (
            <Image
              src={images[currentImg]}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-100 dark:bg-zinc-800">
              <span className="text-4xl">🏠</span>
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-550">Add your image here</p>
            </div>
          )}

          {/* Image nav arrows */}
          {images.length > 1 && (
            <>
              <button onClick={prevImg}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 dark:bg-zinc-900/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-all hover:scale-105 border border-transparent dark:border-zinc-800">
                <ChevronLeft className="w-4 h-4 text-gray-800 dark:text-zinc-300" />
              </button>
              <button onClick={nextImg}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 dark:bg-zinc-900/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-all hover:scale-105 border border-transparent dark:border-zinc-800">
                <ChevronRight className="w-4 h-4 text-gray-800 dark:text-zinc-300" />
              </button>
              {/* Dot indicators */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {images.map((_, i) => (
                  <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}

          {/* Favorite button */}
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            className="absolute top-3 right-3 p-1.5 rounded-full transition-transform hover:scale-110 disabled:opacity-50"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-5 h-5 drop-shadow-sm transition-colors ${isFav !== null ? 'fill-[#FF385C] text-[#FF385C]' : 'fill-black/30 text-white'}`} />
          </button>
        </div>

        {/* Info */}
        <div className="mt-3 space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                {listing.location || listing.city || listing.title}
              </h3>
              <p className="text-gray-500 dark:text-zinc-400 text-sm truncate capitalize">
                {listing.property_type.replace('_', ' ')}
              </p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-gray-900 dark:fill-white text-gray-900 dark:text-white" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{rating}</span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-zinc-400 text-sm">Up to {listing.max_guests} guests</p>
          <p className="text-sm text-gray-900 dark:text-zinc-300 font-semibold mt-1">
            <span className="font-bold text-gray-900 dark:text-white">${price}</span>
            <span className="font-normal text-gray-500 dark:text-zinc-400"> / night</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
