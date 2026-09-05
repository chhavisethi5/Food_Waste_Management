import React, { useState, useEffect } from 'react';
import type { FoodListing, CreateListingData } from '../types';
import { listingsApi, claimsApi } from '../api';
import { useWebSocketUpdates, type WebSocketMessage } from '../hooks/useWebSocketUpdates';
import { CreateListingModal } from '../components/CreateListingModal';
import { CountdownTimer } from '../components/CountdownTimer';
import { Plus, Clock, AlertCircle, Trash2, CheckCircle2, RefreshCw, Check } from 'lucide-react';

export const DonorDashboardPage: React.FC = () => {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Inline PIN verification state map { [listingId: number]: string }
  const [pinInputs, setPinInputs] = useState<{ [key: number]: string }>({});
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listingsApi.getMyListings();
      setListings(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch your listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Real-time WebSocket Updates Handler
  useWebSocketUpdates((msg: WebSocketMessage) => {
    if (msg.type === 'LISTING_RESERVED' || msg.type === 'LISTING_COLLECTED') {
      const { listing_id, status } = msg.data;
      setListings((prev) =>
        prev.map((item) => (item.id === listing_id ? { ...item, status } : item))
      );
    } else if (msg.type === 'LISTING_CREATED') {
      fetchListings();
    }
  });

  const handleCreateListing = async (data: CreateListingData) => {
    await listingsApi.create(data);
    fetchListings();
  };

  const handleDeleteListing = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await listingsApi.delete(id);
      setListings(listings.filter((l) => l.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete listing');
    }
  };

  const handleVerifyPickupPin = async (listingId: number) => {
    const pin = pinInputs[listingId];
    if (!pin || pin.length !== 4) {
      alert('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      setVerifyingId(listingId);
      await claimsApi.verifyPickupPin(listingId, pin);
      alert('Pickup verified successfully! Status marked as collected.');
      setPinInputs((prev) => ({ ...prev, [listingId]: '' }));
      fetchListings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Invalid pickup PIN. Verification failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-lg border border-slate-800">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Donor Portal</span>
          <h1 className="text-2xl font-bold tracking-tight">Restaurant Surplus Dashboard</h1>
          <p className="text-xs text-slate-400">Post surplus food, view active posts, and verify NGO pickup PINs.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Post Food Surplus
        </button>
      </div>

      {/* Listings Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          Your Active Posts
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold">{listings.length}</span>
        </h2>
        <button
          onClick={fetchListings}
          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 text-xs font-medium border border-slate-200"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading listings...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">{error}</div>
      ) : listings.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg border border-slate-200 space-y-3">
          <p className="text-sm font-semibold text-slate-800">No surplus food listings created yet.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors"
          >
            Post Your First Surplus Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-slate-200 flex flex-col justify-between overflow-hidden shadow-sm"
            >
              <div className="p-5 space-y-3">
                {/* Category & Status Color Badges */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {item.category}
                  </span>

                  {/* Status Badges: Green for Available, Yellow for Reserved */}
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 border ${
                    item.status === 'available'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : item.status === 'reserved'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : item.status === 'collected'
                      ? 'bg-slate-100 text-slate-800 border-slate-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {item.status === 'available' && <Clock className="w-3 h-3 text-emerald-700" />}
                    {item.status === 'reserved' && <AlertCircle className="w-3 h-3 text-amber-700" />}
                    {item.status === 'collected' && <CheckCircle2 className="w-3 h-3 text-slate-700" />}
                    <span className="capitalize">{item.status}</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Quantity</span>
                    <span className="font-bold text-slate-800">{item.quantity_kg} kg</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expires In</span>
                    <CountdownTimer targetDate={item.expires_at} />
                  </div>
                </div>

                {/* Status-Driven Handshake Section */}
                {item.status === 'reserved' && (
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-md space-y-2">
                    <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                      VERIFY NGO PICKUP PIN
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="4-digit PIN"
                        value={pinInputs[item.id] || ''}
                        onChange={(e) => setPinInputs({ ...pinInputs, [item.id]: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-28 px-2.5 py-1.5 text-center text-xs font-bold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-mono tracking-widest"
                      />
                      <button
                        onClick={() => handleVerifyPickupPin(item.id)}
                        disabled={verifyingId === item.id || (pinInputs[item.id] || '').length !== 4}
                        className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-md transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {verifyingId === item.id ? 'Verifying...' : 'Verify Pickup'}
                      </button>
                    </div>
                  </div>
                )}

                {item.status === 'collected' && (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md flex items-center gap-2 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Pickup Verified & Handover Completed</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                <span className="text-slate-400">ID #{item.id}</span>
                <button
                  onClick={() => handleDeleteListing(item.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                  title="Delete listing"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateListing}
      />
    </div>
  );
};
