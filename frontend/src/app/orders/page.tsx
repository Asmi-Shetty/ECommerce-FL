'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { ClipboardCheck, Truck, ShieldCheck, CheckCircle2, ChevronRight, Download, Package } from 'lucide-react';

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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(data);
          // Set active order to the newly created one or the most recent one
          if (successId) {
            const found = data.find((o: Order) => o.id === successId);
            if (found) setActiveOrder(found);
          } else if (data.length > 0) {
            setActiveOrder(data[0]);
          }
        }
      } catch (err) {
        console.warn('API Offline. Loading mock order list.');
        const mockOrders = getStaticMockOrders(successId);
        setOrders(mockOrders);
        if (mockOrders.length > 0) {
          setActiveOrder(mockOrders[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, router, token, successId]);

  const handleDownloadInvoice = (order: Order) => {
    alert(`\nInvoice downloaded for Order: ${order.orderNumber}\nFile: Krishna_Organic_Invoice_${order.orderNumber}.pdf`);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-left">
      {/* Order Success Banner */}
      {isSuccess && activeOrder && (
        <div className="bg-gradient-to-r from-organic-500 to-organic-600 rounded-3xl p-8 text-white mb-10 text-center space-y-4 animate-slide-up shadow">
          <div className="bg-white/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
            <ClipboardCheck className="h-9 w-9 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-serif font-bold">Order Confirmed Successfully!</h2>
            <p className="text-xs text-organic-100 font-medium">
              Thank you for choosing Krishna Organic & Exotic Farming. Your order ID is <span className="font-bold">{activeOrder.orderNumber}</span>.
            </p>
          </div>
          <p className="text-[11px] text-organic-200">
            Fresh vegetables will be harvested at dawn and sent for delivery slot: <span className="font-bold text-white">{activeOrder.deliverySlot}</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Side: Orders list */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-serif font-bold text-lg text-slate-900 px-1">Order History</h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white h-24 rounded-2xl animate-pulse border border-slate-150"></div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center text-xs text-slate-500 font-semibold italic">
              No orders placed yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setActiveOrder(order)}
                  className={`w-full bg-white p-4.5 rounded-2xl border text-left transition-all flex items-center justify-between shadow-sm ${
                    activeOrder?.id === order.id
                      ? 'border-organic-500 ring-1 ring-organic-500 bg-organic-50/20'
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="space-y-1.5">
                    <span className="font-serif text-sm font-bold text-slate-800 block">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {new Date(order.createdAt).toLocaleDateString()} • ₹{order.total}
                    </span>
                    <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-organic-100 text-organic-700">
                      {order.status}
                    </span>
                  </div>
                  <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Order Tracking timeline and detailed receipt */}
        <div className="lg:col-span-8">
          {activeOrder ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-8 border-4 border-white">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-150 pb-5">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Receipt</span>
                  <h2 className="text-xl font-bold font-serif text-slate-900">{activeOrder.orderNumber}</h2>
                  <p className="text-[10px] text-slate-400">
                    Placed on: {new Date(activeOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadInvoice(activeOrder)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm border border-slate-200/40"
                >
                  <Download className="h-4 w-4" /> Download Invoice
                </button>
              </div>

              {/* Delivery Timeline Tracker */}
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Truck className="h-4.5 w-4.5 text-organic-550" /> Delivery Status Tracker
                </h4>
                <div className="relative pt-6 pb-2">
                  {/* Progress Line */}
                  <div className="absolute left-4.5 right-4.5 top-9 h-1 bg-slate-200 -translate-y-1/2">
                    <div
                      className="h-full bg-organic-500 transition-all duration-500"
                      style={{
                        width: `${((getStatusStep(activeOrder.status) - 1) / (steps.length - 1)) * 100}%`
                      }}
                    />
                  </div>

                  {/* Nodes */}
                  <div className="flex justify-between relative z-10 text-[9px] font-bold text-slate-450 uppercase">
                    {steps.map((step, idx) => {
                      const currentStep = getStatusStep(activeOrder.status);
                      const isActive = idx + 1 <= currentStep;
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 max-w-16 text-center">
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center border-4 text-[9px] transition-all duration-300 ${
                              isActive
                                ? 'bg-organic-500 border-white text-white shadow-md scale-110'
                                : 'bg-slate-100 border-slate-200 text-slate-400'
                            }`}
                          >
                            {isActive ? '✓' : idx + 1}
                          </div>
                          <span className={isActive ? 'text-organic-600 font-extrabold' : 'font-normal'}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* Items detail list */}
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Package className="h-4.5 w-4.5 text-organic-550" /> Order Items List
                </h4>
                <div className="space-y-3">
                  {activeOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-2 border-b border-slate-100/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                          <img
                            src={item.product.images[0]?.url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-bold text-slate-800 text-left">{item.product.name}</span>
                      </div>
                      <span className="text-slate-650">
                        {item.quantity} {item.product.unit} @ ₹{item.price} = <span className="font-serif font-bold text-slate-850">₹{item.price * item.quantity}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals panel */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/40 text-xs font-bold text-slate-500 space-y-3 text-left">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-slate-800">₹{activeOrder.subtotal}</span>
                </div>
                {activeOrder.discount > 0 && (
                  <div className="flex justify-between text-organic-600">
                    <span>Discount</span>
                    <span>-₹{activeOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span className="text-slate-800">
                    {activeOrder.deliveryCharge === 0 ? 'FREE' : `₹${activeOrder.deliveryCharge}`}
                  </span>
                </div>
                <div className="h-px bg-slate-200/60 my-2"></div>
                <div className="flex justify-between text-slate-900 text-sm">
                  <span className="font-serif">Paid Amount ({activeOrder.payment?.method || 'COD'})</span>
                  <span className="text-lg font-black text-organic-700">₹{activeOrder.total}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm text-center text-xs text-slate-500 font-semibold italic">
              Select an order on the left to trace timeline statuses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Fallback Mock Orders
function getStaticMockOrders(successId: string | null): Order[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const mock = [
    {
      id: 'o-mock-1',
      orderNumber: 'NEX-26-8941',
      subtotal: 131,
      discount: 0,
      deliveryCharge: 30,
      total: 161,
      status: 'CONFIRMED',
      deliverySlot: 'Morning (08:00 AM - 11:00 AM)',
      deliveryDate: tomorrow.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'oi-1',
          price: 35,
          quantity: 1,
          product: {
            name: 'Organic Palak (Spinach)',
            unit: 'bunch',
            images: [{ url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300' }]
          }
        },
        {
          id: 'oi-2',
          price: 48,
          quantity: 2,
          product: {
            name: 'Orange Carrots (Gajar)',
            unit: 'kg',
            images: [{ url: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?q=80&w=300' }]
          }
        }
      ],
      payment: { method: 'COD', status: 'PENDING' }
    },
    {
      id: 'o-mock-2',
      orderNumber: 'NEX-26-5120',
      subtotal: 280,
      discount: 28,
      deliveryCharge: 30,
      total: 282,
      status: 'DELIVERED',
      deliverySlot: 'Evening (04:00 PM - 07:00 PM)',
      deliveryDate: '2026-06-10',
      createdAt: '2026-06-09T18:30:00Z',
      items: [
        {
          id: 'oi-3',
          price: 140,
          quantity: 2,
          product: {
            name: 'Broccoli Premium',
            unit: 'kg',
            images: [{ url: 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?q=80&w=300' }]
          }
        }
      ],
      payment: { method: 'RAZORPAY', status: 'SUCCESSFUL' }
    }
  ];

  if (successId && successId !== 'o-mock-1' && successId !== 'o-mock-2') {
    // Add dynamically a mock corresponding to successId
    mock.unshift({
      id: successId,
      orderNumber: `NEX-26-${Math.floor(1000 + Math.random() * 9000)}`,
      subtotal: 350,
      discount: 50,
      deliveryCharge: 0,
      total: 300,
      status: 'CONFIRMED',
      deliverySlot: 'Morning (08:00 AM - 11:00 AM)',
      deliveryDate: tomorrow.toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      items: [
        {
          id: 'oi-dyn-1',
          price: 35,
          quantity: 2,
          product: {
            name: 'Organic Palak (Spinach)',
            unit: 'bunch',
            images: [{ url: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?q=80&w=300' }]
          }
        },
        {
          id: 'oi-dyn-2',
          price: 140,
          quantity: 2,
          product: {
            name: 'Broccoli Premium',
            unit: 'kg',
            images: [{ url: 'https://images.unsplash.com/photo-1452967712862-0cca1839ff27?q=80&w=300' }]
          }
        }
      ],
      payment: { method: 'COD', status: 'PENDING' }
    });
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
