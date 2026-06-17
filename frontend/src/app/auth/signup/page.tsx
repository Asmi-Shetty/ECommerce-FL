'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/store/slices/authSlice';
import { Eye, EyeOff, Lock, Phone, Mail, User, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'VENDOR'>('CUSTOMER');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !phone || !password) {
      setError('Name, phone number, and password are required fields');
      return;
    }

    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email: email || undefined, password, role })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      dispatch(setCredentials({ user: data.user, token: data.token }));
      
      if (role === 'CUSTOMER') {
        router.push('/auth/profile-setup');
      } else {
        router.push('/auth/login'); // Vendor setup flow
      }
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
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
            <span>Join Krishna Organic</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-serif">Create Account</h2>
          <p className="text-xs text-slate-500 font-sans">
            Start ordering fresh pesticide-free vegetables
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 flex items-start gap-2 text-xs font-semibold animate-fade-in text-left">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4 text-left">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Mobile Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="tel"
                placeholder="Enter 10-digit phone"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Email Address (Optional)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 characters"
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

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600">Account Role</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <label className={`flex items-center justify-center gap-2 border p-3 rounded-xl cursor-pointer text-xs font-semibold select-none transition-all ${
                role === 'CUSTOMER'
                  ? 'border-organic-500 bg-organic-50 text-organic-700 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-650'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="CUSTOMER"
                  checked={role === 'CUSTOMER'}
                  onChange={() => setRole('CUSTOMER')}
                  className="sr-only"
                />
                <span>Customer</span>
              </label>

              <label className={`flex items-center justify-center gap-2 border p-3 rounded-xl cursor-pointer text-xs font-semibold select-none transition-all ${
                role === 'VENDOR'
                  ? 'border-earth-500 bg-earth-50 text-earth-700 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-650'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="VENDOR"
                  checked={role === 'VENDOR'}
                  onChange={() => setRole('VENDOR')}
                  className="sr-only"
                />
                <span>Farmer/Vendor</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-sm mt-6"
          >
            {loading ? 'Creating Account...' : 'Register Account'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="border-t border-slate-100 pt-6 text-center text-xs text-slate-500 font-medium">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-organic-600 hover:text-organic-700 font-bold">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
