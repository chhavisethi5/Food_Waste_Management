import React, { useState, useEffect } from 'react';
import type { FoodListing, CreateListingData } from '../types';
import { listingsApi, donorsApi } from '../api';
import { CreateListingModal } from '../components/CreateListingModal';
import { Plus, Scale, Clock, KeyRound, AlertCircle, Trash2, CheckCircle2, RefreshCw, PackageCheck, FileText } from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listingsApi.getMyListings();
      setListings(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

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

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const blob = await donorsApi.downloadImpactReport();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'ShareMeal_ESG_Impact_Certificate.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to download impact report');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Metrics (actual user data)
  const totalKg = listings.reduce((acc, curr) => acc + (curr.quantity_kg || 0), 0);
  const activeCount = listings.filter((l) => l.status === 'available' || l.status === 'reserved').length;
  const collectedCount = listings.filter((l) => l.status === 'collected').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-lg border border-slate-800">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Donor Dashboard</span>
          <h1 className="text-2xl font-bold tracking-tight">Food Surplus Management</h1>
          <p className="text-xs text-slate-400">Create and monitor surplus food listings and pickup PINs.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="border border-slate-600 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <span>Generating PDF...</span>
            ) : (
              <>
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Impact Certificate (PDF)</span>
              </>
            )}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Post Food Surplus
          </button>
        </div>
      </div>

      {/* Real Data Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Quantity</p>
            <h3 className="text-xl font-bold text-slate-900">{totalKg.toFixed(1)} <span className="text-xs text-slate-500 font-normal">kg</span></h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Listings</p>
            <h3 className="text-xl font-bold text-slate-900">{activeCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collected Listings</p>
            <h3 className="text-xl font-bold text-slate-900">{collectedCount}</h3>
          </div>
        </div>
      </div>

      {/* Listings Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          Your Listings
          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold">{listings.length}</span>
        </h2>
        <button
          onClick={fetchListings}
          className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 text-xs font-medium border border-slate-200"
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
            Create Food Listing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((item) => {
            const isExpired = new Date(item.expires_at) < new Date();

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-slate-200 flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>

                    {/* Status Badge - Crisp colors, no purple */}
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1 border ${
                      item.status === 'available'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : item.status === 'reserved'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : item.status === 'collected'
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {item.status === 'available' && <Clock className="w-3 h-3" />}
                      {item.status === 'reserved' && <AlertCircle className="w-3 h-3" />}
                      {item.status === 'collected' && <CheckCircle2 className="w-3 h-3" />}
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
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expires</span>
                      <span className={`font-semibold ${isExpired ? 'text-red-600' : 'text-slate-800'}`}>
                        {new Date(item.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Pickup PIN Box */}
                  <div className="bg-slate-900 text-white p-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span>Pickup PIN:</span>
                    </div>
                    <span className="text-sm font-bold tracking-widest text-emerald-400 font-mono">
                      {item.pickup_pin}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-400">ID #{item.id}</span>
                  <button
                    onClick={() => handleDeleteListing(item.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                    title="Delete listing"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateListing}
      />
    </div>
  );
};
