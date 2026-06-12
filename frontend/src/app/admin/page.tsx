'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { LayoutDashboard, ShoppingCart, Users, Leaf, ArrowUpRight, Check, ShieldCheck, XCircle, Settings, AlertTriangle, Package, Calendar } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'vendors' | 'inventory'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 12480, orders: 42, customers: 31, vendors: 2 });
  const [loading, setLoading] = useState(true);

  // Authorization check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'ADMIN') {
      alert('Access Denied: Admins Only!');
      router.push('/');
    }
  }, [isAuthenticated, user, router]);

  // Load Admin Data from API / mock fallback
  useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        // Fetch all orders
        const ordRes = await fetch('http://localhost:5000/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const ordData = await ordRes.json();
        
        // Fetch all products
        const prodRes = await fetch('http://localhost:5000/api/products');
        const prodData = await prodRes.json();

        if (ordRes.ok && prodRes.ok) {
          setOrders(ordData);
          setProducts(prodData);
          
          // Calculate dynamic stats
          const totalRev = ordData.reduce((acc: number, o: any) => acc + o.total, 0);
          setStats({
            revenue: totalRev,
            orders: ordData.length,
            customers: 18,
            vendors: 2
          });
        }
      } catch (err) {
        console.warn('API Offline. Generating mock dashboard data.');
        setOrders(getMockOrders());
        setProducts(getMockProducts());
      } finally {
        setVendors(getMockVendors());
        setLoading(false);
      }
    };

    loadAdminData();
  }, [token]);

  // Actions
  const handleOrderStatusUpdate = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    alert(`Order status updated to: ${newStatus}`);
  };

  const handleVendorKYC = (vendorId: string, action: 'APPROVED' | 'REJECTED') => {
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, kycStatus: action } : v));
    alert(`Farmer verification status set to: ${action}`);
  };

  const tabs = [
    { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard },
    { name: 'Products Catalog', id: 'products', icon: Leaf },
    { name: 'Orders Dispatch', id: 'orders', icon: ShoppingCart },
    { name: 'Farmers & KYC', id: 'vendors', icon: Users },
    { name: 'Stock Levels', id: 'inventory', icon: Package }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-left">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Control Center</span>
          <h1 className="text-3xl font-extrabold text-slate-905 font-serif mt-0.5">Admin Management Dashboard</h1>
        </div>
        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-4.5 py-2.5 rounded-xl border border-slate-200/50 flex items-center gap-1.5 shadow-sm">
          <ShieldCheck className="h-4.5 w-4.5 text-organic-550" /> Admin Privileged: {user?.name}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-2">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-t-2xl transition-all border-t-2 ${
                activeTab === tab.id
                  ? 'border-organic-500 bg-white text-organic-700 font-extrabold shadow-sm'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <IconComp className="h-4.5 w-4.5" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center font-bold text-slate-450">Loading administrative datastores...</div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Main Dashboard view */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Revenue</span>
                    <span className="text-organic-600 bg-organic-50 p-1.5 rounded-lg">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl font-black text-slate-800">₹{stats.revenue}</span>
                    <p className="text-[10px] text-slate-400 font-medium">Derived from all completed bookings</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Orders Dispatched</span>
                    <span className="text-slate-600 bg-slate-50 p-1.5 rounded-lg">
                      <ShoppingCart className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl font-black text-slate-800">{stats.orders}</span>
                    <p className="text-[10px] text-slate-400 font-medium">Daily orders in checkout systems</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Registered customers</span>
                    <span className="text-slate-600 bg-slate-50 p-1.5 rounded-lg">
                      <Users className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl font-black text-slate-800">{stats.customers}</span>
                    <p className="text-[10px] text-slate-400 font-medium">Registered Nashik consumer accounts</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active farmers</span>
                    <span className="text-organic-600 bg-organic-50 p-1.5 rounded-lg">
                      <Leaf className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-2xl font-black text-slate-800">{stats.vendors}</span>
                    <p className="text-[10px] text-slate-400 font-medium">Verified local suppliers supplying items</p>
                  </div>
                </div>
              </div>

              {/* Quick Summary Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pending Verification */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left">
                  <h3 className="font-serif font-bold text-base text-slate-850 mb-4 flex items-center gap-1.5">
                    <AlertTriangle className="h-5 w-5 text-amber-500" /> Farmers Awaiting Review
                  </h3>
                  <div className="space-y-3">
                    {vendors.map((v) => (
                      <div key={v.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-bold text-slate-800 block">{v.name}</span>
                          <span className="text-slate-400">{v.farmName} • {v.location}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          {v.kycStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low Stock Tracker */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left">
                  <h3 className="font-serif font-bold text-base text-slate-850 mb-4 flex items-center gap-1.5">
                    <Package className="h-5 w-5 text-red-500" /> Low Stock Alerts
                  </h3>
                  <div className="space-y-3">
                    {products.filter(p => (p.inventory?.stockLevel || 50) < 50).map((p) => (
                      <div key={p.id} className="flex justify-between items-center text-xs border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-bold text-slate-800 block">{p.name}</span>
                          <span className="text-slate-400">By {p.farmer.farmName}</span>
                        </div>
                        <span className="text-xs font-bold text-red-650">
                          {p.inventory?.stockLevel || 12} {p.unit} remaining
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Products Catalog Tab */}
          {activeTab === 'products' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="font-serif font-bold text-lg text-slate-850">Organic Vegetables Listings</h3>
                <button
                  onClick={() => alert('Add Product details form is locked in MVP.')}
                  className="bg-organic-500 hover:bg-organic-600 text-white font-bold px-4 py-2 rounded-xl text-xs"
                >
                  + Add New Vegetable
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-500">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Name</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Farmer</th>
                      <th className="px-4 py-3.5">Market Price</th>
                      <th className="px-4 py-3.5">Sourcing Status</th>
                      <th className="px-4 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-4 font-bold text-slate-850">{p.name}</td>
                        <td className="px-4 py-4">{p.category.name}</td>
                        <td className="px-4 py-4">{p.farmer.farmName}</td>
                        <td className="px-4 py-4">₹{p.discountPrice || p.price} / {p.unit}</td>
                        <td className="px-4 py-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-organic-100 text-organic-700">
                            Active
                          </span>
                        </td>
                        <td className="px-4 py-4 flex gap-2">
                          <button
                            onClick={() => alert(`Editing: ${p.name}`)}
                            className="text-organic-605 hover:underline font-bold"
                          >
                            Edit
                          </button>
                          <span className="text-slate-200">|</span>
                          <button
                            onClick={() => alert(`Deleting: ${p.name}`)}
                            className="text-red-500 hover:underline font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Dispatch Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left space-y-6">
              <h3 className="font-serif font-bold text-lg text-slate-850 border-b border-slate-100 pb-4">
                Active Deliveries Dispatch
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-500">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Order No</th>
                      <th className="px-4 py-3.5">Pincode</th>
                      <th className="px-4 py-3.5">Total Bill</th>
                      <th className="px-4 py-3.5">Timeslot</th>
                      <th className="px-4 py-3.5">Dispatch State</th>
                      <th className="px-4 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-4 font-serif font-bold text-slate-850">{o.orderNumber}</td>
                        <td className="px-4 py-4 font-bold text-organic-700">422005</td>
                        <td className="px-4 py-4 font-bold">₹{o.total}</td>
                        <td className="px-4 py-4 font-medium">{o.deliverySlot}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            o.status === 'DELIVERED'
                              ? 'bg-organic-100 text-organic-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={o.status}
                            onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                            className="bg-slate-105 border border-slate-200 rounded px-2 py-1 font-bold text-slate-650"
                          >
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vendors & Farmers Tab */}
          {activeTab === 'vendors' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left space-y-6">
              <h3 className="font-serif font-bold text-lg text-slate-850 border-b border-slate-100 pb-4">
                Nashik Farmer Sourcing & KYC Approvals
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-500">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Farmer Name</th>
                      <th className="px-4 py-3.5">Farm Location</th>
                      <th className="px-4 py-3.5">Bio Story</th>
                      <th className="px-4 py-3.5">KYC Document Status</th>
                      <th className="px-4 py-3.5">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-4 font-bold text-slate-850">{v.name}</td>
                        <td className="px-4 py-4 font-semibold text-organic-700">{v.farmName}</td>
                        <td className="px-4 py-4 italic max-w-xs truncate">{v.bio}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            v.kycStatus === 'APPROVED'
                              ? 'bg-organic-100 text-organic-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {v.kycStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 flex gap-2">
                          <button
                            onClick={() => handleVendorKYC(v.id, 'APPROVED')}
                            className="bg-organic-50 hover:bg-organic-100 border border-organic-200 text-organic-700 font-bold px-3 py-1 rounded text-[11px]"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleVendorKYC(v.id, 'REJECTED')}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-bold px-3 py-1 rounded text-[11px]"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stock Levels Tab */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm border-4 border-white text-left space-y-6">
              <h3 className="font-serif font-bold text-lg text-slate-850 border-b border-slate-100 pb-4">
                Real-Time Sourced Inventory Levels
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-500">
                  <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5">Vegetable Name</th>
                      <th className="px-4 py-3.5">Available Stock Level</th>
                      <th className="px-4 py-3.5">Low-Stock Alert Level</th>
                      <th className="px-4 py-3.5">Vendor Farm</th>
                      <th className="px-4 py-3.5">Sourcing Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const stock = p.inventory?.stockLevel || 60;
                      const lowThresh = p.inventory?.lowStockThresh || 15;
                      const isLow = stock <= lowThresh;
                      return (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                          <td className="px-4 py-4 font-bold text-slate-850">{p.name}</td>
                          <td className="px-4 py-4 font-bold text-sm">{stock} {p.unit}</td>
                          <td className="px-4 py-4">{lowThresh} {p.unit}</td>
                          <td className="px-4 py-4 text-organic-700 font-semibold">{p.farmer.farmName}</td>
                          <td className="px-4 py-4">
                            {isLow ? (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-red-100 text-red-650 flex items-center gap-1.5 w-fit">
                                <AlertTriangle className="h-3 w-3" /> Low Stock
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-organic-100 text-organic-700 flex items-center gap-1.5 w-fit">
                                <Check className="h-3 w-3" /> Stable
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Fallback Mock Datastores
function getMockOrders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return [
    {
      id: 'o1',
      orderNumber: 'NEX-26-8941',
      total: 161,
      status: 'CONFIRMED',
      deliverySlot: 'Morning (08:00 AM - 11:00 AM)',
      deliveryDate: tomorrow.toISOString().split('T')[0]
    },
    {
      id: 'o2',
      orderNumber: 'NEX-26-5120',
      total: 282,
      status: 'DELIVERED',
      deliverySlot: 'Evening (04:00 PM - 07:00 PM)',
      deliveryDate: '2026-06-10'
    }
  ];
}

function getMockProducts() {
  return [
    {
      id: 'p1',
      name: 'Organic Palak (Spinach)',
      unit: 'bunch',
      price: 45,
      discountPrice: 35,
      category: { name: 'Leafy Greens' },
      farmer: { farmName: 'Patil Bio-Farms, Niphad' },
      inventory: { stockLevel: 120, lowStockThresh: 15 }
    },
    {
      id: 'p2',
      name: 'Orange Carrots (Gajar)',
      unit: 'kg',
      price: 60,
      discountPrice: 48,
      category: { name: 'Root Vegetables' },
      farmer: { farmName: 'Deshmukh Natural Gardens, Sinnar' },
      inventory: { stockLevel: 80, lowStockThresh: 15 }
    },
    {
      id: 'p3',
      name: 'Broccoli Premium',
      unit: 'kg',
      price: 180,
      discountPrice: 140,
      category: { name: 'Exotic Vegetables' },
      farmer: { farmName: 'Deshmukh Natural Gardens, Sinnar' },
      inventory: { stockLevel: 12, lowStockThresh: 15 } // Trigger Low Stock Alert
    },
    {
      id: 'p4',
      name: 'Nashik Desi Tomatoes',
      unit: 'kg',
      price: 40,
      discountPrice: 28,
      category: { name: 'Daily Essentials' },
      farmer: { farmName: 'Patil Bio-Farms, Niphad' },
      inventory: { stockLevel: 300, lowStockThresh: 15 }
    }
  ];
}

function getMockVendors() {
  return [
    {
      id: 'f1',
      name: 'Ramesh Patil',
      farmName: 'Patil Bio-Farms, Niphad',
      location: 'Niphad, Nashik',
      kycStatus: 'APPROVED',
      bio: 'Pioneers in pesticide-free vermicompost cultivation since 2015.'
    },
    {
      id: 'f2',
      name: 'Suresh Deshmukh',
      farmName: 'Deshmukh Natural Gardens, Sinnar',
      location: 'Sinnar, Nashik',
      kycStatus: 'PENDING', // Awaiting Review in dashboard
      bio: 'Sourced directly from rain-fed highlands utilizing natural spring irrigation and multi-cropping techniques.'
    }
  ];
}
