'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, Users, Wifi, UtensilsCrossed, Car, Waves, Dumbbell, Wind, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
import { Listing } from '@/types';

interface ListingGalleryProps {
  listing: Listing;
}

function ImageOrFallback({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
        <span className="text-5xl mb-3">🏠</span>
        <p className="text-gray-400 text-sm font-medium">Add your image here</p>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setError(true)}
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  );
}

export function ListingGallery({ listing }: ListingGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const images = listing.images;

  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden h-[500px]">
      {/* Main Image */}
      <div className="relative col-span-1 row-span-2 bg-gray-100">
        <ImageOrFallback
          src={images[activeIdx]?.image || listing.cover_image}
          alt={listing.title}
        />
      </div>

      {/* Secondary Images */}
      {[1, 2, 3, 4].map((idx) => (
        <div
          key={idx}
          className="relative bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => images[idx] && setActiveIdx(idx)}
        >
          <ImageOrFallback
            src={images[idx]?.image || null}
            alt={`${listing.title} view ${idx + 1}`}
          />
        </div>
      ))}
    </div>
  );
}

const AMENITY_ICONS: Record<string, React.ElementType> = {
  wifi: Wifi,
  kitchen: UtensilsCrossed,
  parking: Car,
  pool: Waves,
  gym: Dumbbell,
  'air conditioning': Wind,
  tv: Tv,
  default: Star,
};

function getAmenityIcon(amenity: string) {
  const key = amenity.toLowerCase();
  for (const [k, Icon] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k)) return Icon;
  }
  return AMENITY_ICONS.default;
}

export function AmenitiesGrid({ amenities }: { amenities: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {amenities.map((amenity) => {
        const Icon = getAmenityIcon(amenity);
        return (
          <div key={amenity} className="flex items-center gap-3 py-3 border-b border-gray-100">
            <Icon className="w-5 h-5 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
            <span className="text-sm text-gray-700">{amenity}</span>
          </div>
        );
      })}
    </div>
  );
}
