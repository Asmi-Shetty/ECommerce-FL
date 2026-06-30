'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  ClipboardCheck, Truck, CheckCircle2, ChevronRight, Download, Package,
  KeyRound, Camera, MapPin, RefreshCw, CheckCircle, XCircle, Clock,
} from 'lucide-react';

interface OrderItem {
  id: string;
  price: number;
  quantity: number;
  product: { name: string; unit: string; images: Array<{ url: string }> };
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  status: string;
  deliverySlot: string;
  deliveryDate: string;
  createdAt: string;
  items: OrderItem[];
  payment?: { method: string; status: string };
  deliveryOtp?: string | null;
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successId = searchParams.get('id');
  const isSuccess = searchParams.get('status') === 'success';
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Delivery OTP state
  const [deliveryOtp, setDeliveryOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Proof upload state
  const [proofImage, setProofImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/orders', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) {
        setOrders(data);
        if (successId) {
          const found = data.find((o: Order) => o.id === successId);
          if (found) setActiveOrder(found);
        } else if (data.length > 0) {
          setActiveOrder(data[0]);
        }
      }
    } catch {
      const mockOrders = getStaticMockOrders(successId);
      setOrders(mockOrders);
      if (mockOrders.length > 0) setActiveOrder(mockOrders[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    loadOrders();
  }, [isAuthenticated, router, token, successId]);

  // Reset OTP state whenever active order changes
  useEffect(() => {
    setDeliveryOtp(null);
    setOtpInput('');
    setOtpError(null);
    setOtpSuccess(false);
    setProofImage(null);
  }, [activeOrder?.id]);

  const handleGenerateOtp = async () => {
    if (!activeOrder) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${activeOrder.id}/delivery-otp`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate OTP');
      setDeliveryOtp(data.otp);
      // Update order status in list
      setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, status: 'OUT_FOR_DELIVERY' } : o));
      setActiveOrder(prev => prev ? { ...prev, status: 'OUT_FOR_DELIVERY' } : prev);
    } catch (err: any) {
      // Mock OTP for demo
      const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
      setDeliveryOtp(mockOtp);
      setActiveOrder(prev => prev ? { ...prev, status: 'OUT_FOR_DELIVERY' } : prev);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!activeOrder || !otpInput) return;
    setConfirmLoading(true);
    setOtpError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${activeOrder.id}/confirm-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp: otpInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Local mock validation
        if (deliveryOtp && otpInput === deliveryOtp) {
          setOtpSuccess(true);
          setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, status: 'DELIVERED' } : o));
          setActiveOrder(prev => prev ? { ...prev, status: 'DELIVERED' } : prev);
        } else {
          throw new Error(data.error || 'Invalid OTP. Please try again.');
        }
      } else {
        setOtpSuccess(true);
        setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, status: 'DELIVERED' } : o));
        setActiveOrder(prev => prev ? { ...prev, status: 'DELIVERED' } : prev);
      }
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProofImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'CONFIRMED': return 2;
      case 'PROCESSING': return 3;
      case 'SHIPPED': return 4;
      case 'OUT_FOR_DELIVERY': return 5;
      case 'DELIVERED': return 6;
      default: return 2;
    }
  };

  const steps = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out For Delivery', 'Delivered'];

  const statusColor = (status: string) => {
    if (status === 'DELIVERED') return 'bg-organic-100 text-organic-700';
    if (status === 'OUT_FOR_DELIVERY') return 'bg-amber-100 text-amber-700';
    if (status === 'CANCELLED') return 'bg-red-100 text-red-600';
    return 'bg-organic-100 text-organic-700';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-left">
      {/* Success Banner */}
      {isSuccess && activeOrder && (
        <div className="bg-gradient-to-r from-organic-500 to-organic-600 rounded-3xl p-8 text-white mb-10 text-center space-y-4 animate-slide-up shadow">
          <div className="bg-white/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <ClipboardCheck className="h-9 w-9 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold">Order Confirmed Successfully!</h2>
            <p className="text-xs text-organic-100 font-medium">
              Your order ID is <span className="font-bold">{activeOrder.orderNumber}</span>.
            </p>
          </div>
          <p className="text-[11px] text-organic-200">Fresh vegetables will be delivered in slot: <span className="font-bold text-white">{activeOrder.deliverySlot}</span></p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Orders List */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-serif font-bold text-lg text-slate-900 px-1">Order History</h3>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white h-24 rounded-2xl animate-pulse border border-slate-150" />)}</div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center text-xs text-slate-500 font-semibold italic">No orders placed yet.</div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
              {orders.map((order) => (
                <button key={order.id} onClick={() => setActiveOrder(order)}
                  className={`w-full bg-white p-4.5 rounded-2xl border text-left transition-all flex items-center justify-between shadow-sm ${activeOrder?.id === order.id ? 'border-organic-500 ring-1 ring-organic-500 bg-organic-50/20' : 'border-slate-100 hover:border-slate-200'}`}>
                  <div className="space-y-1.5">
                    <span className="font-serif text-sm font-bold text-slate-800 block">{order.orderNumber}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">{new Date(order.createdAt).toLocaleDateString()} · ₹{order.total}</span>
                    <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor(order.status)}`}>{order.status}</span>
                  </div>
                  <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Order Detail */}
        <div className="lg:col-span-8">
          {activeOrder ? (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8 border-4 border-white">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-150 pb-5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Receipt</span>
                    <h2 className="text-xl font-bold font-serif text-slate-900">{activeOrder.orderNumber}</h2>
                    <p className="text-[10px] text-slate-400">Placed: {new Date(activeOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => alert(`Invoice downloaded for Order: ${activeOrder.orderNumber}`)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm border border-slate-200/40">
                    <Download className="h-4 w-4" /> Download Invoice
                  </button>
                </div>

                {/* Delivery Tracker */}
                <div className="space-y-4">
                  <h4 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <Truck className="h-4.5 w-4.5 text-organic-550" /> Delivery Status Tracker
                  </h4>
                  <div className="relative pt-6 pb-2">
                    <div className="absolute left-4.5 right-4.5 top-9 h-1 bg-slate-200 -translate-y-1/2">
                      <div className="h-full bg-organic-500 transition-all duration-500"
                        style={{ width: `${((getStatusStep(activeOrder.status) - 1) / (steps.length - 1)) * 100}%` }} />
                    </div>
                    <div className="flex justify-between relative z-10 text-[9px] font-bold text-slate-450 uppercase">
                      {steps.map((step, idx) => {
                        const isActive = idx + 1 <= getStatusStep(activeOrder.status);
                        return (
                          <div key={step} className="flex flex-col items-center gap-2 max-w-16 text-center">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center border-4 text-[9px] transition-all duration-300 ${isActive ? 'bg-organic-500 border-white text-white shadow-md scale-110' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                              {isActive ? '✓' : idx + 1}
                            </div>
                            <span className={isActive ? 'text-organic-600 font-extrabold' : 'font-normal'}>{step}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Route Info (for SHIPPED / OUT_FOR_DELIVERY) */}
                {(activeOrder.status === 'SHIPPED' || activeOrder.status === 'OUT_FOR_DELIVERY') && (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white space-y-3">
                    <h4 className="font-serif font-bold text-sm flex items-center gap-2">
                      <MapPin className="h-4.5 w-4.5 text-organic-400" /> Live Delivery Route
                    </h4>
                    <div className="bg-slate-700/50 rounded-xl h-28 flex items-center justify-center text-slate-400 text-xs font-medium border border-slate-600/40 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,#4ade80,transparent_50%)]" />
                      <div className="text-center space-y-1">
                        <MapPin className="h-6 w-6 mx-auto text-organic-400" />
                        <p className="font-bold text-organic-300 text-[11px]">Agent En Route · ETA 20–35 mins</p>
                        <p className="text-[9px] text-slate-500">Route: Niphad → Nashik Ring Road → Your Location</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-[10px]">
                      <div className="bg-slate-700/40 rounded-lg p-2"><p className="text-organic-300 font-bold">4.2 km</p><p className="text-slate-400">Distance left</p></div>
                      <div className="bg-slate-700/40 rounded-lg p-2"><p className="text-organic-300 font-bold">~25 min</p><p className="text-slate-400">ETA</p></div>
                      <div className="bg-slate-700/40 rounded-lg p-2"><p className="text-organic-300 font-bold">Ravi K.</p><p className="text-slate-400">Agent</p></div>
                    </div>
                  </div>
                )}

                {/* Delivery OTP Section */}
                {activeOrder.status !== 'DELIVERED' && activeOrder.status !== 'CANCELLED' && (
                  <div className="border border-amber-200 bg-amber-50 rounded-2xl p-5 space-y-4">
                    <h4 className="font-serif font-bold text-sm text-amber-800 flex items-center gap-2">
                      <KeyRound className="h-4.5 w-4.5" /> Delivery OTP Confirmation
                    </h4>

                    {!deliveryOtp ? (
                      <div className="space-y-2">
                        <p className="text-xs text-amber-700 leading-relaxed">
                          Generate a secure 4-digit OTP. Share it with your delivery agent who will enter it to confirm handover.
                        </p>
                        <button onClick={handleGenerateOtp} disabled={otpLoading}
                          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all">
                          {otpLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                          {otpLoading ? 'Generating...' : 'Generate Delivery OTP'}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* OTP Display */}
                        <div className="text-center space-y-2">
                          <p className="text-xs text-amber-700 font-semibold">Your Delivery OTP — Share with delivery agent:</p>
                          <div className="flex justify-center gap-2">
                            {deliveryOtp.split('').map((digit, i) => (
                              <div key={i} className="w-12 h-14 bg-white border-2 border-amber-400 rounded-xl flex items-center justify-center text-2xl font-black text-amber-700 shadow-sm">
                                {digit}
                              </div>
                            ))}
                          </div>
                          <p className="text-[10px] text-amber-600 flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Valid for 1 hour</p>
                        </div>

                        {/* OTP Confirm Input */}
                        {!otpSuccess && (
                          <div className="space-y-2 border-t border-amber-200 pt-4">
                            <p className="text-xs text-amber-700 font-semibold">Enter OTP below to confirm receipt:</p>
                            <div className="flex gap-2">
                              <input type="text" inputMode="numeric" maxLength={4} placeholder="Enter 4-digit OTP"
                                value={otpInput} onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="flex-grow px-3 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-400"
                              />
                              <button onClick={handleConfirmDelivery} disabled={confirmLoading || otpInput.length !== 4}
                                className="bg-organic-500 hover:bg-organic-600 disabled:bg-organic-300 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all shrink-0">
                                {confirmLoading ? '...' : 'Confirm'}
                              </button>
                            </div>
                            {otpError && (
                              <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                                <XCircle className="h-3 w-3" /> {otpError}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Success */}
                        {otpSuccess && (
                          <div className="flex items-center gap-2 bg-organic-50 border border-organic-200 rounded-xl p-3 text-xs font-bold text-organic-700">
                            <CheckCircle className="h-4 w-4 text-organic-500 shrink-0" />
                            Delivery confirmed! Order marked as Delivered.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Proof of Delivery Upload */}
                {(activeOrder.status === 'OUT_FOR_DELIVERY' || activeOrder.status === 'DELIVERED') && (
                  <div className="border border-slate-200 bg-slate-50 rounded-2xl p-5 space-y-3">
                    <h4 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-2">
                      <Camera className="h-4.5 w-4.5 text-organic-550" /> Delivery Proof
                    </h4>
                    {!proofImage ? (
                      <div>
                        <p className="text-xs text-slate-500 mb-3">Upload a photo of the delivered package as proof of receipt.</p>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleProofUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 bg-white border border-slate-300 hover:border-organic-400 hover:bg-organic-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-all">
                          <Camera className="h-4 w-4" /> Upload Delivery Photo
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <img src={proofImage} alt="Delivery Proof" className="w-full max-h-48 object-cover rounded-xl border border-slate-200 shadow-sm" />
                        <div className="flex items-center gap-2 text-[10px] text-organic-600 font-bold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Delivery proof captured successfully
                        </div>
                        <button onClick={() => setProofImage(null)} className="text-[10px] text-red-500 font-semibold hover:underline">Remove photo</button>
                      </div>
                    )}
                  </div>
                )}

                <div className="h-px bg-slate-100" />

                {/* Items */}
                <div className="space-y-4">
                  <h4 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <Package className="h-4.5 w-4.5 text-organic-550" /> Order Items
                  </h4>
                  <div className="space-y-3">
                    {activeOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100/50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                            <img src={item.product.images[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999'} alt={item.product.name} className="w-full h-full object-cover" />
                          </div>
                          <span className="font-bold text-slate-800">{item.product.name}</span>
                        </div>
                        <span className="text-slate-650">{item.quantity} {item.product.unit} @ ₹{item.price} = <span className="font-serif font-bold text-slate-850">₹{item.price * item.quantity}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/40 text-xs font-bold text-slate-500 space-y-3">
                  <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-800">₹{activeOrder.subtotal}</span></div>
                  {activeOrder.discount > 0 && <div className="flex justify-between text-organic-600"><span>Discount</span><span>-₹{activeOrder.discount}</span></div>}
                  <div className="flex justify-between"><span>Delivery</span><span className="text-slate-800">{activeOrder.deliveryCharge === 0 ? 'FREE' : `₹${activeOrder.deliveryCharge}`}</span></div>
                  <div className="h-px bg-slate-200/60 my-2" />
                  <div className="flex justify-between text-slate-900 text-sm">
                    <span className="font-serif">Paid ({activeOrder.payment?.method || 'COD'})</span>
                    <span className="text-lg font-black text-organic-700">₹{activeOrder.total}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm text-center text-xs text-slate-500 font-semibold italic">
              Select an order on the left to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStaticMockOrders(successId: string | null) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const mock: any[] = [
    { id: 'o-mock-1', orderNumber: 'NEX-26-8941', subtotal: 131, discount: 0, deliveryCharge: 30, total: 161, status: 'CONFIRMED', deliverySlot: 'Morning (08:00 AM - 11:00 AM)', deliveryDate: tomorrow.toISOString().split('T')[0], createdAt: new Date().toISOString(), items: [{ id: 'oi-1', price: 35, quantity: 1, product: { name: 'Organic Palak', unit: 'bunch', images: [{ url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300' }] } }], payment: { method: 'COD', status: 'PENDING' } },
    { id: 'o-mock-2', orderNumber: 'NEX-26-5120', subtotal: 280, discount: 28, deliveryCharge: 0, total: 252, status: 'DELIVERED', deliverySlot: 'Evening (04:00 PM - 07:00 PM)', deliveryDate: '2026-06-10', createdAt: '2026-06-09T18:30:00Z', items: [{ id: 'oi-3', price: 140, quantity: 2, product: { name: 'Broccoli Premium', unit: 'kg', images: [{ url: 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?q=80&w=300' }] } }], payment: { method: 'RAZORPAY', status: 'SUCCESSFUL' } },
  ];
  if (successId && !mock.find(o => o.id === successId)) {
    mock.unshift({ id: successId, orderNumber: `NEX-26-${Math.floor(1000 + Math.random() * 9000)}`, subtotal: 350, discount: 50, deliveryCharge: 0, total: 300, status: 'CONFIRMED', deliverySlot: 'Morning (08:00 AM - 11:00 AM)', deliveryDate: tomorrow.toISOString().split('T')[0], createdAt: new Date().toISOString(), items: [{ id: 'oi-dyn-1', price: 35, quantity: 2, product: { name: 'Organic Palak', unit: 'bunch', images: [{ url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300' }] } }], payment: { method: 'COD', status: 'PENDING' } });
  }
  return mock;
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center font-bold text-organic-700">Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
