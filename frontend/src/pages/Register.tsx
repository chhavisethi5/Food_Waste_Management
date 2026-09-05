import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { Utensils, HeartHandshake, Building2, Phone, Mail, Lock, UserPlus, ArrowRight, MapPin, Navigation } from 'lucide-react';

interface RegisterProps {
  onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [role, setRole] = useState<UserRole>('donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        if (!address) {
          setAddress(`Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`);
        }
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setError('Could not retrieve current location');
        setGeoLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await register({
        email,
        password,
        role,
        organization_name: organizationName,
        phone,
        address: role === 'donor' ? address || undefined : undefined,
        latitude: role === 'donor' ? latitude : undefined,
        longitude: role === 'donor' ? longitude : undefined,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-900">
      <div className="max-w-lg w-full bg-slate-800 p-8 rounded-lg border border-slate-700 shadow-xl space-y-6">
        
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Organization Account</h2>
          <p className="text-xs text-slate-400">Register as a Food Donor or NGO partner</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 rounded-md border border-slate-700">
          <button
            type="button"
            onClick={() => setRole('donor')}
            className={`py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
              role === 'donor'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> Food Donor
          </button>
          <button
            type="button"
            onClick={() => setRole('ngo')}
            className={`py-2 rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
              role === 'ngo'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" /> NGO Partner
          </button>
        </div>

        {error && (
          <div className="p-3 text-xs text-red-300 bg-red-900/30 rounded-md border border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Organization Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={role === 'donor' ? 'e.g. Green Bistro' : 'e.g. Community Food Bank'}
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="contact@org.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {role === 'donor' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Commercial Kitchen / Pickup Address
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={geoLoading}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <Navigation className="w-3 h-3" />
                  <span>{geoLoading ? 'Detecting...' : 'Use Current Location'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 123 MG Road, Sector 4"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
              </div>
              {latitude !== undefined && longitude !== undefined && (
                <p className="text-[11px] text-emerald-400 mt-1 font-medium">
                  ✓ Coordinates attached ({latitude.toFixed(4)}, {longitude.toFixed(4)})
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-md disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Account...' : <><UserPlus className="w-4 h-4" /> Register Account</>}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-700/60 text-center">
          <p className="text-xs text-slate-400">
            Already registered?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-0.5 ml-1"
            >
              Sign in here <ArrowRight className="w-3 h-3" />
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
