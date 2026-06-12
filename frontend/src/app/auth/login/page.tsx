'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials, setOtpPending } from '@/store/slices/authSlice';
import { Eye, EyeOff, Lock, Phone, Mail, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [isOtpLogin, setIsOtpLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [phoneOtp, setPhoneOtp] = useState(''); // Only for OTP flow
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier || !password) {
      setError('Please fill in all credentials');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginIdentifier: identifier, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      dispatch(setCredentials({ user: data.user, token: data.token }));
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phoneOtp || phoneOtp.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneOtp })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to request OTP');
      }

      dispatch(setOtpPending(phoneOtp));
      router.push('/auth/verify-otp');
    } catch (err: any) {
      setError(err.message || 'Error triggering OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-cream-200 via-cream-50 to-organic-50/40">
      <div className="max-w-md w-full space-y-8 glassmorphism p-8 sm:p-10 rounded-3xl shadow-xl border border-organic-100">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1 bg-organic-50 text-organic-700 px-3 py-1 rounded-full text-[10px] font-bold border border-organic-200">
            <Sparkles className="h-3 w-3" />
            <span>Nashik Organic Sourcing</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-serif">Welcome Back</h2>
          <p className="text-xs text-slate-500">
            Access your organic vegetable basket deliveries
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 flex items-start gap-2 text-xs font-semibold animate-fade-in text-left">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-1 bg-organic-100/50 p-1.5 rounded-2xl border border-organic-200/40">
          <button
            onClick={() => {
              setIsOtpLogin(false);
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              !isOtpLogin ? 'bg-white text-organic-700 shadow-sm' : 'text-slate-500 hover:text-organic-600'
            }`}
          >
            Password Login
          </button>
          <button
            onClick={() => {
              setIsOtpLogin(true);
              setError(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all ${
              isOtpLogin ? 'bg-white text-organic-700 shadow-sm' : 'text-slate-500 hover:text-organic-600'
            }`}
          >
            OTP Login
          </button>
        </div>

        {/* Password Login Form */}
        {!isOtpLogin ? (
          <form onSubmit={handlePasswordLogin} className="space-y-5 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Email or Phone Number</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter email or 10-digit phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600">Password</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-organic-600 hover:text-organic-700 font-bold"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-sm mt-6"
            >
              {loading ? 'Logging in...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        ) : (
          /* OTP Login Form */
          <form onSubmit={handleSendOtp} className="space-y-5 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Mobile Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-sm mt-6"
            >
              {loading ? 'Sending OTP...' : 'Send OTP verification'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className="border-t border-slate-100 pt-6 text-center text-xs text-slate-500 font-medium">
          Don't have an account yet?{' '}
          <Link href="/auth/signup" className="text-organic-600 hover:text-organic-700 font-bold">
            Sign up here
          </Link>
        </div>
      </div>
    </div>
  );
}
