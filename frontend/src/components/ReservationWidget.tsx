'use client';

import { useState, useCallback } from 'react';
import { DateRange, Range } from 'react-date-range';
import { addDays, format, parseISO, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { Users, Calendar, Minus, Plus, Loader2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Listing, BookedDateRange } from '@/types';
import { createBooking } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

interface ReservationWidgetProps {
  listing: Listing;
  bookedDates: BookedDateRange[];
}

function isDateBooked(date: Date, bookedDates: BookedDateRange[]): boolean {
  return bookedDates.some(({ check_in, check_out }) => {
    const start = parseISO(check_in);
    const end = parseISO(check_out);
    return isWithinInterval(date, { start, end: addDays(end, -1) });
  });
}

export default function ReservationWidget({ listing, bookedDates }: ReservationWidgetProps) {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);
  const [guestsCount, setGuestsCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState<Range>({
    startDate: undefined,
    endDate: undefined,
    key: 'selection',
  });

  // Build set of booked dates for disabling
  const disabledDates: Date[] = [];
  try {
    bookedDates.forEach(({ check_in, check_out }) => {
      const dates = eachDayOfInterval({
        start: parseISO(check_in),
        end: parseISO(check_out)
      });
      disabledDates.push(...dates);
    });
  } catch {
    // Fail silently if invalid date format
  }

  const pricePerNight = parseFloat(listing.price_per_night);
  const nights = dateRange.startDate && dateRange.endDate
    ? Math.max(0, Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const subtotal = nights * pricePerNight;
  const cleaningFee = Math.round(pricePerNight * 0.15);
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + cleaningFee + serviceFee;

  const handleReserve = async () => {
    if (!isAuthenticated || !user) {
      toast.error('Please sign in to make a reservation.');
      router.push('/login');
      return;
    }
    if (!dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select check-in and check-out dates.');
      return;
    }

    setLoading(true);
    try {
      await createBooking({
        guest: user!.id,
        listing: listing.id,
        check_in: format(dateRange.startDate, 'yyyy-MM-dd'),
        check_out: format(dateRange.endDate, 'yyyy-MM-dd'),
        guests_count: guestsCount,
      });
      toast.success('Reservation confirmed!');
      setDateRange({ startDate: undefined, endDate: undefined, key: 'selection' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Booking failed';
      try {
        const parsed = JSON.parse(message);
        const errorMsg = Object.values(parsed).flat().join(' ');
        toast.error(errorMsg || 'Booking failed');
      } catch {
        toast.error('Booking failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-xl dark:shadow-black/20 p-6 space-y-5 transition-colors duration-200">
      {/* Price Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">${pricePerNight.toFixed(0)}</span>
          <span className="text-gray-500 dark:text-zinc-400 text-sm ml-1">/ night</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-zinc-300">
          <Star className="w-4 h-4 fill-gray-900 dark:fill-white text-gray-900 dark:text-white" />
          <span className="font-semibold">{listing.average_rating?.toFixed(2) || '4.87'}</span>
          <span className="text-gray-400 dark:text-zinc-500">· {listing.review_count} reviews</span>
        </div>
      </div>

      {/* Date Picker */}
      <div
        onClick={() => setShowCalendar(!showCalendar)}
        className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#121212] rounded-xl overflow-hidden cursor-pointer hover:border-gray-400 dark:hover:border-zinc-700 transition-colors"
      >
        <div className="grid grid-cols-2 divide-x divide-gray-300 dark:divide-zinc-800">
          <div className="p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-zinc-400">Check-in</p>
            <p className="text-sm text-gray-900 dark:text-white mt-0.5">
              {dateRange.startDate ? format(dateRange.startDate, 'MMM dd, yyyy') : 'Add date'}
            </p>
          </div>
          <div className="p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-zinc-400">Check-out</p>
            <p className="text-sm text-gray-900 dark:text-white mt-0.5">
              {dateRange.endDate ? format(dateRange.endDate, 'MMM dd, yyyy') : 'Add date'}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      {showCalendar && (
        <div className="overflow-x-auto border border-gray-200 dark:border-zinc-800 rounded-xl p-1 bg-white dark:bg-[#1e1e1e]">
          <DateRange
            editableDateInputs
            onChange={(item) => {
              setDateRange(item.selection);
              if (item.selection.startDate && item.selection.endDate &&
                  item.selection.startDate !== item.selection.endDate) {
                setShowCalendar(false);
              }
            }}
            moveRangeOnFirstSelection={false}
            ranges={[dateRange]}
            minDate={addDays(new Date(), 1)}
            disabledDates={disabledDates}
            rangeColors={['#FF385C']}
            months={1}
            direction="horizontal"
          />
        </div>
      )}

      {/* Guests Counter */}
      <div className="border border-gray-300 dark:border-zinc-800 bg-white dark:bg-[#121212] rounded-xl p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-700 dark:text-zinc-400">Guests</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {guestsCount} {guestsCount === 1 ? 'guest' : 'guests'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-zinc-700 flex items-center justify-center hover:border-gray-500 dark:hover:border-zinc-550 transition-colors disabled:opacity-30"
              disabled={guestsCount <= 1}
            >
              <Minus className="w-3.5 h-3.5 text-gray-700 dark:text-zinc-300" />
            </button>
            <span className="text-sm font-semibold w-4 text-center dark:text-white">{guestsCount}</span>
            <button
              onClick={() => setGuestsCount(Math.min(listing.max_guests, guestsCount + 1))}
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-zinc-700 flex items-center justify-center hover:border-gray-500 dark:hover:border-zinc-550 transition-colors disabled:opacity-30"
              disabled={guestsCount >= listing.max_guests}
            >
              <Plus className="w-3.5 h-3.5 text-gray-700 dark:text-zinc-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Reserve Button */}
      <button
        onClick={handleReserve}
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#FF385C] to-[#FF5A5F] text-white font-semibold py-4 rounded-xl hover:from-[#E00B41] hover:to-[#FF385C] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-[#FF385C]/30 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          'Reserve'
        )}
      </button>

      <p className="text-center text-xs text-gray-400">You won&apos;t be charged yet</p>

      {/* Price Breakdown */}
      {nights > 0 && (
        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-zinc-300">
          <div className="flex justify-between text-sm">
            <span>${pricePerNight.toFixed(0)} × {nights} {nights === 1 ? 'night' : 'nights'}</span>
            <span className="font-semibold text-gray-900 dark:text-white">${subtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Cleaning fee</span>
            <span className="font-semibold text-gray-900 dark:text-white">${cleaningFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Service fee</span>
            <span className="font-semibold text-gray-900 dark:text-white">${serviceFee}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-3 border-t border-gray-100 dark:border-zinc-800">
            <span>Total</span>
            <span>${total.toFixed(0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
