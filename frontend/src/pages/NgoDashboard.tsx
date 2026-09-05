import React, { useState, useEffect } from 'react';
import type { FoodListing, Claim } from '../types';
import { listingsApi, claimsApi } from '../api';
import { PinModal } from '../components/PinModal';
import { Utensils, HeartHandshake, Filter, Phone, Clock, KeyRound, CheckCircle2, Building2, RefreshCw } from 'lucide-react';

interface NgoDashboardProps {
  activeSubTab?: 'browse' | 'claims';
}

export const NgoDashboard: React.FC<NgoDashboardProps> = ({ activeSubTab = 'browse' }) => {
  const [tab, setTab] = useState<'browse' | 'claims'>(activeSubTab);
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);

  const fetchBrowseListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const cat = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await listingsApi.getAll(cat);

      setListings(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch available listings');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyClaims = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await claimsApi.getMyClaims();
      setClaims(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch your claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTab(activeSubTab);
  }, [activeSubTab]);

  useEffect(() => {
    if (tab === 'browse') {
      fetchBrowseListings();
    } else {
      fetchMyClaims();
    }
  }, [tab, selectedCategory]);

  const handleClaim = async (listingId: number) => {
    try {
      await claimsApi.claimListing(listingId);
      alert('Listing successfully reserved. Check "My Claims" tab to manage your pickup.');
      fetchBrowseListings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to claim listing');
    }
  };

  const handleVerifyPin = async (claimId: number, pin: string) => {
    await claimsApi.verifyPickupPin(claimId, pin);
    alert('Pickup verified. Food marked as collected.');
    fetchMyClaims();
  };

  const handleCancelClaim = async (claimId: number) => {
    if (!window.confirm('Cancel this food claim?')) return;
    try {
      await claimsApi.cancelClaim(claimId);
      fetchMyClaims();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel claim');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-lg border border-slate-800">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">NGO Partner Portal</span>
          <h1 className="text-2xl font-bold tracking-tight">Food Surplus Claims</h1>
          <p className="text-xs text-slate-400">Browse and claim available food items from commercial donors.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-800 p-1 rounded-md border border-slate-700">
          <button
            onClick={() => setTab('browse')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === 'browse'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> Available Listings
          </button>
          <button
            onClick={() => setTab('claims')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === 'claims'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" /> My Claims
          </button>
        </div>
      </div>

      {/* Category Pills (Browse Mode) */}
      {tab === 'browse' && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            {[
              { id: 'all', label: 'All Categories' },
              { id: 'cooked', label: 'Cooked Meals' },
              { id: 'bakery', label: 'Bakery' },
              { id: 'produce', label: 'Fresh Produce' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchBrowseListings}
            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 text-xs font-medium border border-slate-200"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading food listings...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">{error}</div>
      ) : tab === 'browse' ? (
        listings.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg border border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-800">No surplus food listings currently available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-slate-200 flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>
                    <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {item.quantity_kg} kg
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.donor?.organization_name || 'Food Donor'}</span>
                    </div>
                    {item.donor?.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.donor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Expires: {new Date(item.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => handleClaim(item.id)}
                    className="w-full py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    <HeartHandshake className="w-4 h-4" /> Reserve Food Batch
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* MY CLAIMS TAB */
        claims.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg border border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-800">No active claims found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border capitalize ${
                      claim.status === 'active'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : claim.status === 'completed'
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      Claim Status: {claim.status}
                    </span>
                    <span className="text-xs text-slate-400">Reserved on {new Date(claim.reserved_at).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">{claim.listing?.title || `Listing #${claim.listing_id}`}</h3>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {claim.listing?.quantity_kg} kg
                    </span>
                    <span>Donor: <strong>{claim.listing?.donor?.organization_name}</strong></span>
                    {claim.listing?.donor?.phone && <span>Contact: {claim.listing.donor.phone}</span>}
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                  {claim.status === 'active' && (
                    <>
                      <button
                        onClick={() => setSelectedClaimId(claim.listing_id)}
                        className="flex-1 md:flex-none px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors flex items-center justify-center gap-1.5"
                      >

                        <KeyRound className="w-4 h-4" /> Enter Pickup PIN
                      </button>
                      <button
                        onClick={() => handleCancelClaim(claim.id)}
                        className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {claim.status === 'completed' && (
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pickup Verified
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* PIN Modal */}
      <PinModal
        isOpen={!!selectedClaimId}
        claimId={selectedClaimId}
        onClose={() => setSelectedClaimId(null)}
        onVerify={handleVerifyPin}
      />
    </div>
  );
};
