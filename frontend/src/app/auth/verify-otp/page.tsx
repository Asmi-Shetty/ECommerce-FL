'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { setCredentials, clearOtpPending } from '@/store/slices/authSlice';
import { ShieldCheck, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

export default function VerifyOtpPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { otpPhonePending } = useSelector((state: RootState) => state.auth);
  
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no phone number is pending OTP, redirect back to login
    if (!otpPhonePending) {
      router.push('/auth/login');
    }
  }, [otpPhonePending, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.length < 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: otpPhonePending, code })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      dispatch(setCredentials({ user: data.user, token: data.token }));
      dispatch(clearOtpPending());
      
      // Navigate to profile setup if this is a newly registered number, otherwise main app
      if (!data.user.name) {
        router.push('/auth/profile-setup');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
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
            <span>Verify Phone Number</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-serif">Enter OTP Code</h2>
          <p className="text-xs text-slate-500 font-sans">
            We have sent a verification code to <span className="font-bold text-slate-800">+91 {otpPhonePending}</span>. 
            Check your server terminal log for the mock SMS output!
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 flex items-start gap-2 text-xs font-semibold animate-fade-in text-left">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-650 block text-center">6-Digit Code</label>
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="0 0 0 0 0 0"
              className="w-full tracking-[1em] text-center font-bold text-xl py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-organic-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-sm"
          >
            {loading ? 'Verifying...' : 'Verify Code & Sign In'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Didn't receive code?{' '}
          <button
            onClick={() => router.push('/auth/login')}
            className="text-organic-600 hover:underline font-bold"
          >
            Try another method
          </button>
        </div>
      </div>
    </div>
  );
}
