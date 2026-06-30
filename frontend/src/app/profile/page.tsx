'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { User, Mail, Phone, MapPin, Settings, CheckCircle2, Gift, Ticket, Share2, HelpCircle, Send } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<'profile' | 'loyalty' | 'support'>('profile');

  // Support State
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', type: 'GENERAL' });
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Loyalty State
  const [loyalty, setLoyalty] = useState<{ balance: number, history: any[] }>({ balance: 0, history: [] });
  const [referralPhone, setReferralPhone] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, router, token]);

  const fetchData = async () => {
    try {
      const [ticketRes, loyaltyRes] = await Promise.all([
        fetch('http://localhost:5000/api/support/tickets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('http://localhost:5000/api/promotions/loyalty', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (ticketRes.ok) setTickets(await ticketRes.json());
      if (loyaltyRes.ok) setLoyalty(await loyaltyRes.json());
    } catch (err) {}
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(ticketForm)
      });
      if (res.ok) {
        setTicketForm({ subject: '', message: '', type: 'GENERAL' });
        fetchData();
        alert('Ticket created successfully');
      }
    } catch (err) {}
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyMessage) return;
    try {
      const res = await fetch(`http://localhost:5000/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: replyMessage })
      });
      if (res.ok) {
        setReplyMessage('');
        fetchData();
        // Optimistically update selected ticket
        const data = await res.json();
        setSelectedTicket((prev: any) => ({ ...prev, messages: [...prev.messages, data.supportMessage] }));
      }
    } catch (err) {}
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/promotions/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ referredPhone: referralPhone })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setReferralPhone('');
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans text-left flex flex-col md:flex-row gap-8">
      
      {/* Sidebar Nav */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 font-serif mb-6">Profile</h1>
        {[
          { id: 'profile', label: 'My Details', icon: <User className="h-5 w-5" /> },
          { id: 'loyalty', label: 'Loyalty & Referrals', icon: <Gift className="h-5 w-5" /> },
          { id: 'support', label: 'Customer Support', icon: <HelpCircle className="h-5 w-5" /> },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-organic-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-grow">
        
        {activeTab === 'profile' && (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold font-serif text-slate-800">Personal Information</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <User className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Name</p>
                  <p className="font-bold text-slate-800">{user?.name || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Phone className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Phone</p>
                  <p className="font-bold text-slate-800">{user?.phone || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <Mail className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Email</p>
                  <p className="font-bold text-slate-800">{user?.email || 'Not set'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'loyalty' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-organic-600 to-organic-800 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
              <Gift className="absolute right-[-20px] top-[-20px] h-48 w-48 text-white opacity-10" />
              <h2 className="text-lg font-bold font-serif opacity-90">Loyalty Points Balance</h2>
              <div className="text-5xl font-black mt-2 mb-4">{loyalty.balance}</div>
              <p className="text-xs text-organic-200">Earn points on every purchase and by referring friends!</p>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-organic-500" /> Refer a Friend
              </h3>
              <p className="text-xs text-slate-500">Enter a friend's phone number. If they are registered, you both might get a reward!</p>
              <form onSubmit={handleReferralSubmit} className="flex gap-2">
                <input type="text" placeholder="Friend's Phone Number" value={referralPhone} onChange={e => setReferralPhone(e.target.value)}
                  className="flex-grow px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-organic-500" required />
                <button type="submit" className="bg-organic-500 hover:bg-organic-600 text-white font-bold px-6 rounded-xl transition-all shadow-sm">
                  Refer
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold font-serif text-slate-800">Points History</h3>
              {loyalty.history.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No points earned or redeemed yet.</p>
              ) : (
                <div className="space-y-3">
                  {loyalty.history.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-3 border-b border-slate-100">
                      <div>
                        <p className="text-sm font-bold text-slate-700">{item.description || item.transactionType}</p>
                        <p className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`font-black ${item.transactionType === 'EARNED' ? 'text-organic-600' : 'text-slate-500'}`}>
                        {item.transactionType === 'EARNED' ? '+' : '-'}{item.points}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-6">
            {!selectedTicket ? (
              <>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <h3 className="text-lg font-bold font-serif text-slate-800 flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-organic-500" /> Create Support Ticket
                  </h3>
                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Issue Type</label>
                        <select value={ticketForm.type} onChange={e => setTicketForm({...ticketForm, type: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-organic-500">
                          <option value="GENERAL">General Query</option>
                          <option value="REFUND">Refund Request</option>
                          <option value="RETURN">Return Request</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Subject</label>
                        <input type="text" value={ticketForm.subject} onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-organic-500" required />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Message</label>
                      <textarea value={ticketForm.message} onChange={e => setTicketForm({...ticketForm, message: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-organic-500" rows={3} required />
                    </div>
                    <button type="submit" className="bg-organic-500 hover:bg-organic-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm">
                      Submit Ticket
                    </button>
                  </form>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-lg font-bold font-serif text-slate-800">My Tickets</h3>
                  {tickets.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">You have no active support tickets.</p>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map(t => (
                        <button key={t.id} onClick={() => setSelectedTicket(t)} className="w-full flex justify-between items-center p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-left">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{t.subject}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Type: {t.type} | Created: {new Date(t.createdAt).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${t.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-organic-100 text-organic-700'}`}>
                            {t.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col h-[600px] overflow-hidden">
                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedTicket.subject}</h3>
                    <p className="text-xs text-slate-500">Ticket #{selectedTicket.id.split('-')[0]} | {selectedTicket.status}</p>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Back to Tickets</button>
                </div>
                
                <div className="flex-grow p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                  {selectedTicket.messages.map((m: any) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-organic-500 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'}`}>
                          {m.message}
                        </div>
                        <span className="text-[9px] text-slate-400 mt-1 px-1">
                          {isMe ? 'You' : m.sender.name || 'Support'} • {new Date(m.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-slate-100 bg-white">
                  <form onSubmit={handleSendReply} className="flex gap-2">
                    <input type="text" placeholder="Type a message..." value={replyMessage} onChange={e => setReplyMessage(e.target.value)}
                      className="flex-grow px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-organic-500" required />
                    <button type="submit" disabled={selectedTicket.status === 'RESOLVED'}
                      className="bg-organic-500 hover:bg-organic-600 disabled:bg-slate-300 text-white p-2 w-10 h-10 rounded-xl flex items-center justify-center transition-all">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                  {selectedTicket.status === 'RESOLVED' && <p className="text-xs text-center text-slate-400 mt-2">This ticket has been resolved and closed.</p>}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
