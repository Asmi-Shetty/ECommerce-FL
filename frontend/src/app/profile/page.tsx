'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { User, Mail, Phone, MapPin, Settings, CheckCircle2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [weeklyNewsletter, setWeeklyNewsletter] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // Load mock address or fetch user addresses
    setAddresses([
      {
        id: 'addr-1',
        addressLine1: 'Flat 304, Green Heights',
        addressLine2: 'Gangapur Road, Near KBT College',
        landmark: 'Opposite Shell Fuel Station',
        city: 'Nashik',
        state: 'Maharashtra',
        pincode: '422005',
        isDefault: true
      }
    ]);
  }, [isAuthenticated, router]);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Preferences saved successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-left">
      <h1 className="text-3xl font-extrabold text-slate-905 font-serif mb-10">My Profile</h1>

      {successMsg && (
        <div className="bg-organic-50 border border-organic-200 text-organic-700 text-xs font-bold rounded-2xl p-4 mb-6 flex items-center gap-2">
          <CheckCircle2 className="h-4.5 w-4.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Info */}
        <div className="lg:col-span-8 space-y-6">
          {/* Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white space-y-6">
            <h3 className="font-serif font-bold text-lg text-slate-905 flex items-center gap-2 border-b border-slate-100 pb-3.5">
              <User className="h-5 w-5 text-organic-550" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block font-bold uppercase tracking-wider">Full Name</span>
                <span className="text-sm font-semibold text-slate-800">{user?.name || 'N/A'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block font-bold uppercase tracking-wider">Mobile Number</span>
                <span className="text-sm font-semibold text-slate-800">+91 {user?.phone || 'N/A'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block font-bold uppercase tracking-wider">Email Address</span>
                <span className="text-sm font-semibold text-slate-800">{user?.email || 'Not Configured'}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block font-bold uppercase tracking-wider">Account Privilege</span>
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-organic-100 text-organic-750 mt-1">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
              <h3 className="font-serif font-bold text-lg text-slate-905 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-organic-550" /> Saved Delivery Addresses
              </h3>
              <button
                onClick={() => alert('Address adding flow is locked in MVP.')}
                className="text-xs font-bold text-organic-600 hover:text-organic-700 hover:underline"
              >
                + Add New Address
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="border border-slate-200/60 p-5 rounded-2xl bg-slate-50 relative text-xs text-slate-650 leading-relaxed text-left">
                  {addr.isDefault && (
                    <span className="absolute top-4 right-4 bg-organic-500 text-white font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      Default
                    </span>
                  )}
                  <span className="font-bold text-slate-800 block mb-1 text-sm">{user?.name}</span>
                  <p>
                    {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                    {addr.landmark && `Near ${addr.landmark}, `} {addr.city}, {addr.state}
                  </p>
                  <span className="font-bold text-organic-700 mt-2 block">Pincode: {addr.pincode}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Preferences */}
        <div className="lg:col-span-4">
          <form onSubmit={handleSavePreferences} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white space-y-6">
            <h3 className="font-serif font-bold text-lg text-slate-905 flex items-center gap-2 border-b border-slate-100 pb-4">
              <Settings className="h-5 w-5 text-organic-550" /> Preferences
            </h3>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={whatsappUpdates}
                  onChange={(e) => setWhatsappUpdates(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-slate-300 text-organic-600 focus:ring-organic-500 accent-organic-500"
                />
                <div className="text-left">
                  <span className="font-bold text-slate-800 block">WhatsApp Delivery Updates</span>
                  <span className="text-[10px] text-slate-400">Receive tracking updates, invoice links, and order summaries directly on WhatsApp.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={weeklyNewsletter}
                  onChange={(e) => setWeeklyNewsletter(e.target.checked)}
                  className="mt-0.5 h-4.5 w-4.5 rounded border-slate-300 text-organic-600 focus:ring-organic-500 accent-organic-500"
                />
                <div className="text-left">
                  <span className="font-bold text-slate-800 block">Weekly Farmer newsletter</span>
                  <span className="text-[10px] text-slate-400">Receive articles on agricultural updates, organic bio-farming methods, and special coupon codes.</span>
                </div>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow hover:shadow-md"
            >
              Save Preferences
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
