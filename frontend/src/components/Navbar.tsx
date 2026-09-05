import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Utensils, HeartHandshake, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react';

interface NavbarProps {
  onOpenCreateModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateModal }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-zinc-900 text-white border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand */}
          <Link 
            to={user ? (user.role === 'donor' ? '/donor-dashboard' : '/ngo-feed') : '/'} 
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-sm bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white font-bold">
              <Utensils className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              ShareMeal
            </span>
          </Link>

          {/* Navigation Links */}
          {user && (
            <nav className="flex items-center space-x-2">
              {user.role === 'donor' && (
                <>
                  <Link
                    to="/donor-dashboard"
                    className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      location.pathname === '/donor-dashboard'
                        ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Donor Dashboard
                  </Link>
                  {onOpenCreateModal && (
                    <button
                      onClick={onOpenCreateModal}
                      className="px-3.5 py-1.5 rounded-sm text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Post Food Surplus
                    </button>
                  )}
                </>
              )}

              {user.role === 'ngo' && (
                <Link
                  to="/ngo-feed"
                  className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    location.pathname === '/ngo-feed'
                      ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  Available Feed
                </Link>
              )}
            </nav>
          )}

          {/* User Status / Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-semibold text-zinc-200">{user.organization_name}</span>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono font-semibold">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-sm transition-colors border border-zinc-700"
                >
                  Log In
                </Link>
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
