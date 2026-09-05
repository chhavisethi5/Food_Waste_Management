import React, { useState, useEffect } from 'react';
import type { FoodListing, Claim } from '../types';
import { listingsApi, claimsApi } from '../api';
import { useWebSocketUpdates, type WebSocketMessage } from '../hooks/useWebSocketUpdates';
import { CountdownTimer } from '../components/CountdownTimer';
import { Utensils, HeartHandshake, Filter, Phone, Clock, KeyRound, Building2, RefreshCw, CheckCircle2, Bell, MapPin, Navigation, Flame, Snowflake, Thermometer, ShieldCheck } from 'lucide-react';

export const NgoFeedPage: React.FC = () => {
  const [tab, setTab] = useState<'feed' | 'my-reservations'>('feed');
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reservingId, setReservingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Food Safety Reservation Confirmation Modal state
  const [confirmingListing, setConfirmingListing] = useState<FoodListing | null>(null);
  const [foodSafetyAck, setFoodSafetyAck] = useState(false);

  // Geospatial filtering state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const [geoDetecting, setGeoDetecting] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setGeoDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocationLabel(`${pos.coords.latitude.toFixed(2)}°, ${pos.coords.longitude.toFixed(2)}°`);
        setGeoDetecting(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setError('Failed to detect device location');
        setGeoDetecting(false);
      }
    );
  };

  const fetchFeedListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const cat = selectedCategory === 'all' ? undefined : selectedCategory;
      const data = await listingsApi.getAll(
        cat,
        userLat || undefined,
        userLng || undefined,
        radiusKm || undefined
      );
      setListings(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch food feed');
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
    if (tab === 'feed') {
      fetchFeedListings();
    } else {
      fetchMyClaims();
    }
  }, [tab, selectedCategory, userLat, userLng, radiusKm]);

  // Real-time WebSocket Updates Handler
  useWebSocketUpdates((msg: WebSocketMessage) => {
    if (msg.type === 'LISTING_CREATED') {
      const newListing: FoodListing = msg.data;
      setListings((prev) => {
        if (prev.some((item) => item.id === newListing.id)) return prev;
        return [newListing, ...prev];
      });
      setToastMessage('New surplus batch listed!');
      setTimeout(() => setToastMessage(null), 4000);
    } else if (msg.type === 'LISTING_RESERVED' || msg.type === 'LISTING_COLLECTED') {
      const updatedId = msg.data.listing_id;
      // Remove reserved/collected items from available feed immediately
      setListings((prev) => prev.filter((item) => item.id !== updatedId));
      fetchMyClaims();
    }
  });

  const handleOpenReserveModal = (listing: FoodListing) => {
    setConfirmingListing(listing);
    setFoodSafetyAck(false);
  };

  const handleConfirmReserve = async () => {
    if (!confirmingListing) return;
    if (!foodSafetyAck) {
      alert('Please confirm food safety transport compliance before reserving.');
      return;
    }

    try {
      setReservingId(confirmingListing.id);
      const resClaim = await claimsApi.reserveListing(confirmingListing.id, {
        food_safety_acknowledged: true,
      });
      alert(`Listing Reserved! Pickup PIN: ${resClaim.listing?.pickup_pin || 'Generated'}. You have 45 minutes to complete pickup.`);
      setConfirmingListing(null);
      setTab('my-reservations');
      fetchMyClaims();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reserve listing');
    } finally {
      setReservingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg flex items-center justify-between text-xs font-semibold animate-bounce">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-lg border border-slate-800">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">NGO Partner Portal</span>
          <h1 className="text-2xl font-bold tracking-tight">Surplus Food Feed</h1>
          <p className="text-xs text-slate-400">Browse available food, 1-click reserve batches, and view 4-digit pickup PINs.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-800 p-1 rounded-md border border-slate-700">
          <button
            onClick={() => setTab('feed')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === 'feed'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> Available Feed
          </button>
          <button
            onClick={() => setTab('my-reservations')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              tab === 'my-reservations'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" /> My Reservations
          </button>
        </div>
      </div>

      {/* Location Bar & Category Filter (Feed Mode) */}
      {tab === 'feed' && (
        <div className="space-y-3">
          {/* Location Detection Bar */}
          <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <button
                onClick={handleDetectLocation}
                disabled={geoDetecting}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  userLat !== null
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                <span>{geoDetecting ? 'Detecting Location...' : userLat !== null ? `📍 Location Active (${locationLabel})` : '📍 Detect My Location'}</span>
              </button>

              {userLat !== null && (
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-semibold text-slate-500 mr-1">Radius:</span>
                  {[
                    { label: 'All Distances', value: null },
                    { label: '< 5 km', value: 5 },
                    { label: '< 10 km', value: 10 },
                    { label: '< 25 km', value: 25 },
                  ].map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setRadiusKm(r.value)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        radiusKm === r.value
                          ? 'bg-emerald-600 text-white font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={fetchFeedListings}
              className="px-2.5 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1 text-xs font-medium border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Category Filter:
            </span>
            {[
              { id: 'all', label: 'All Items' },
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
        </div>
      )}

      {/* Main Feed Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading available food items...</div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">{error}</div>
      ) : tab === 'feed' ? (
        /* AVAILABLE FOOD VISUAL CARD FEED */
        listings.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg border border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-800">No available food listings match your filters.</p>
            <p className="text-xs text-slate-500">Try selecting a larger radius or resetting your category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {listings.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-slate-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <div className="p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>

                      {/* Storage Condition Badge */}
                      {item.storage_condition === 'hot_holding' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-700" />
                          <span>Hot (&gt;60°C){item.safety_temperature ? ` • ${item.safety_temperature}°C` : ''}</span>
                        </span>
                      )}
                      {item.storage_condition === 'refrigerated' && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                          <Snowflake className="w-3 h-3 text-blue-700" />
                          <span>Cold (&lt;5°C){item.safety_temperature ? ` • ${item.safety_temperature}°C` : ''}</span>
                        </span>
                      )}
                      {(!item.storage_condition || item.storage_condition === 'ambient') && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-slate-500" />
                          <span>Ambient</span>
                        </span>
                      )}
                    </div>

                    {/* Status Badge: Green for Available */}
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-700" /> Available
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                    {(item.distance_km !== undefined || item.address) && (
                      <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>
                          {item.distance_km !== undefined && item.distance_km !== null ? `${item.distance_km} km away` : ''}
                          {item.distance_km !== undefined && item.distance_km !== null && item.address ? ' • ' : ''}
                          {item.address || ''}
                        </span>
                      </div>
                    )}
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

                  <div className="space-y-1 pt-1 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.donor?.organization_name || 'Commercial Donor'}</span>
                    </div>
                    {item.donor?.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.donor.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 1-Click Reserve Button */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenReserveModal(item)}
                    disabled={reservingId === item.id}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-md disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <HeartHandshake className="w-4 h-4" />
                    {reservingId === item.id ? 'Reserving...' : '1-Click Reserve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* MY RESERVATIONS TAB */
        claims.length === 0 ? (
          <div className="bg-white p-8 text-center rounded-lg border border-slate-200 space-y-2">
            <p className="text-sm font-semibold text-slate-800">No active or historical reservations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {/* Status Badge: Yellow for Reserved */}
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border capitalize ${
                      claim.status === 'active'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : claim.status === 'completed'
                        ? 'bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      Status: {claim.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Reserved at {new Date(claim.reserved_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900">
                    {claim.listing?.title || `Listing #${claim.listing_id}`}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {claim.listing?.quantity_kg} kg
                    </span>
                    <span>Donor: <strong>{claim.listing?.donor?.organization_name}</strong></span>
                    {claim.listing?.donor?.phone && <span>Contact: {claim.listing.donor.phone}</span>}
                  </div>

                  {/* 45-Minute Reservation Timer */}
                  {claim.status === 'active' && claim.reservation_expires_at && (
                    <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200 inline-flex items-center gap-2">
                      <span className="font-semibold">Reservation Timer:</span>
                      <CountdownTimer targetDate={claim.reservation_expires_at} />
                    </div>
                  )}
                </div>

                {/* Pickup PIN Display for Reserved Item */}
                <div className="w-full md:w-auto flex flex-col items-end gap-2">
                  {claim.status === 'active' && (
                    <div className="bg-slate-900 text-white p-3 rounded-md border border-slate-800 text-right w-full md:w-auto space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center justify-end gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Your Pickup PIN
                      </div>
                      <div className="text-xl font-bold tracking-widest text-emerald-400 font-mono">
                        {claim.pickup_pin || claim.listing?.pickup_pin || '----'}
                      </div>
                      <p className="text-[10px] text-slate-400">Show this 4-digit PIN to donor upon arrival</p>
                    </div>
                  )}

                  {claim.status === 'completed' && (
                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Pickup Verified & Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Reservation Confirmation & Food Safety Transport Modal */}
      {confirmingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Reserve Food Batch</span>
                <h3 className="text-lg font-bold text-slate-900">{confirmingListing.title}</h3>
                <p className="text-xs text-slate-500">{confirmingListing.quantity_kg} kg • {confirmingListing.donor?.organization_name || 'Donor'}</p>
              </div>
              <button onClick={() => setConfirmingListing(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>

            {/* Storage Condition Notice */}
            <div className="bg-slate-50 p-3.5 rounded-md border border-slate-200 space-y-1.5 text-xs text-slate-700">
              <div className="font-bold flex items-center gap-1.5 text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Food Safety & Transport Compliance</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Storage Condition: <strong className="capitalize text-slate-900">{confirmingListing.storage_condition || 'Ambient'}</strong>
                {confirmingListing.safety_temperature ? ` (${confirmingListing.safety_temperature}°C)` : ''}
              </p>
            </div>

            {/* Mandatory Checkbox */}
            <label className="flex items-start gap-2.5 p-3.5 rounded-md bg-emerald-50/70 border border-emerald-200 cursor-pointer">
              <input
                type="checkbox"
                checked={foodSafetyAck}
                onChange={(e) => setFoodSafetyAck(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 flex-shrink-0"
              />
              <span className="text-xs font-medium text-slate-800 leading-snug">
                I confirm our NGO has insulated/temperature-controlled transport suited for this batch.
              </span>
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingListing(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReserve}
                disabled={!foodSafetyAck || reservingId === confirmingListing.id}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-md transition-colors flex items-center gap-1.5"
              >
                <HeartHandshake className="w-4 h-4" />
                {reservingId === confirmingListing.id ? 'Reserving...' : 'Confirm & Reserve Batch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
