'use client';

import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';

export default function HeroSection() {
  function handleExplore() {
    const el = document.getElementById('listings');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#121212] transition-colors duration-200">
      {/* ── Subtle background pattern ─────────────────────────── */}
      {/* A very faint dot grid — visible in light mode, hidden in dark */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none
          [background-image:radial-gradient(circle,#e5e7eb_1px,transparent_1px)]
          [background-size:28px_28px]
          opacity-60 dark:opacity-0"
      />

      {/* ── Warm gradient bleed at top-right ──────────────────── */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full
          bg-[#FF385C]/8 dark:bg-[#FF385C]/5 blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-16 -left-20 w-[280px] h-[280px] rounded-full
          bg-orange-100/60 dark:bg-orange-950/10 blur-2xl pointer-events-none"
      />

      {/* ── Hero content ──────────────────────────────────────── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="hero-animate max-w-2xl">

          {/* Eyebrow label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full
              bg-[#FF385C]/8 dark:bg-[#FF385C]/12
              border border-[#FF385C]/15 dark:border-[#FF385C]/20
              mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF385C] shrink-0" />
            <span className="text-xs font-semibold text-[#FF385C] tracking-wide uppercase">
              Real listings · Real hosts
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold
              text-gray-900 dark:text-white
              leading-tight tracking-tight mb-4">
            Find your place to stay,{' '}
            <span className="text-[#FF385C]">anywhere.</span>
          </h1>

          {/* Sub-headline — honest product copy */}
          <p className="text-base sm:text-lg text-gray-500 dark:text-zinc-400
              max-w-xl leading-relaxed mb-8">
            Browse unique homes, cabins, villas, and more — listed by real
            hosts. No inflated reviews, no hidden surprises.
          </p>

          {/* CTA group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary CTA */}
            <button
              onClick={handleExplore}
              className="inline-flex items-center justify-center gap-2
                bg-[#FF385C] hover:bg-[#E00B41] active:scale-[0.97]
                text-white font-semibold
                px-6 py-3.5 rounded-xl
                shadow-md shadow-[#FF385C]/20
                transition-all duration-150
                text-sm sm:text-base"
            >
              <Search className="w-4 h-4 shrink-0" />
              Explore Stays
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Secondary CTA */}
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2
                border border-gray-300 dark:border-zinc-700
                text-gray-700 dark:text-zinc-300
                hover:bg-gray-50 dark:hover:bg-zinc-900
                active:scale-[0.97]
                font-semibold
                px-6 py-3.5 rounded-xl
                transition-all duration-150
                text-sm sm:text-base"
            >
              List your property
            </Link>
          </div>

          {/* Honest trust signals — no fake numbers */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2
              text-xs text-gray-400 dark:text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-600" />
              OTP-based sign-in — no passwords
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-600" />
              Host &amp; Guest accounts
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-600" />
              Live booking calendar
            </span>
          </div>
        </div>
      </div>

      {/* ── Divider ────────────────────────────────────────────── */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-800 to-transparent mx-8" />
    </section>
  );
}
