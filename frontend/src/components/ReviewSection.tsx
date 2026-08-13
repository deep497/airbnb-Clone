'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2, Send, Trash2 } from 'lucide-react';
import { fetchReviews, createReview, deleteReview } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { Review } from '@/types';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

interface Props {
  listingId: number;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHovered(star)}
          onMouseLeave={() => onChange && setHovered(0)}
          disabled={!onChange}
          className="transition-transform hover:scale-110 disabled:cursor-default"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= (hovered || value)
                ? 'fill-[#FF385C] text-[#FF385C]'
                : 'fill-gray-250 dark:fill-zinc-800 text-gray-250 dark:text-zinc-800'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ listingId }: Props) {
  const { user, isAuthenticated, isGuest } = useAuth();
  const [reviews, setReviews]   = useState<Review[]>([]);
  const [loading, setLoading]   = useState(true);
  const [rating, setRating]     = useState(5);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const userHasReviewed = reviews.some((r) => r.guest === user?.id);
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  useEffect(() => {
    fetchReviews(listingId)
      .then(setReviews)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [listingId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const newReview = await createReview({
        listing: listingId,
        guest: user.id,
        rating,
        comment,
      });
      setReviews((prev) => [newReview, ...prev]);
      setComment('');
      setRating(5);
      toast.success('Review submitted!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already reviewed')) {
        toast.error('You have already reviewed this listing.');
      } else {
        toast.error('Failed to submit review.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(reviewId: number) {
    try {
      await deleteReview(reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success('Review deleted.');
    } catch {
      toast.error('Failed to delete review.');
    }
  }

  return (
    <div className="mt-10 border-t border-gray-200 dark:border-zinc-800 pt-10 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Star className="w-5 h-5 fill-gray-900 dark:fill-white text-gray-900 dark:text-white" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {avgRating ? `${avgRating} · ` : ''}{reviews.length} Review{reviews.length !== 1 ? 's' : ''}
        </h2>
      </div>

      {/* Write a review form */}
      {isAuthenticated && isGuest && !userHasReviewed && (
        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 mb-8">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Leave a review</h3>
          <div className="mb-3">
            <label className="text-sm text-gray-650 dark:text-zinc-400 mb-1 block">Your rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this listing..."
            rows={3}
            className="w-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#121212] text-gray-900 dark:text-white rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C]"
          />
          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            className="mt-3 flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-[#E00B41] disabled:opacity-50 transition-colors text-sm cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {!isAuthenticated && (
        <div className="bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 mb-8 text-sm text-gray-500 dark:text-zinc-400">
          <a href="/login" className="text-[#FF385C] font-semibold hover:underline">Sign in</a> to leave a review.
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 text-[#FF385C] animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-gray-400 dark:text-zinc-600">
          <Star className="w-10 h-10 mx-auto mb-3 text-gray-200 dark:text-zinc-800" />
          <p className="text-sm">No reviews yet. Be the first to review this listing!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 dark:border-zinc-850 pb-6 last:border-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#FF385C] to-[#FF5A5F] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {review.guest_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{review.guest_name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{format(parseISO(review.created_at), 'MMMM yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StarRating value={review.rating} />
                  {user?.id === review.guest && (
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-gray-300 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-1 cursor-pointer"
                      title="Delete review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
