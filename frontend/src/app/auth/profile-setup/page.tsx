'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { updateProfile } from '@/store/slices/authSlice';
import { MapPin, User, Mail, ShieldAlert, Sparkles, Check } from 'lucide-react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !addressLine1 || !pincode) {
      setError('Name, Address Line 1, and Pincode are required');
      return;
    }

    if (pincode.length < 6) {
      setError('Please enter a valid 6-digit Pincode');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/profile-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email: email || undefined,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          landmark: landmark || undefined,
          pincode
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Profile setup failed');
      }

      // Update Redux state with profile changes
      dispatch(updateProfile({ name: data.user.name, email: data.user.email }));
      
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-cream-200 via-cream-50 to-organic-50/40">
      <div className="max-w-xl w-full space-y-8 glassmorphism p-8 sm:p-10 rounded-3xl shadow-xl border border-organic-100">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1 bg-organic-50 text-organic-700 px-3 py-1 rounded-full text-[10px] font-bold border border-organic-200">
            <Sparkles className="h-3 w-3" />
            <span>Step 2 of 2: Details</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-serif">Setup Delivery Profile</h2>
          <p className="text-xs text-slate-500 font-sans">
            Configure your delivery coordinates for fresh morning dispatches in Nashik
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 flex items-start gap-2 text-xs font-semibold animate-fade-in text-left">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-605">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-605">Email Address</label>
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
          </div>

          <div className="h-px bg-slate-100 my-4"></div>

          <h3 className="font-serif font-bold text-base text-slate-800 flex items-center gap-1.5 -mb-2">
            <MapPin className="h-4 w-4 text-organic-550" /> Sourcing Delivery Address
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-605">Address Line 1</label>
            <input
              type="text"
              placeholder="Flat/House No, Building Name, Street"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-605">Address Line 2 (Optional)</label>
              <input
                type="text"
                placeholder="Locality, Area"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-605">Landmark (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Near Big Bazaar"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650">City</label>
              <input
                type="text"
                value="Nashik"
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650">State</label>
              <input
                type="text"
                value="Maharashtra"
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-605">Pincode</label>
              <input
                type="text"
                maxLength={6}
                placeholder="422005"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1 text-sm mt-8"
          >
            {loading ? 'Finalizing Setup...' : 'Complete Profile Setup'}
            <Check className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
