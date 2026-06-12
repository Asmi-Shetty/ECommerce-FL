'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { updateQuantity, removeFromCart, applyCoupon, removeCoupon } from '@/store/slices/cartSlice';
import { Trash2, Plus, Minus, ArrowRight, Tag, X, ShoppingBag, ShieldAlert, BadgePercent } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();

  const { items, subtotal, discountAmount, deliveryCharge, total, coupon } = useSelector(
    (state: RootState) => state.cart
  );
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    if (!couponCode.trim()) return;

    if (!isAuthenticated) {
      setCouponError('Please log in to apply discount coupons');
      return;
    }

    setCouponLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/orders/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: couponCode, orderValue: subtotal }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid coupon');
      }

      dispatch(
        applyCoupon({
          code: data.coupon.code,
          discount: data.coupon.discount,
          isPercentage: data.coupon.isPercentage,
          minOrderVal: data.coupon.minOrderVal,
        })
      );
      setCouponSuccess(`Coupon "${data.coupon.code}" applied successfully!`);
      setCouponCode('');
    } catch (err: any) {
      setCouponError(err.message || 'Could not validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleQtyChange = (productId: string, currentQty: number, offset: number) => {
    dispatch(updateQuantity({ productId, quantity: Math.max(0, currentQty + offset) }));
  };

  const handleRemove = (productId: string) => {
    dispatch(removeFromCart(productId));
  };

  const handleCheckoutRedirect = () => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center space-y-6 font-sans">
        <div className="bg-organic-50 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto text-organic-500 animate-bounce">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 font-serif">Your Delivery Basket is Empty</h2>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Explore our vegetable catalog to fill your basket with organic produce.
          </p>
        </div>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-organic-500 hover:bg-organic-600 text-white font-bold px-8 py-3.5 rounded-2xl shadow-md hover:-translate-y-0.5 transition-all text-sm"
        >
          Browse Fresh Vegetables <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-left">
      <h1 className="text-3xl font-extrabold text-slate-905 font-serif mb-10">Your Organic Basket</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-8 space-y-4">
          {items.map((item) => {
            const activePrice = item.discountPrice !== null ? item.discountPrice : item.price;
            return (
              <div
                key={item.productId}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center gap-6 justify-between border-4 border-white"
              >
                {/* Product details info */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-20 bg-slate-150 rounded-2xl overflow-hidden shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="font-serif font-bold text-base text-slate-800 line-clamp-1">{item.name}</h3>
                    <p className="text-xs text-slate-400">
                      ₹{activePrice} / {item.unit}
                    </p>
                  </div>
                </div>

                {/* Actions: Qty and Remove */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-0 pt-4 sm:pt-0">
                  <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200/40">
                    <button
                      onClick={() => handleQtyChange(item.productId, item.quantity, -0.5)}
                      className="p-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/40 text-slate-650"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-bold text-xs text-slate-750 min-w-14 text-center">
                      {item.quantity} {item.unit}
                    </span>
                    <button
                      onClick={() => handleQtyChange(item.productId, item.quantity, 0.5)}
                      className="p-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/40 text-slate-650"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="font-serif font-bold text-sm text-slate-800 block">
                      ₹{activePrice * item.quantity}
                    </span>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 mt-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Invoice Summary */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 border-4 border-white">
            <h3 className="font-serif font-bold text-lg text-slate-900 border-b border-slate-100 pb-4">
              Invoice Summary
            </h3>

            {/* Calculations items */}
            <div className="space-y-3.5 text-xs font-bold text-slate-500">
              <div className="flex justify-between">
                <span>Basket Subtotal</span>
                <span className="text-slate-800">₹{subtotal}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-organic-600">
                  <span>Coupon Discount ({coupon?.code})</span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Doorstep Delivery Charge</span>
                <span className="text-slate-800">
                  {deliveryCharge === 0 ? <span className="text-organic-600">FREE</span> : `₹${deliveryCharge}`}
                </span>
              </div>

              {subtotal <= 300 && (
                <p className="text-[10px] text-earth-500 font-semibold leading-relaxed text-left bg-earth-50/50 p-2.5 rounded-xl border border-earth-100">
                  Add ₹{300 - subtotal} more to qualify for FREE delivery slot!
                </p>
              )}

              <div className="h-px bg-slate-100 my-4"></div>

              <div className="flex justify-between text-sm text-slate-900">
                <span className="font-serif">Estimated Total</span>
                <span className="text-lg font-black text-organic-700">₹{total}</span>
              </div>
            </div>

            {/* Apply Coupon Code */}
            {!coupon ? (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-grow px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-organic-500 uppercase font-bold"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1 text-left">
                    <ShieldAlert className="h-3 w-3 shrink-0" /> {couponError}
                  </p>
                )}
              </form>
            ) : (
              <div className="bg-organic-50 border border-organic-100 rounded-xl p-3 flex items-center justify-between text-xs text-organic-700 font-bold">
                <div className="flex items-center gap-1.5">
                  <BadgePercent className="h-4.5 w-4.5 text-organic-600" />
                  <span>Coupon "{coupon.code}" Active</span>
                </div>
                <button
                  onClick={() => dispatch(removeCoupon())}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            {couponSuccess && (
              <p className="text-[10px] text-organic-600 font-semibold text-left">
                {couponSuccess}
              </p>
            )}

            <button
              onClick={handleCheckoutRedirect}
              className="w-full bg-organic-500 hover:bg-organic-600 text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 text-sm"
            >
              Proceed to Checkout <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Quick tips */}
          <div className="bg-cream-200/40 p-5 rounded-2xl border border-organic-100/30 text-xs text-slate-500 leading-relaxed text-left">
            <h4 className="font-serif font-bold text-slate-800 mb-1">Coupon Hints:</h4>
            <p className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
              <Tag className="h-3.5 w-3.5 text-organic-500" /> Use <span className="font-bold text-slate-800">NASHIKGREEN</span> for flat ₹50 discount (Min basket: ₹299)
            </p>
            <p className="flex items-center gap-1 text-[11px] text-slate-600 font-medium mt-1">
              <Tag className="h-3.5 w-3.5 text-organic-500" /> Use <span className="font-bold text-slate-800">ORGANIC10</span> for 10% discount (Min basket: ₹199)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
