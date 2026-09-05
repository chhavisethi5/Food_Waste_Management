import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listingsApi } from '../api';
import type { FoodListing } from '../types';
import { CountdownTimer } from '../components/CountdownTimer';
import { Utensils, HeartHandshake, Plus, RefreshCw, Clock, Building2 } from 'lucide-react';


export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<FoodListing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const data = await listingsApi.getAll();
      setListings(data.slice(0, 4));
    } catch (err) {
      console.error('Failed to fetch preview listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleRoleNavigate = (role: 'donor' | 'ngo') => {
    navigate(`/login?role=${role}`, { state: { preselectedRole: role } });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* 1. Header / Navbar */}
      <header className="bg-[#0B1325] text-white sticky top-0 z-50 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-[#00B27A] flex items-center justify-center text-white font-bold">
              <Utensils className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              ShareMeal
            </span>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#live-feed" className="hover:text-white transition-colors">
              Live Feed
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            <Link
              to="/login"
              className="text-white border border-slate-700 hover:bg-slate-800 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/login"
              className="bg-[#00B27A] hover:bg-[#009b69] text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              Sign Up / Register
            </Link>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto px-4 mt-6 w-full space-y-12 pb-16">
        
        {/* 2. Hero Section Banner */}
        <section className="bg-[#0D1527] rounded-2xl p-8 md:p-12 border border-slate-800 shadow-sm text-white space-y-6">
          <div className="space-y-3">
            <span className="text-[#00B27A] font-semibold text-xs tracking-wider uppercase block">
              COMMERCIAL FOOD RECOVERY PLATFORM
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Direct food recovery from commercial kitchens to local shelters.
            </h1>
            <p className="text-slate-300 max-w-2xl text-sm md:text-base leading-relaxed">
              A scheduled reservation protocol connecting licensed restaurants with verified non-profits. Listings expire automatically based on preparation time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => handleRoleNavigate('donor')}
              className="bg-[#00B27A] hover:bg-[#009b69] text-white rounded-lg px-5 py-2.5 font-medium text-sm flex items-center gap-2 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Post Food Surplus
            </button>
            <button
              onClick={() => handleRoleNavigate('ngo')}
              className="border border-slate-700 hover:bg-slate-800 text-white rounded-lg px-5 py-2.5 font-medium text-sm flex items-center gap-2 transition-colors"
            >
              <HeartHandshake className="w-4 h-4 text-[#00B27A]" /> Browse Available Batches
            </button>
          </div>
        </section>

        {/* 3. Live Available Listings Preview */}
        <section id="live-feed" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-900">
                Live Available Batches
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800 font-bold">
                {listings.length}
              </span>
            </div>

            <button
              onClick={fetchListings}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-slate-200"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              Loading available batches...
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-1">
              <h3 className="text-slate-900 font-semibold text-base">
                No active surplus listings in your sector right now.
              </h3>
              <p className="text-slate-500 text-sm">
                Check back shortly or register your organization to receive notifications.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Top Row Pills */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-700" /> Available
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>

                    {/* Middle Data Row */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Quantity</span>
                        <span className="font-bold text-slate-900 text-sm">{item.quantity_kg} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Expires In</span>
                        <CountdownTimer targetDate={item.expires_at} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.donor?.organization_name || 'Commercial Donor'}</span>
                    </div>
                  </div>

                  {/* Action CTA */}
                  <button
                    onClick={() => handleRoleNavigate('ngo')}
                    className="w-full py-2.5 text-xs font-semibold text-white bg-[#00B27A] hover:bg-[#009b69] rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <HeartHandshake className="w-4 h-4" /> Claim Batch (Login Required)
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. Operational Protocol ("How It Works") */}
        <section id="how-it-works" className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900">
              Operational Protocol
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
              <span className="text-[11px] font-bold tracking-wider text-[#00B27A] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                01. LISTING CREATION
              </span>
              <h3 className="text-base font-bold text-slate-900">Commercial Input</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Donor submits item details, total weight in kg, preparation category, and storage constraints.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
              <span className="text-[11px] font-bold tracking-wider text-[#00B27A] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                02. 4-DIGIT PIN RESERVATION
              </span>
              <h3 className="text-base font-bold text-slate-900">Shelter Reservation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Verified NGO claims the batch, locking it for a 45-minute pickup window and issuing a unique 4-digit code.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
              <span className="text-[11px] font-bold tracking-wider text-[#00B27A] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                03. VERIFIED HANDOVER
              </span>
              <h3 className="text-base font-bold text-slate-900">PIN Physical Handover</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Donor confirms physical handover using the recipient's 4-digit numeric code to complete status tracking.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* 5. Technical Footer */}
      <footer className="bg-[#0B1325] text-slate-400 font-mono text-xs py-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-2">
          <p className="text-slate-300">© 2026 ShareMeal. Commercial Food Recovery Network.</p>
          <p className="text-[11px] text-slate-500">FastAPI • SQLAlchemy • SQLite • React • TypeScript • Tailwind CSS</p>
        </div>
      </footer>

    </div>
  );
};
