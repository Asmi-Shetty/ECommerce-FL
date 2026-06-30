'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import {
  Store, Package, ShoppingCart, AlertTriangle, CheckCircle, FileText, Activity, MapPin, Truck
} from 'lucide-react';

export default function VendorDashboard() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  const [tab, setTab] = useState<'overview' | 'kyc' | 'products' | 'orders'>('overview');
  
  // KYC State
  const [kycForm, setKycForm] = useState({ farmName: '', location: '', bio: '' });
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  
  // Products/Inventory State
  const [products, setProducts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  // Orders State
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login?redirect=vendor'); return; }
    // Ideally we should check if user role is VENDOR or FARMER, but for demo we allow any logged-in user to see it.
    fetchVendorData();
  }, [isAuthenticated, token, router]);

  const fetchVendorData = async () => {
    try {
      const [prodRes, alertRes, orderRes] = await Promise.all([
        fetch('http://localhost:5000/api/vendor/products', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/vendor/inventory/alerts', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/vendor/orders', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      if (prodRes.ok) setProducts(await prodRes.json());
      if (alertRes.ok) setAlerts(await alertRes.json());
      if (orderRes.ok) setOrders(await orderRes.json());
    } catch (err) {
      console.error("Error fetching vendor data", err);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/vendor/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(kycForm)
      });
      const data = await res.json();
      if (res.ok) {
        setKycStatus('APPROVED');
        alert('KYC submitted and verified successfully!');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Error submitting KYC');
    }
  };

  const updateInventory = async (inventoryId: string, newStock: number) => {
    try {
      const res = await fetch(`http://localhost:5000/api/vendor/inventory/${inventoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stockLevel: newStock })
      });
      if (res.ok) {
        fetchVendorData();
      }
    } catch (err) {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-serif text-slate-900">Vendor Portal</h1>
          <p className="text-sm text-slate-500">Manage your farm profile, inventory, and fulfill orders.</p>
        </div>
        {kycStatus === 'APPROVED' && (
          <div className="inline-flex items-center gap-2 bg-organic-100 text-organic-700 px-4 py-2 rounded-full text-xs font-bold border border-organic-200">
            <CheckCircle className="h-4 w-4" /> Verified Farmer
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-200 pb-4">
        {[
          { id: 'overview', label: 'Overview', icon: <Activity className="h-4 w-4" /> },
          { id: 'kyc', label: 'KYC & Profile', icon: <FileText className="h-4 w-4" /> },
          { id: 'products', label: 'Inventory (BR-11)', icon: <Package className="h-4 w-4" /> },
          { id: 'orders', label: 'Order Fulfillment', icon: <ShoppingCart className="h-4 w-4" /> },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === t.id ? 'bg-organic-500 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase">Total Products</span>
              <span className="text-3xl font-black text-slate-800">{products.length}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
              <span className="text-slate-400 text-xs font-bold uppercase">Items to Fulfill</span>
              <span className="text-3xl font-black text-organic-600">{orders.length}</span>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-amber-200 bg-amber-50 shadow-sm flex flex-col gap-2">
              <span className="text-amber-600 text-xs font-bold uppercase">Low Stock Alerts</span>
              <span className="text-3xl font-black text-amber-700">{alerts.length}</span>
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
              <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5" /> Urgent: Low Inventory Alerts
              </h3>
              <div className="space-y-3">
                {alerts.map(a => (
                  <div key={a.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-100 text-xs">
                    <span className="font-bold text-slate-700">{a.name}</span>
                    <span className="text-red-600 font-bold">Only {a.inventory.stockLevel} {a.unit} left! (Threshold: {a.inventory.lowStockThresh})</span>
                    <button onClick={() => setTab('products')} className="text-organic-600 font-semibold underline">Update Stock</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'kyc' && (
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-2xl">
          <h2 className="text-xl font-bold font-serif mb-6 text-slate-800">Farmer KYC Verification</h2>
          <form onSubmit={handleKycSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Farm Name</label>
              <input type="text" value={kycForm.farmName} onChange={e => setKycForm({...kycForm, farmName: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-organic-500" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Location (Village / District)</label>
              <input type="text" value={kycForm.location} onChange={e => setKycForm({...kycForm, location: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-organic-500" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Farm Bio</label>
              <textarea value={kycForm.bio} onChange={e => setKycForm({...kycForm, bio: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-organic-500" rows={4} />
            </div>
            <button type="submit" className="w-full bg-organic-500 hover:bg-organic-600 text-white font-bold py-3 rounded-xl transition-all shadow-sm">
              Submit KYC Documents
            </button>
          </form>
        </div>
      )}

      {tab === 'products' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-serif text-slate-800">Inventory Management</h2>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Alert Threshold</th>
                  <th className="p-4">Quick Adjust</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="p-4 font-bold flex items-center gap-3">
                      <img src={p.images[0]?.url || ''} className="w-8 h-8 rounded-md object-cover" />
                      {p.name}
                    </td>
                    <td className="p-4">₹{p.price}/{p.unit}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-md font-bold ${p.inventory?.stockLevel <= p.inventory?.lowStockThresh ? 'bg-red-100 text-red-600' : 'bg-organic-50 text-organic-700'}`}>
                        {p.inventory?.stockLevel || 0} {p.unit}
                      </span>
                    </td>
                    <td className="p-4">{p.inventory?.lowStockThresh || 10}</td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => updateInventory(p.inventory.id, p.inventory.stockLevel + 10)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg">+10</button>
                      <button onClick={() => updateInventory(p.inventory.id, Math.max(0, p.inventory.stockLevel - 5))} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg">-5</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {products.length === 0 && <div className="p-8 text-center text-slate-400 font-medium">No products listed yet. Create products from admin panel first.</div>}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold font-serif text-slate-800 flex items-center gap-2">
            <Truck className="h-5 w-5" /> Pending Fulfillment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map(o => (
              <div key={o.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400">Order: {o.order.orderNumber}</p>
                    <p className="font-bold text-slate-800">{o.product.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-black text-organic-600">{o.quantity} {o.product.unit}</span>
                  </div>
                </div>
                <div className="text-xs text-slate-600 flex items-start gap-2 pt-1">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                  <p>
                    <span className="font-bold block">{o.order.user?.name} ({o.order.user?.phone})</span>
                    {o.order.address?.addressLine1}, {o.order.address?.city}
                  </p>
                </div>
                <button className="w-full mt-2 py-2 bg-organic-50 hover:bg-organic-100 text-organic-700 font-bold rounded-xl text-xs border border-organic-200 transition-colors">
                  Mark Item as Ready for Pickup
                </button>
              </div>
            ))}
            {orders.length === 0 && <div className="col-span-full p-8 bg-white border rounded-3xl text-center text-slate-400 font-medium">No pending items to fulfill.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
