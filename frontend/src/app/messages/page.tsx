'use client';

import Link from 'next/link';
import { MessageSquare, ArrowLeft, Clock } from 'lucide-react';

export default function MessagesComingSoon() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 bg-gray-50 dark:bg-[#121212] transition-colors duration-200">
      <div className="max-w-md w-full text-center bg-white dark:bg-[#1e1e1e] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 transition-colors duration-200">
        <div className="w-16 h-16 bg-[#FF385C]/10 dark:bg-[#FF385C]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-8 h-8 text-[#FF385C]" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Inbox & Messaging
        </h1>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full mb-6 border border-amber-100 dark:border-amber-900/50">
          <Clock className="w-3.5 h-3.5" /> Coming Soon
        </div>

        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">
          Direct messaging between hosts and guests is currently in development. You will soon be able to chat, coordinate check-in times, and ask questions directly.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 bg-[#FF385C] text-white font-semibold py-3 rounded-xl hover:bg-[#E00B41] transition-colors text-sm shadow-md"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
