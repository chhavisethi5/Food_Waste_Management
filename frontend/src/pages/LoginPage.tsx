import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { Utensils, HeartHandshake, Building2, Phone, Mail, Lock, LogIn, UserPlus } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const preselectedRole = (location.state as any)?.preselectedRole as UserRole | undefined;
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>(preselectedRole || 'donor');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          role,
          organization_name: organizationName,
          phone,
        });
      }

      // Route based on role selection or logged in user
      const targetRole = mode === 'register' ? role : undefined;
      if (targetRole === 'donor') {
        navigate('/donor-dashboard');
      } else if (targetRole === 'ngo') {
        navigate('/ngo-feed');
      } else {
        navigate('/donor-dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-900">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-lg border border-slate-700 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-600 rounded-md flex items-center justify-center mx-auto text-white">
            <Utensils className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Account Login' : 'Create Organization Account'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' ? 'Sign in to access your dashboard' : 'Join our surplus food rescue network'}
          </p>
        </div>

        {/* Mode Toggle (Login vs Register) */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-md border border-slate-700">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'login' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'register' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Role Selector (Donor vs NGO) */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Select Role:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole('donor')}
              className={`py-2 rounded-md text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                role === 'donor'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" /> Donor (Restaurant)
            </button>
            <button
              type="button"
              onClick={() => setRole('ngo')}
              className={`py-2 rounded-md text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 ${
                role === 'ngo'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" /> NGO / Charity
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 text-xs text-red-300 bg-red-900/30 rounded-md border border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Organization Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={role === 'donor' ? 'e.g. Green Leaf Bistro' : 'e.g. Hope Community Shelter'}
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}

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
                className="w-full pl-10 pr-4 py-2 rounded-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {mode === 'register' && (
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
                  className="w-full pl-10 pr-4 py-2 rounded-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              </div>
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-md bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-md disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              'Processing...'
            ) : mode === 'login' ? (
              <><LogIn className="w-4 h-4" /> Sign In as {role === 'donor' ? 'Donor' : 'NGO'}</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Create {role === 'donor' ? 'Donor' : 'NGO'} Account</>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
