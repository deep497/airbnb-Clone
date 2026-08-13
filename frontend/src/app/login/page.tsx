'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, ArrowRight, Loader2, CheckCircle, User as UserIcon } from 'lucide-react';
import { requestOTP, verifyOTP } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { User } from '@/types';
import toast from 'react-hot-toast';

type Mode = 'signin' | 'signup';
type Step = 'email' | 'otp';

export default function LoginPage() {
  const [mode, setMode]       = useState<Mode>('signin');
  const [step, setStep]       = useState<Step>('email');
  const [email, setEmail]     = useState('');
  const [name, setName]       = useState('');
  const [role, setRole]       = useState<'host' | 'guest'>('guest');
  const [otp, setOtp]         = useState('');
  const [devOtp, setDevOtp]   = useState('');   // shown in dev mode
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const router                = useRouter();

  // ── Step 1: Request OTP ───────────────────────────────────────
  async function handleRequestOTP(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await requestOTP(email.trim().toLowerCase(), mode);
      setDevOtp(res.dev_otp || '');
      setStep('otp');
      toast.success('OTP sent! Check your console or see below.');
    } catch (err: unknown) {
      let errMsg = 'Failed to send OTP. Please try again.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          // ignore
        }
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ────────────────────────────────────────
  async function handleVerifyOTP(e: FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await verifyOTP(email, otp, mode, role, name);
      login(res.token, res.user as User);
      toast.success(`Welcome${res.is_new_user ? '! Your account has been created.' : ' back!'}`);
      
      // Redirect based on role
      if (res.user.role === 'host') {
        router.push('/host');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      let errMsg = 'Invalid or expired OTP. Please try again.';
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) errMsg = parsed.error;
        } catch {
          // ignore
        }
      }
      toast.error(errMsg);
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-[#FF385C]">
            <svg viewBox="0 0 32 32" className="w-10 h-10 fill-current">
              <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.54 7.1 14.836l.145.353c.667 1.591.91 2.472.96 3.396l.01.415.001.228c0 4.062-2.877 6.478-6.357 6.478-2.224 0-4.556-1.258-6.117-3.38l-.189-.267-.592-.963-.592.963-.189.267C13.652 29.742 11.32 31 9.096 31c-3.388 0-6.199-2.285-6.35-6.244l-.007-.234.001-.228.01-.415c.05-.924.293-1.805.96-3.396l.145-.353c.985-2.296 5.145-11.006 7.1-14.836l.533-1.025C12.537 1.963 13.992 1 16 1zm0 2c-1.239 0-2.053.539-3.031 2.088l-.787 1.408C10.04 9.96 5.723 19 4.847 21.212l-.143.349c-.542 1.303-.74 2.003-.775 2.763l-.008.214-.001.211c0 2.919 1.874 4.78 4.357 4.78 1.723 0 3.584-1.023 4.908-2.914l.22-.322.558-.91 1.353-2.209 1.353 2.208.558.91.22.322c1.324 1.891 3.185 2.914 4.908 2.914 2.483 0 4.357-1.861 4.357-4.78l-.001-.211-.008-.214c-.035-.76-.233-1.46-.775-2.763l-.143-.349C26.277 19 21.96 9.96 19.818 6.496l-.787-1.408C18.053 3.539 17.239 3 16 3z"/>
            </svg>
            <span className="text-2xl font-bold tracking-tight">airbnb</span>
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Sign in or create your account</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FF385C] to-[#FF5A5F] px-8 py-6 text-white">
            <h1 className="text-xl font-bold">
              {step === 'email' 
                ? (mode === 'signin' ? 'Welcome Back' : 'Create an Account') 
                : 'Check your email'}
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {step === 'email'
                ? (mode === 'signin' ? 'Enter your email to sign in' : 'Choose a role and enter your email to get started')
                : `We sent a 6-digit code to ${email}`}
            </p>
          </div>

          {/* Mode Switch Tabs (Only show in step 1) */}
          {step === 'email' && (
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-all ${
                  mode === 'signin' 
                    ? 'border-[#FF385C] text-[#FF385C]' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-all ${
                  mode === 'signup' 
                    ? 'border-[#FF385C] text-[#FF385C]' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          <div className="px-8 py-8">
            {/* Step indicators */}
            <div className="flex items-center gap-3 mb-8">
              {(['email', 'otp'] as Step[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s
                      ? 'bg-[#FF385C] text-white'
                      : i < (['email', 'otp'] as Step[]).indexOf(step)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < (['email', 'otp'] as Step[]).indexOf(step)
                      ? <CheckCircle className="w-4 h-4" />
                      : i + 1}
                  </div>
                  {i < 1 && <div className={`flex-1 h-0.5 w-12 rounded ${step === 'otp' ? 'bg-[#FF385C]' : 'bg-gray-200'}`} />}
                </div>
              ))}
            </div>

            {/* ── Email Step ─────────────────────────────────── */}
            {step === 'email' && (
              <form onSubmit={handleRequestOTP} className="space-y-5">
                
                {/* Sign Up Fields */}
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Your Name
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/30 focus:border-[#FF385C] transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Choose Your Role
                      </label>
                      <div className="flex gap-3">
                        {(['guest', 'host'] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRole(r)}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 capitalize transition-all ${
                              role === r 
                                ? 'border-[#FF385C] bg-red-50 text-[#FF385C]' 
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="login-email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF385C]/30 focus:border-[#FF385C] transition-all"
                    />
                  </div>
                </div>

                <button
                  id="request-otp-btn"
                  type="submit"
                  disabled={loading || !email}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF385C] text-white font-semibold py-3.5 rounded-xl hover:bg-[#E00B41] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-[#FF385C]/30"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {loading ? 'Sending...' : (mode === 'signin' ? 'Send OTP to Sign In' : 'Send OTP to Sign Up')}
                </button>
              </form>
            )}

            {/* ── OTP Step ───────────────────────────────────── */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                {/* Dev mode OTP display */}
                {devOtp && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">
                      🛠 Development Mode
                    </p>
                    <p className="text-sm text-amber-800">
                      Your OTP is: <span className="font-mono font-bold text-lg text-amber-900">{devOtp}</span>
                    </p>
                    <p className="text-xs text-amber-600 mt-1">Remove this in production</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    6-digit OTP
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="otp-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#FF385C]/30 focus:border-[#FF385C] transition-all"
                    />
                  </div>
                </div>

                <button
                  id="verify-otp-btn"
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF385C] text-white font-semibold py-3.5 rounded-xl hover:bg-[#E00B41] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-[#FF385C]/30"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {loading ? 'Verifying...' : 'Verify & Log In'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtp(''); setDevOtp(''); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
                >
                  ← Back to email
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By continuing, you agree to our{' '}
          <span className="text-[#FF385C] cursor-pointer hover:underline">Terms</span> and{' '}
          <span className="text-[#FF385C] cursor-pointer hover:underline">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
