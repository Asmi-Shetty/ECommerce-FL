'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  CalendarDays, Repeat, PackageCheck, Plus, Minus, Pause, Play, X,
  CheckCircle2, Sprout, Sparkles, ShoppingBasket, AlertCircle,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  unit: string;
  images: Array<{ url: string }>;
  category: { name: string };
}

interface BasketItem { product: Product; quantity: number }

interface Subscription {
  id: string;
  planName: string;
  frequency: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isPaused: boolean;
  items: Array<{ id: string; quantity: number; product: Product }>;
}

const PLANS = [
  { id: 'DAILY', label: 'Daily', icon: <Repeat className="h-5 w-5" />, price: '₹0 setup', tag: 'Fresh every morning', desc: 'Order delivered every day. Best for large families.' },
  { id: 'WEEKLY', label: 'Weekly', icon: <CalendarDays className="h-5 w-5" />, price: '5% off', tag: 'Most Popular', desc: 'Weekly basket delivery. Ideal for couples and small families.' },
  { id: 'MONTHLY', label: 'Monthly', icon: <PackageCheck className="h-5 w-5" />, price: '12% off', tag: 'Best Value', desc: 'Monthly bulk order. Great discount for regular buyers.' },
];

const STATIC_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Organic Palak (Spinach)', price: 45, discountPrice: 35, unit: 'bunch', images: [{ url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300' }], category: { name: 'Leafy Greens' } },
  { id: 'p2', name: 'Orange Carrots', price: 60, discountPrice: 48, unit: 'kg', images: [{ url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=300' }], category: { name: 'Root Vegetables' } },
  { id: 'p3', name: 'Broccoli Premium', price: 180, discountPrice: 140, unit: 'kg', images: [{ url: 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?q=80&w=300' }], category: { name: 'Exotic Vegetables' } },
  { id: 'p4', name: 'Nashik Desi Tomatoes', price: 40, discountPrice: 28, unit: 'kg', images: [{ url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?q=80&w=300' }], category: { name: 'Daily Essentials' } },
  { id: 'p5', name: 'Yellow Bell Pepper', price: 220, discountPrice: 190, unit: 'kg', images: [{ url: 'https://images.unsplash.com/photo-1566393028639-d108a42c46a7?q=80&w=300' }], category: { name: 'Exotic Vegetables' } },
  { id: 'p6', name: 'Fresh Methi Leaves', price: 30, discountPrice: null, unit: 'bunch', images: [{ url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=300' }], category: { name: 'Leafy Greens' } },
];

export default function SubscriptionsPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  const [tab, setTab] = useState<'new' | 'mine'>('new');
  const [selectedFreq, setSelectedFreq] = useState('WEEKLY');
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login?redirect=subscriptions'); return; }
    // Load products from API
    fetch('http://localhost:5000/api/products')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && data.length > 0) setProducts(data); })
      .catch(() => {});
    // Load subscriptions
    loadSubscriptions();
  }, [isAuthenticated, router, token]);

  const loadSubscriptions = async () => {
    setLoadingSubs(true);
    try {
      const res = await fetch('http://localhost:5000/api/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setSubscriptions(data);
    } catch {}
    setLoadingSubs(false);
  };

  const handleQtyChange = (product: Product, delta: number) => {
    setBasket(prev => {
      const existing = prev.find(b => b.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) return prev.filter(b => b.product.id !== product.id);
        return prev.map(b => b.product.id === product.id ? { ...b, quantity: newQty } : b);
      }
      if (delta > 0) return [...prev, { product, quantity: delta }];
      return prev;
    });
  };

  const getQty = (productId: string) => basket.find(b => b.product.id === productId)?.quantity || 0;

  const basketTotal = basket.reduce((sum, b) => {
    const price = b.product.discountPrice ?? b.product.price;
    return sum + price * b.quantity;
  }, 0);

  const handleCreateSubscription = async () => {
    if (basket.length === 0) { setError('Add at least one product to your basket.'); return; }
    setError(null);
    setCreating(true);
    const planName = `${selectedFreq.charAt(0) + selectedFreq.slice(1).toLowerCase()} Organic Basket`;
    try {
      const res = await fetch('http://localhost:5000/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          planName,
          frequency: selectedFreq,
          items: basket.map(b => ({ productId: b.product.id, quantity: b.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create subscription');
      setCreateSuccess(true);
      setBasket([]);
      await loadSubscriptions();
      setTimeout(() => { setCreateSuccess(false); setTab('mine'); }, 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handlePauseResume = async (sub: Subscription) => {
    setActionLoading(sub.id);
    const action = sub.isPaused ? 'resume' : 'pause';
    try {
      const res = await fetch(`http://localhost:5000/api/subscriptions/${sub.id}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await loadSubscriptions();
    } catch {}
    setActionLoading(null);
  };

  const handleCancel = async (subId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;
    setActionLoading(subId);
    try {
      const res = await fetch(`http://localhost:5000/api/subscriptions/${subId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await loadSubscriptions();
    } catch {}
    setActionLoading(null);
  };

  const freqLabel = (f: string) => ({ DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly' })[f] || f;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">


      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[{ id: 'new' as const, label: 'Create Subscription' }, { id: 'mine' as const, label: `My Subscriptions${subscriptions.length > 0 ? ` (${subscriptions.length})` : ''}` }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === t.id ? 'bg-organic-500 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:bg-organic-50 hover:text-organic-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== CREATE SUBSCRIPTION ===== */}
      {tab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Step 1: Plan Frequency */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="font-serif font-bold text-lg text-slate-900">Step 1 — Choose Delivery Frequency</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PLANS.map(plan => (
                  <button key={plan.id} onClick={() => setSelectedFreq(plan.id)}
                    className={`p-5 rounded-2xl border text-left transition-all space-y-2 ${selectedFreq === plan.id ? 'border-organic-500 bg-organic-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedFreq === plan.id ? 'bg-organic-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {plan.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-slate-900">{plan.label}</span>
                        {plan.tag && <span className="text-[9px] bg-organic-100 text-organic-700 font-bold px-1.5 py-0.5 rounded-full uppercase">{plan.tag}</span>}
                      </div>
                      <p className="text-[10px] text-organic-600 font-bold">{plan.price}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{plan.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Custom Basket */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h2 className="font-serif font-bold text-lg text-slate-900">Step 2 — Build Your Custom Basket</h2>
              <p className="text-xs text-slate-500">Select the vegetables and quantities for each delivery.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.slice(0, 6).map(prod => {
                  const qty = getQty(prod.id);
                  const price = prod.discountPrice ?? prod.price;
                  return (
                    <div key={prod.id} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${qty > 0 ? 'border-organic-300 bg-organic-50/40' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                        <img src={prod.images[0]?.url} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{prod.name}</p>
                        <p className="text-[10px] text-organic-600 font-bold">₹{price}/{prod.unit}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleQtyChange(prod, -1)} disabled={qty === 0}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center transition-all">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">{qty}</span>
                        <button onClick={() => handleQtyChange(prod, 1)}
                          className="w-7 h-7 rounded-lg bg-organic-500 hover:bg-organic-600 text-white flex items-center justify-center transition-all">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Basket Summary */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5 sticky top-24">
              <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                <ShoppingBasket className="h-5 w-5 text-organic-550" /> Your Basket
              </h3>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {freqLabel(selectedFreq)} · {basket.length} items
              </div>
              {basket.length === 0 ? (
                <div className="text-center text-xs text-slate-400 italic py-6">Add vegetables above to build your basket.</div>
              ) : (
                <div className="space-y-2.5 max-h-52 overflow-y-auto">
                  {basket.map(b => {
                    const price = b.product.discountPrice ?? b.product.price;
                    return (
                      <div key={b.product.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-semibold line-clamp-1 flex-grow">{b.product.name}</span>
                        <span className="text-slate-500 shrink-0 ml-2">{b.quantity}×₹{price}</span>
                        <span className="font-bold text-slate-800 ml-3 shrink-0">₹{price * b.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {basket.length > 0 && (
                <>
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-between text-sm font-bold text-slate-900">
                    <span>Per delivery</span>
                    <span className="text-organic-700">₹{basketTotal}</span>
                  </div>
                </>
              )}

              {error && <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>}
              {createSuccess && (
                <div className="flex items-center gap-2 bg-organic-50 border border-organic-200 rounded-xl p-3 text-xs font-bold text-organic-700">
                  <CheckCircle2 className="h-4 w-4 text-organic-500" /> Subscription created!
                </div>
              )}

              <button onClick={handleCreateSubscription} disabled={creating || basket.length === 0}
                className="w-full bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-4 rounded-2xl text-sm transition-all shadow-md">
                {creating ? 'Creating...' : `Subscribe · ${freqLabel(selectedFreq)}`}
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                You can pause or cancel anytime from "My Subscriptions".
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ===== MY SUBSCRIPTIONS ===== */}
      {tab === 'mine' && (
        <div className="space-y-6">
          {loadingSubs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => <div key={i} className="bg-white rounded-3xl h-40 animate-pulse border border-slate-100" />)}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm text-center space-y-4">
              <ShoppingBasket className="h-12 w-12 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-slate-800">No Subscriptions Yet</h3>
                <p className="text-xs text-slate-500">Build your first custom basket and automate your organic deliveries.</p>
              </div>
              <button onClick={() => setTab('new')} className="bg-organic-500 hover:bg-organic-600 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all">
                Create Your First Subscription
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subscriptions.map(sub => (
                <div key={sub.id} className={`bg-white rounded-3xl border shadow-sm p-6 space-y-5 ${!sub.isActive ? 'border-slate-200 opacity-70' : sub.isPaused ? 'border-amber-200' : 'border-organic-200'}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-slate-900">{sub.planName}</h3>
                      <div className="flex gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${!sub.isActive ? 'bg-red-100 text-red-600' : sub.isPaused ? 'bg-amber-100 text-amber-700' : 'bg-organic-100 text-organic-700'}`}>
                          {!sub.isActive ? 'Cancelled' : sub.isPaused ? 'Paused' : 'Active'}
                        </span>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-500">
                          {freqLabel(sub.frequency)}
                        </span>
                      </div>
                    </div>
                    {sub.isActive && (
                      <div className="flex gap-2">
                        <button onClick={() => handlePauseResume(sub)} disabled={actionLoading === sub.id}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all ${sub.isPaused ? 'border-organic-300 bg-organic-50 text-organic-700 hover:bg-organic-100' : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                          title={sub.isPaused ? 'Resume' : 'Pause'}>
                          {sub.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </button>
                        <button onClick={() => handleCancel(sub.id)} disabled={actionLoading === sub.id}
                          className="p-2 rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 transition-all" title="Cancel">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 text-[10px]">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-400 font-bold uppercase tracking-wider">Start Date</p>
                      <p className="font-bold text-slate-700 mt-0.5">{new Date(sub.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-slate-400 font-bold uppercase tracking-wider">End Date</p>
                      <p className="font-bold text-slate-700 mt-0.5">{new Date(sub.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Basket Items */}
                  {sub.items.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basket Items</p>
                      <div className="space-y-2">
                        {sub.items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-xs">
                            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-100">
                              <img src={item.product.images?.[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999'} alt={item.product.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-slate-700 font-semibold flex-grow line-clamp-1">{item.product.name}</span>
                            <span className="text-slate-400 shrink-0">{item.quantity} {item.product.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
