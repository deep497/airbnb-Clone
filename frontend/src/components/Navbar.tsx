'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, Menu, User, Home, Heart, Calendar, LogOut, Settings, 
  ChevronDown, Sun, Moon, MessageSquare 
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { logout as apiLogout } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, isAuthenticated, isHost, logout } = useAuth();
  const { theme, toggleTheme, isMounted } = useTheme();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const router  = useRouter();
  const pathname = usePathname();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    try { await apiLogout(); } catch { /* ignore */ }
    logout();
    toast.success('Logged out successfully');
    setMenuOpen(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const isOnLogin = pathname === '/login';
  if (isOnLogin) return null;

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-[#121212] border-b border-gray-200 dark:border-zinc-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0 text-[#FF385C]">
            <svg viewBox="0 0 32 32" className="w-8 h-8 fill-current">
              <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415.001.228c0 4.062-2.877 6.478-6.357 6.478-2.224 0-4.556-1.258-6.117-3.38l-.189-.267-.592-.963-.592.963-.189.267C13.652 29.742 11.32 31 9.096 31c-3.388 0-6.199-2.285-6.35-6.244l-.007-.234.001-.228.01-.415c.05-.924.293-1.805.96-3.396l.145-.353c.985-2.296 5.145-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.239 0-2.053.539-3.031 2.088l-.787 1.408C10.04 9.96 5.723 19 4.847 21.212l-.143.349c-.542 1.303-.74 2.003-.775 2.763l-.008.214-.001.211c0 2.919 1.874 4.78 4.357 4.78 1.723 0 3.584-1.023 4.908-2.914l.22-.322.558-.91 1.353-2.209 1.353 2.208.558.91.22.322c1.324 1.891 3.185 2.914 4.908 2.914 2.483 0 4.357-1.861 4.357-4.78l-.001-.211-.008-.214c-.035-.76-.233-1.46-.775-2.763l-.143-.349C26.277 19 21.96 9.96 19.818 6.496l-.787-1.408C18.053 3.539 17.239 3 16 3z"/>
            </svg>
            <span className="text-lg font-bold hidden sm:block tracking-tight">airbnb</span>
          </Link>

          {/* ── Search Bar ────────────────────────────────────── */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="flex items-center w-full border border-gray-300 dark:border-zinc-800 rounded-full shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white dark:bg-zinc-900">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations..."
                className="flex-1 px-5 py-2.5 text-sm text-gray-700 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none bg-transparent"
              />
              <button
                type="submit"
                className="bg-[#FF385C] text-white px-4 py-2.5 hover:bg-[#E00B41] transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* ── Right Side ───────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Airbnb your home link */}
            {isAuthenticated && isHost && (
              <Link href="/host/create"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-900 px-3 py-2 rounded-full transition-colors">
                <Home className="w-4 h-4" /> Host
              </Link>
            )}

            {/* Dark Mode Toggle Button */}
            {isMounted && (
              <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-300 transition-colors"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                aria-label="Toggle dark mode"
              >
                {theme === 'light' ? (
                  <Moon className="w-4.5 h-4.5" />
                ) : (
                  <Sun className="w-4.5 h-4.5 text-amber-500" />
                )}
              </button>
            )}

            {/* User Menu */}
            <div className="relative" ref={menuRef}>
              <button
                id="user-menu-btn"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 border border-gray-200 dark:border-zinc-800 rounded-full py-1.5 px-3 hover:shadow-md transition-all bg-white dark:bg-zinc-900"
              >
                <Menu className="w-4 h-4 text-gray-700 dark:text-zinc-300" />
                <div className="w-7 h-7 bg-gradient-to-br from-[#FF385C] to-[#FF5A5F] rounded-full flex items-center justify-center">
                  {user ? (
                    <span className="text-white text-xs font-bold">
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </span>
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>
                {user && (
                  <ChevronDown className="w-3 h-3 text-gray-500 transition-transform duration-200" />
                )}
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden text-gray-700 dark:text-zinc-200">
                  {isAuthenticated && user ? (
                    <>
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                        <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{user.name || user.email.split('@')[0]}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{user.email}</p>
                        <span className={`inline-flex items-center mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          isHost ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-350' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-350'
                        }`}>
                          {isHost ? '🏠 Host' : '🧳 Guest'}
                        </span>
                      </div>

                      {/* Menu items */}
                      <div className="py-2">
                        {isHost ? (
                          <>
                            <Link href="/host" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                              <Home className="w-4 h-4 text-gray-400 dark:text-zinc-550" /> Host Dashboard
                            </Link>
                            <Link href="/host/create" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                              <Settings className="w-4 h-4 text-gray-400 dark:text-zinc-550" /> New Listing
                            </Link>
                            <Link href="/messages" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                              <MessageSquare className="w-4 h-4 text-gray-400 dark:text-zinc-550" /> Inbox (Chat)
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link href="/guest" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                              <User className="w-4 h-4 text-gray-400 dark:text-zinc-550" /> My Dashboard
                            </Link>
                            <Link href="/trips" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                              <Calendar className="w-4 h-4 text-gray-400 dark:text-zinc-550" /> My Trips
                            </Link>
                            <Link href="/guest?tab=favorites" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                              <Heart className="w-4 h-4 text-gray-400 dark:text-zinc-550" /> Favorites
                            </Link>
                            <Link href="/messages" onClick={() => setMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                              <MessageSquare className="w-4 h-4 text-gray-400 dark:text-zinc-550" /> Inbox (Chat)
                            </Link>
                          </>
                        )}
                      </div>

                      <div className="border-t border-gray-100 dark:border-zinc-800 py-2">
                        <button onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors w-full text-left">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-2">
                      <Link href="/login" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                        Sign in
                      </Link>
                      <Link href="/login" onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors">
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
