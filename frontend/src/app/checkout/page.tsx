'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { clearCart } from '@/store/slices/cartSlice';
import { CreditCard, Landmark, Truck, MapPin, CheckCircle, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { items, subtotal, discountAmount, deliveryCharge, total, coupon } = useSelector(
    (state: RootState) => state.cart
  );
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  // Addresses loading state
  const [address, setAddress] = useState<any>(null);
  const [deliverySlot, setDeliverySlot] = useState('Morning (08:00 AM - 11:00 AM)');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=checkout');
      return;
    }

    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    // Load default address from profile api
    const loadUserAddress = async () => {
      try {
        // Mock loading default address from jwt user or fallback to profile creation state
        const addressRes = await fetch('http://localhost:5000/api/auth/profile-setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ name: user?.name, addressLine1: 'Gangapur Road, Nashik', pincode: '422005' })
        });
        const addressData = await addressRes.json();
        if (addressRes.ok) {
          setAddress(addressData.address);
        } else {
          // Fallback static address
          setAddress({
            id: 'addr-static-1',
            addressLine1: 'Flat 304, Green Heights',
            addressLine2: 'Gangapur Road, Near KBT College',
            landmark: 'Opposite Shell Fuel Station',
            city: 'Nashik',
            state: 'Maharashtra',
            pincode: '422005'
          });
        }
      } catch (err) {
        // Offline default
        setAddress({
          id: 'addr-static-1',
          addressLine1: 'Flat 304, Green Heights',
          addressLine2: 'Gangapur Road, Near KBT College',
          landmark: 'Opposite Shell Fuel Station',
          city: 'Nashik',
          state: 'Maharashtra',
          pincode: '422005'
        });
      }
    };

    loadUserAddress();
  }, [isAuthenticated, items, router, token, user]);

  const handlePlaceOrder = async () => {
    setError(null);
    if (!address) {
      setError('A valid delivery address is required');
      return;
    }

    if (paymentMethod === 'RAZORPAY') {
      setShowPaymentModal(true);
      return;
    }

    // Proceed to COD order creation directly
    await executeOrderCreation('COD');
  };

  const executeOrderCreation = async (method: 'COD' | 'RAZORPAY') => {
    setLoading(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const cartItemsData = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          addressId: address.id,
          couponCode: coupon?.code || undefined,
          cartItems: cartItemsData,
          deliverySlot,
          deliveryDate: tomorrow.toISOString().split('T')[0],
          paymentMethod: method
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

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

  const slots = [
    'Morning (08:00 AM - 11:00 AM)',
    'Noon (12:00 PM - 03:00 PM)',
    'Evening (04:00 PM - 07:00 PM)'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-left">
      <h1 className="text-3xl font-extrabold text-slate-905 font-serif mb-10">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-650 text-xs font-bold rounded-2xl p-4 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Configuration modules */}
        <div className="lg:col-span-8 space-y-6">
          {/* Sourcing SAddress card */}
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
              <div className="py-4 text-xs font-semibold text-slate-450 italic">
                Loading address details...
              </div>
            )}
          </div>

          {/* Timeslots */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-1.5">
              <Truck className="h-5 w-5 text-organic-550" /> Sourcing Delivery Slot
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setDeliverySlot(slot)}
                  className={`flex flex-col items-center justify-center border p-4 rounded-2xl text-xs font-bold select-none transition-all ${
                    deliverySlot === slot
                      ? 'border-organic-500 bg-organic-50 text-organic-700 shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <CheckCircle className={`h-4.5 w-4.5 mb-2 ${deliverySlot === slot ? 'text-organic-600' : 'text-slate-300'}`} />
                  <span>{slot.split(' ')[0]}</span>
                  <span className="text-[10px] text-slate-450 font-normal mt-0.5">{slot.substring(slot.indexOf('('))}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-1.5">
              <CreditCard className="h-5 w-5 text-organic-550" /> Select Payment Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <label
                className={`flex items-start gap-4 border p-5 rounded-2xl cursor-pointer select-none transition-all ${
                  paymentMethod === 'COD'
                    ? 'border-organic-500 bg-organic-50 text-organic-750'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="sr-only"
                />
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-700">
                  <Truck className="h-5 w-5" />
                </div>
                <div className="text-xs text-left">
                  <span className="font-bold text-slate-800 block mb-0.5">Cash on Delivery (COD)</span>
                  <p className="text-slate-450 text-[11px] leading-relaxed">
                    Pay at your doorstep using cash, UPI, or card when the delivery partner arrives.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 border p-5 rounded-2xl cursor-pointer select-none transition-all ${
                  paymentMethod === 'RAZORPAY'
                    ? 'border-organic-500 bg-organic-50 text-organic-750'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')}
                  className="sr-only"
                />
                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="text-xs text-left">
                  <span className="font-bold text-slate-800 block mb-0.5">Razorpay Online Gateways</span>
                  <p className="text-slate-450 text-[11px] leading-relaxed">
                    Secure checkout with support for all UPI, net banking options, credit/debit cards.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order totals */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white space-y-6">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-4">
              Order Summary
            </h3>

            {/* Calculations items */}
            <div className="space-y-3.5 text-xs font-bold text-slate-500">
              <div className="flex justify-between">
                <span>Basket Subtotal</span>
                <span className="text-slate-800">₹{subtotal}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-organic-600">
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Doorstep Delivery Charge</span>
                <span className="text-slate-800">
                  {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                </span>
              </div>

              <div className="h-px bg-slate-100 my-4"></div>

              <div className="flex justify-between text-sm text-slate-900">
                <span className="font-serif">Estimated Total</span>
                <span className="text-lg font-black text-organic-700">₹{total}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 text-sm"
            >
              {loading ? 'Processing...' : 'Place Secure Order'} <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Razorpay Mock Payment Simulator Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-6">
            <div className="flex items-center justify-center gap-1.5 text-organic-700 font-serif font-bold text-lg border-b border-slate-100 pb-4">
              <CreditCard className="h-5 w-5" />
              <span>Razorpay Mock Payment</span>
            </div>
            
            <p className="text-xs text-slate-500 leading-normal">
              You are simulating a secure online payment for <span className="font-bold text-slate-800">₹{total}</span>. 
              Fill in mock card details and click authorize.
            </p>

            <div className="space-y-3 text-left">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Card Number</label>
                <input
                  type="text"
                  placeholder="4111 2222 3333 4444"
                  maxLength={19}
                  disabled={paymentLoading}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</label>
                  <input
                    type="text"
                    placeholder="12/28"
                    maxLength={5}
                    disabled={paymentLoading}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">CVV</label>
                  <input
                    type="password"
                    placeholder="•••"
                    maxLength={3}
                    disabled={paymentLoading}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 justify-center text-[10px] text-organic-600 font-bold bg-organic-50 p-2 rounded-xl">
              <ShieldCheck className="h-4.5 w-4.5 text-organic-550" /> Fully Secured 256-Bit SSL Encryption
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentLoading}
                className="py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMockPaymentSubmit}
                disabled={paymentLoading}
                className="bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold py-2.5 rounded-xl text-xs shadow"
              >
                {paymentLoading ? 'Authorizing...' : 'Pay & Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
