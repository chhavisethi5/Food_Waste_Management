import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DonorDashboardPage } from './pages/DonorDashboardPage';
import { NgoFeedPage } from './pages/NgoFeedPage';
import { CreateListingModal } from './components/CreateListingModal';
import { listingsApi } from './api';
import type { CreateListingData } from './types';

const ProtectedDonorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-zinc-900 text-zinc-300 flex items-center justify-center text-xs font-mono">Initializing system...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'donor') return <Navigate to="/ngo-feed" replace />;
  return <>{children}</>;
};

const ProtectedNgoRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-zinc-900 text-zinc-300 flex items-center justify-center text-xs font-mono">Initializing system...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ngo') return <Navigate to="/donor-dashboard" replace />;
  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleGlobalCreateListing = async (data: CreateListingData) => {
    await listingsApi.create(data);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans text-zinc-900">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/*"
          element={
            <>
              <Navbar onOpenCreateModal={() => setIsCreateModalOpen(true)} />
              <main className="flex-1">
                <Routes>
                  <Route path="login" element={<LoginPage />} />
                  <Route
                    path="donor-dashboard"
                    element={
                      <ProtectedDonorRoute>
                        <DonorDashboardPage />
                      </ProtectedDonorRoute>
                    }
                  />
                  <Route
                    path="ngo-feed"
                    element={
                      <ProtectedNgoRoute>
                        <NgoFeedPage />
                      </ProtectedNgoRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <footer className="bg-zinc-900 text-zinc-400 border-t border-zinc-800 text-xs font-mono py-5">
                <div className="max-w-7xl mx-auto px-4 text-center space-y-1">
                  <p>© 2026 ShareMeal. Commercial Food Recovery Network.</p>
                </div>
              </footer>
            </>
          }
        />
      </Routes>

      {user && user.role === 'donor' && (
        <CreateListingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleGlobalCreateListing}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
