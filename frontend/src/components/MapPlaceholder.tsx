'use client';

import { useState } from 'react';
import { Map, X, MapPin, Compass, AlertCircle } from 'lucide-react';

export default function MapPlaceholder() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-zinc-800 text-white hover:scale-105 active:scale-95 px-5 py-3.5 rounded-full shadow-2xl transition-all duration-200 z-40 flex items-center gap-2 text-sm font-semibold tracking-wide border border-zinc-800/20 dark:border-zinc-700/50"
      >
        <Map className="w-4 h-4" /> Show map
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-white dark:bg-[#121212] z-50 flex flex-col transition-colors duration-200 pt-16 md:pt-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-[#121212] z-10 transition-colors duration-200">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#FF385C]" /> Interactive Map View
          </h2>
          <p className="text-xs text-gray-400 dark:text-zinc-500">Live property pricing pins across the globe</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 bg-gray-100 dark:bg-zinc-900 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 transition-all flex items-center justify-center"
          aria-label="Close map"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main mockup body */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-950 p-6 transition-colors duration-200">
        
        {/* Mockup grid lines overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />

        {/* Abstract map topography circles */}
        <div className="absolute w-[400px] h-[400px] rounded-full border border-gray-200/50 dark:border-zinc-850/30 opacity-50 scale-75 md:scale-100" />
        <div className="absolute w-[600px] h-[600px] rounded-full border border-gray-200/30 dark:border-zinc-850/20 opacity-50 scale-75 md:scale-100" />
        
        {/* Mock pricing pins */}
        <div className="absolute top-[30%] left-[25%] bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-1.5 rounded-full font-bold shadow-md text-xs border border-gray-100 dark:border-zinc-800 flex items-center gap-1 hover:scale-110 transition-transform">
          <MapPin className="w-3 h-3 text-[#FF385C] fill-[#FF385C]" /> $120
        </div>
        <div className="absolute top-[45%] right-[20%] bg-[#FF385C] text-white px-3 py-1.5 rounded-full font-bold shadow-md text-xs flex items-center gap-1 hover:scale-110 transition-transform">
          <MapPin className="w-3 h-3 fill-white" /> $340
        </div>
        <div className="absolute bottom-[25%] left-[40%] bg-white dark:bg-zinc-900 text-gray-900 dark:text-white px-3 py-1.5 rounded-full font-bold shadow-md text-xs border border-gray-100 dark:border-zinc-800 flex items-center gap-1 hover:scale-110 transition-transform">
          <MapPin className="w-3 h-3 text-[#FF385C] fill-[#FF385C]" /> $95
        </div>

        {/* Centered Coming Soon Card */}
        <div className="relative max-w-md w-full bg-white/80 dark:bg-[#1e1e1e]/85 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-zinc-800/50 text-center transition-colors duration-200">
          <div className="w-14 h-14 bg-[#FF385C]/10 dark:bg-[#FF385C]/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Map className="w-7 h-7 text-[#FF385C]" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Real-Time Map View
          </h3>
          
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full mb-4 border border-amber-100 dark:border-amber-900/50 uppercase tracking-wide">
            <AlertCircle className="w-3 h-3" /> Coming Soon
          </div>

          <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed mb-6">
            We are working on an interactive vector map. You will soon be able to search properties geographically, see live prices pinned directly to their locations, and drag the map to browse listings dynamically.
          </p>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-[#FF385C] text-white font-semibold py-2.5 rounded-xl hover:bg-[#E00B41] transition-colors text-sm shadow-md"
          >
            Close Map & Browse List
          </button>
        </div>
      </div>
    </div>
  );
}
