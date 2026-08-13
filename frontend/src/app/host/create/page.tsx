'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, X, Plus, Home, Loader2, ImageIcon } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { createListing } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

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

interface FormData {
  title: string;
  description: string;
  property_type: string;
  city: string;
  country: string;
  price_per_night: string;
  max_guests: string;
}

export default function CreateListingPage() {
  const router = useRouter();
  const { user, isHost } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    property_type: 'house',
    city: '',
    country: '',
    price_per_night: '',
    max_guests: '2',
  });

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = [...images, ...files].slice(0, 8);
    setImages(newImages);

    const newPreviews = newImages.map((f) => URL.createObjectURL(f));
    setImagePreviews(newPreviews);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.city || !formData.country || !formData.price_per_night) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('host', String(user!.id));
      fd.append('title', formData.title);
      fd.append('description', formData.description);
      fd.append('property_type', formData.property_type);
      fd.append('city', formData.city);
      fd.append('country', formData.country);
      fd.append('price_per_night', formData.price_per_night);
      fd.append('max_guests', formData.max_guests);
      fd.append('amenities', JSON.stringify(selectedAmenities));

      for (const image of images) {
        fd.append('images', image);
      }

      const listing = await createListing(fd);
      toast.success('Listing created successfully!');
      router.push(`/listings/${listing.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create listing';
      try {
        const parsed = JSON.parse(message);
        const errorMsg = Object.values(parsed).flat().join(' ');
        toast.error(errorMsg || 'Failed to create listing');
      } catch {
        toast.error('Failed to create listing. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isHost) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Host access only</h1>
        <p className="text-gray-500 mb-8">Switch to Host Mode to create listings.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-[#FF385C] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#E00B41] transition-colors"
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-10">
        <Link href="/host" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          ← Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create a new listing</h1>
        <p className="text-gray-500 mt-1">Share your space with guests around the world.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-0 mb-10">
        {['Basic Info', 'Details', 'Photos'].map((label, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <div key={label} className="flex items-center flex-1">
              <div
                className={`flex items-center gap-2 cursor-pointer ${i < 2 ? 'flex-1' : ''}`}
                onClick={() => setStep(stepNum)}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-[#FF385C] text-white'
                      : isDone
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? '✓' : stepNum}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:block ${
                    isActive ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < 2 && <div className="flex-1 h-0.5 bg-gray-200 mx-2" />}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Listing title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Cozy beachfront villa with ocean views"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your space, what's special about it, and what guests can expect..."
                  rows={5}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Property type
                </label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent transition bg-white"
                >
                  {PROPERTY_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-gray-900 text-white font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-900">Location & Pricing</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g., Malibu"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g., United States"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Price per night (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <input
                      type="number"
                      name="price_per_night"
                      value={formData.price_per_night}
                      onChange={handleChange}
                      placeholder="150"
                      min="1"
                      className="w-full border border-gray-300 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] transition"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max guests
                  </label>
                  <input
                    type="number"
                    name="max_guests"
                    value={formData.max_guests}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C] transition"
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COMMON_AMENITIES.map((amenity) => {
                  const selected = selectedAmenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        selected
                          ? 'bg-[#FF385C] text-white border-[#FF385C]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {selected && <span className="text-xs">✓</span>}
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-gray-900 text-white font-semibold py-4 rounded-xl hover:bg-gray-800 transition-colors"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add photos</h2>
                <p className="text-sm text-gray-500 mt-1">
                  The first photo will be the cover image. Add up to 8 photos.
                </p>
              </div>

              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-[#FF385C] hover:bg-red-50/50 transition-all group"
              >
                <div className="w-12 h-12 bg-gray-100 group-hover:bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#FF385C] transition-colors" />
                </div>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-[#FF385C] transition-colors">
                  Click to upload photos
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB each</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img
                        src={preview}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      {idx === 0 && (
                        <span className="absolute bottom-1.5 left-1.5 bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">
                          Cover
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                      >
                        <X className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 8 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#FF385C] hover:bg-red-50/50 transition-all"
                    >
                      <Plus className="w-5 h-5 text-gray-400" />
                    </button>
                  )}
                </div>
              )}

              {imagePreviews.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl text-sm text-amber-700">
                  <ImageIcon className="w-4 h-4 flex-shrink-0" />
                  No photos yet. You can still create the listing and add photos later.
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#FF385C] text-white font-semibold py-4 rounded-xl hover:bg-[#E00B41] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Listing'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
