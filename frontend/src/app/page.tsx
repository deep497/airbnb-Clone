import { Suspense } from "react";
import { fetchListings } from "@/lib/api";
import ListingCard from "@/components/ListingCard";
import Categories from "@/components/Categories";
import MapPlaceholder from "@/components/MapPlaceholder";
import { Listing } from "@/types";
import { Loader2 } from "lucide-react";


interface HomeProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    city?: string;
  }>;
}

async function ListingsGrid({ searchParams }: HomeProps) {
  const params = await searchParams;
  const queryParams: Record<string, string> = {};

  if (params.category) queryParams.category = params.category;
  if (params.search) queryParams.search = params.search;
  if (params.city) queryParams.city = params.city;

  let listings: Listing[] = [];
  let error: string | null = null;

  try {
    listings = await fetchListings(Object.keys(queryParams).length > 0 ? queryParams : undefined);
  } catch (e) {
    error = "Could not load listings. Make sure the backend is running.";
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Backend not connected</h2>
        <p className="text-gray-500 max-w-sm">{error}</p>
        <code className="mt-4 bg-gray-100 px-4 py-2 rounded-lg text-sm text-gray-700">
          cd backend && python manage.py runserver
        </code>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <span className="text-4xl">🏠</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No listings yet</h2>
        <p className="text-gray-500 max-w-sm mb-6">
          {Object.keys(queryParams).length > 0
            ? 'No listings match your search. Try different filters.'
            : 'Be the first to list your property! Sign in as a Host and create a listing.'}
        </p>
        {Object.keys(queryParams).length === 0 && (
          <a href="/login" className="bg-[#FF385C] text-white font-semibold px-5 py-3 rounded-xl hover:bg-[#E00B41] transition-colors text-sm">
            Sign in to host
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

export default async function HomePage({ searchParams }: HomeProps) {
  return (
    <>
      <Suspense fallback={<div className="h-14 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-zinc-800 animate-pulse" />}>
        <Categories />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex justify-center items-center py-32">
              <Loader2 className="w-8 h-8 text-[#FF385C] animate-spin" />
            </div>
          }
        >
          <ListingsGrid searchParams={searchParams} />
        </Suspense>
      </div>

      <MapPlaceholder />
    </>
  );
}
