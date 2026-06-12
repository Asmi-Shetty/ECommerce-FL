'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-gradient-to-br from-cream-200 via-cream-50 to-organic-50/40">
      <div className="max-w-md w-full space-y-8 glassmorphism p-8 sm:p-10 rounded-3xl shadow-xl border border-organic-100 text-center">
        {!submitted ? (
          <>
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-slate-900 font-serif">Reset Password</h2>
              <p className="text-xs text-slate-500 font-sans">
                Enter your email address and we'll send you link instructions to reset.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-left">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-605">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-organic-400 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-organic-500 hover:bg-organic-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 text-sm"
              >
                Send Instructions
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="space-y-5 py-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-organic-100 text-organic-700 mx-auto">
              <Send className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-serif text-slate-900">Link Sent!</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                If the email <span className="font-bold text-slate-800">{email}</span> matches an active account, 
                you will receive a link to reset your credentials shortly.
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-slate-100 pt-6">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 text-xs text-organic-600 hover:text-organic-700 font-bold"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
