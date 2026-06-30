'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { clearCart, applyCoupon, removeCoupon } from '@/store/slices/cartSlice';
import {
  CreditCard, Truck, MapPin, CheckCircle, ArrowRight, ShieldCheck,
  Tag, BadgePercent, X, ShieldAlert, Smartphone, Building2, Wallet, Banknote,
} from 'lucide-react';

type OnlineTab = 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET';

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Yes Bank', 'Punjab National Bank'];
const WALLETS = [
  { id: 'phonepe', label: 'PhonePe', color: 'bg-purple-600' },
  { id: 'gpay', label: 'Google Pay', color: 'bg-blue-500' },
  { id: 'paytm', label: 'Paytm', color: 'bg-sky-500' },
  { id: 'amazonpay', label: 'Amazon Pay', color: 'bg-orange-500' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { items, subtotal, discountAmount, deliveryCharge, total, coupon } = useSelector(
    (state: RootState) => state.cart
  );
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  const [address, setAddress] = useState<any>(null);
  const [deliverySlot, setDeliverySlot] = useState('Morning (08:00 AM - 11:00 AM)');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<OnlineTab>('UPI');

  // UPI state
  const [upiId, setUpiId] = useState('');
  // Card state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  // Net Banking state
  const [selectedBank, setSelectedBank] = useState('');
  // Wallet state
  const [selectedWallet, setSelectedWallet] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=checkout');
      return;
    }
    if (items.length === 0) {
      router.push('/cart');
      return;
    }
    const loadUserAddress = async () => {
      try {
        const addressRes = await fetch('http://localhost:5000/api/auth/profile-setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: user?.name, addressLine1: 'Gangapur Road, Nashik', pincode: '422005' })
        });
        const addressData = await addressRes.json();
        if (addressRes.ok) {
          setAddress(addressData.address);
        } else {
          setAddress({ id: 'addr-static-1', addressLine1: 'Flat 304, Green Heights', addressLine2: 'Gangapur Road, Near KBT College', landmark: 'Opposite Shell Fuel Station', city: 'Nashik', state: 'Maharashtra', pincode: '422005' });
        }
      } catch {
        setAddress({ id: 'addr-static-1', addressLine1: 'Flat 304, Green Heights', addressLine2: 'Gangapur Road, Near KBT College', landmark: 'Opposite Shell Fuel Station', city: 'Nashik', state: 'Maharashtra', pincode: '422005' });
      }
    };
    loadUserAddress();
  }, [isAuthenticated, items, router, token, user]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null); setCouponSuccess(null);
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/orders/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: couponCode, orderValue: subtotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid coupon');
      dispatch(applyCoupon({ code: data.coupon.code, discount: data.coupon.discount, isPercentage: data.coupon.isPercentage, minOrderVal: data.coupon.minOrderVal }));
      setCouponSuccess(`Coupon "${data.coupon.code}" applied!`);
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Could not validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setError(null);
    if (!address) { setError('A valid delivery address is required'); return; }
    if (paymentMethod === 'ONLINE') { setShowPaymentModal(true); return; }
    await executeOrderCreation('COD');
  };

  const executeOrderCreation = async (method: string) => {
    setLoading(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const cartItemsData = items.map(item => ({ productId: item.productId, quantity: item.quantity }));
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addressId: address.id, couponCode: coupon?.code || undefined, cartItems: cartItemsData, deliverySlot, deliveryDate: tomorrow.toISOString().split('T')[0], paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');
      dispatch(clearCart());
      router.push(`/orders?id=${data.order.id}&status=success`);
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating order');
    } finally {
      setLoading(false);
    }
  };

  const handleMockPaymentSubmit = () => {
    setPaymentLoading(true);
    setTimeout(async () => {
      setPaymentLoading(false);
      setShowPaymentModal(false);
      await executeOrderCreation('RAZORPAY');
    }, 2000);
  };

  const slots = ['Morning (08:00 AM - 11:00 AM)', 'Noon (12:00 PM - 03:00 PM)', 'Evening (04:00 PM - 07:00 PM)'];

  const tabs: { id: OnlineTab; label: string; icon: React.ReactNode }[] = [
    { id: 'UPI', label: 'UPI', icon: <Smartphone className="h-4 w-4" /> },
    { id: 'CARD', label: 'Card', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'NETBANKING', label: 'Net Banking', icon: <Building2 className="h-4 w-4" /> },
    { id: 'WALLET', label: 'Wallet', icon: <Wallet className="h-4 w-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-left">
      <h1 className="text-3xl font-extrabold text-slate-905 font-serif mb-10">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-650 text-xs font-bold rounded-2xl p-4 mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Configuration modules */}
        <div className="lg:col-span-8 space-y-6">
          {/* Delivery Address */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <MapPin className="h-5 w-5 text-organic-550" /> Delivery Address
            </h3>
            {address ? (
              <div className="pt-4 text-xs space-y-1.5">
                <span className="font-bold text-slate-800 text-sm block">{user?.name}</span>
                <p className="text-slate-600 font-medium">
                  {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                  {address.landmark && `Near ${address.landmark}, `} {address.city}, {address.state}
                </p>
                <span className="font-bold text-organic-700 block">Pincode: {address.pincode}</span>
              </div>
            ) : (
              <div className="py-4 text-xs font-semibold text-slate-450 italic">Loading address details...</div>
            )}
          </div>

          {/* Delivery Slot */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-1.5">
              <Truck className="h-5 w-5 text-organic-550" /> Delivery Slot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              {slots.map((slot) => (
                <button key={slot} onClick={() => setDeliverySlot(slot)}
                  className={`flex flex-col items-center justify-center border p-4 rounded-2xl text-xs font-bold select-none transition-all ${deliverySlot === slot ? 'border-organic-500 bg-organic-50 text-organic-700 shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                >
                  <CheckCircle className={`h-4.5 w-4.5 mb-2 ${deliverySlot === slot ? 'text-organic-600' : 'text-slate-300'}`} />
                  <span>{slot.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-450 font-normal mt-0.5">{slot.substring(slot.indexOf('('))}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Coupon Code */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-1.5">
              <Tag className="h-5 w-5 text-organic-550" /> Promotional Coupon
            </h3>
            <div className="pt-4 space-y-3">
              {!coupon ? (
                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter Coupon Code" value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-grow px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500 uppercase font-bold"
                    />
                    <button type="submit" disabled={couponLoading}
                      className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold px-4 py-2.5 rounded-xl text-xs shrink-0">
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1"><ShieldAlert className="h-3 w-3 shrink-0" /> {couponError}</p>}
                  <p className="text-[10px] text-slate-400 font-medium">Try <span className="font-bold text-slate-600">NASHIKGREEN</span> or <span className="font-bold text-slate-600">ORGANIC10</span></p>
                </form>
              ) : (
                <div className="bg-organic-50 border border-organic-100 rounded-xl p-3 flex items-center justify-between text-xs text-organic-700 font-bold">
                  <div className="flex items-center gap-1.5"><BadgePercent className="h-4 w-4 text-organic-600" /><span>Coupon "{coupon.code}" Active</span></div>
                  <button onClick={() => { dispatch(removeCoupon()); setCouponSuccess(null); }} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                </div>
              )}
              {couponSuccess && <p className="text-[10px] text-organic-600 font-semibold">{couponSuccess}</p>}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-1.5">
              <CreditCard className="h-5 w-5 text-organic-550" /> Payment Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* COD */}
              <label className={`flex items-start gap-4 border p-5 rounded-2xl cursor-pointer select-none transition-all ${paymentMethod === 'COD' ? 'border-organic-500 bg-organic-50 text-organic-750' : 'border-slate-200 hover:bg-slate-50 text-slate-650'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} className="sr-only" />
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-700"><Banknote className="h-5 w-5" /></div>
                <div className="text-xs text-left">
                  <span className="font-bold text-slate-800 block mb-0.5">Cash on Delivery (COD)</span>
                  <p className="text-slate-450 text-[11px] leading-relaxed">Pay at doorstep with cash, UPI, or card when the delivery partner arrives.</p>
                </div>
              </label>
              {/* Online Payment */}
              <label className={`flex items-start gap-4 border p-5 rounded-2xl cursor-pointer select-none transition-all ${paymentMethod === 'ONLINE' ? 'border-organic-500 bg-organic-50 text-organic-750' : 'border-slate-200 hover:bg-slate-50 text-slate-650'}`}>
                <input type="radio" name="payment" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} className="sr-only" />
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-700"><CreditCard className="h-5 w-5" /></div>
                <div className="text-xs text-left">
                  <span className="font-bold text-slate-800 block mb-0.5">Online Payment</span>
                  <p className="text-slate-450 text-[11px] leading-relaxed">UPI, Debit / Credit Card, Net Banking, Wallet — all supported.</p>
                  <div className="flex gap-1 mt-2">
                    {['UPI', 'Card', 'Net Banking', 'Wallet'].map(m => (
                      <span key={m} className="bg-slate-100 text-slate-600 font-bold text-[9px] px-1.5 py-0.5 rounded-md">{m}</span>
                    ))}
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white space-y-6">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-4">Order Summary</h3>
            <div className="space-y-3.5 text-xs font-bold text-slate-500">
              <div className="flex justify-between"><span>Basket Subtotal</span><span className="text-slate-800">₹{subtotal}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-organic-600"><span>Coupon Discount</span><span>-₹{discountAmount}</span></div>
              )}
              <div className="flex justify-between"><span>Delivery Charge</span><span className="text-slate-800">{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span></div>
              <div className="h-px bg-slate-100 my-4" />
              <div className="flex justify-between text-sm text-slate-900">
                <span className="font-serif">Estimated Total</span>
                <span className="text-lg font-black text-organic-700">₹{total}</span>
              </div>
            </div>
            <button onClick={handlePlaceOrder} disabled={loading}
              className="w-full bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 text-sm">
              {loading ? 'Processing...' : 'Place Secure Order'} <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ===== Multi-Tab Online Payment Modal ===== */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-organic-700 to-organic-800 px-6 py-5 text-white flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-organic-200 uppercase tracking-wider">Secure Payment</p>
                <h3 className="text-lg font-bold font-serif">Pay ₹{total}</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-organic-200 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-slate-50">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-bold transition-all ${activeTab === tab.id ? 'text-organic-700 border-b-2 border-organic-500 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 space-y-4">
              {/* UPI Tab */}
              {activeTab === 'UPI' && (
                <div className="space-y-4">
                  <div className="bg-organic-50 border border-organic-100 rounded-2xl p-4 text-center space-y-2">
                    <div className="w-28 h-28 mx-auto bg-white rounded-xl border-2 border-organic-200 flex items-center justify-center">
                      <div className="grid grid-cols-4 gap-0.5 p-2 opacity-60">
                        {[...Array(16)].map((_, i) => <div key={i} className={`w-2 h-2 rounded-sm ${Math.random() > 0.5 ? 'bg-slate-800' : 'bg-white'}`} />)}
                      </div>
                    </div>
                    <p className="text-[10px] text-organic-700 font-bold">Scan QR with any UPI app</p>
                  </div>
                  <div className="text-center text-xs text-slate-400 font-semibold">— or enter UPI ID —</div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Your UPI ID</label>
                    <input type="text" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} disabled={paymentLoading}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500" />
                  </div>
                  <p className="text-[10px] text-slate-400">Supported: PhonePe, Google Pay, Paytm, BHIM, Amazon Pay</p>
                </div>
              )}

              {/* Card Tab */}
              {activeTab === 'CARD' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Card Number</label>
                    <input type="text" placeholder="4111 2222 3333 4444" maxLength={19} value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                      disabled={paymentLoading} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Name on Card</label>
                    <input type="text" placeholder="Full Name" value={cardName} onChange={(e) => setCardName(e.target.value)}
                      disabled={paymentLoading} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry</label>
                      <input type="text" placeholder="MM/YY" maxLength={5} value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)} disabled={paymentLoading}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">CVV</label>
                      <input type="password" placeholder="•••" maxLength={3} value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)} disabled={paymentLoading}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">Supports Visa, Mastercard, RuPay, American Express</p>
                </div>
              )}

              {/* Net Banking Tab */}
              {activeTab === 'NETBANKING' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Select Your Bank</label>
                    <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)} disabled={paymentLoading}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500 font-semibold text-slate-700">
                      <option value="">-- Choose Bank --</option>
                      {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  {selectedBank && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 font-medium">
                      You will be redirected to <span className="font-bold text-slate-800">{selectedBank}</span>'s secure net banking portal to complete the payment.
                    </div>
                  )}
                </div>
              )}

              {/* Wallet Tab */}
              {activeTab === 'WALLET' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Choose Wallet</label>
                  <div className="grid grid-cols-2 gap-3">
                    {WALLETS.map((w) => (
                      <button key={w.id} onClick={() => setSelectedWallet(w.id)} disabled={paymentLoading}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition-all ${selectedWallet === w.id ? 'border-organic-500 bg-organic-50 text-organic-700 shadow-sm' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                        <div className={`w-6 h-6 ${w.color} rounded-md flex items-center justify-center text-white text-[9px] font-black shrink-0`}>
                          {w.label[0]}
                        </div>
                        {w.label}
                      </button>
                    ))}
                  </div>
                  {selectedWallet && (
                    <p className="text-[10px] text-slate-400">Your {WALLETS.find(w => w.id === selectedWallet)?.label} wallet will be charged ₹{total}.</p>
                  )}
                </div>
              )}

              {/* Security badge */}
              <div className="flex items-center gap-1.5 justify-center text-[10px] text-organic-600 font-bold bg-organic-50 p-2.5 rounded-xl border border-organic-100">
                <ShieldCheck className="h-4 w-4 text-organic-550" /> 256-bit SSL Encrypted · PCI-DSS Compliant
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                <button onClick={() => setShowPaymentModal(false)} disabled={paymentLoading}
                  className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50">
                  Cancel
                </button>
                <button onClick={handleMockPaymentSubmit} disabled={paymentLoading}
                  className="bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-2.5 rounded-xl text-xs shadow">
                  {paymentLoading ? 'Authorizing...' : 'Pay & Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
