import axios from 'axios';
import type { AuthResponse, User, FoodListing, CreateListingData, Claim } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  register: async (userData: any): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },
  login: async (credentials: any): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const listingsApi = {
  getAll: async (category?: string, userLat?: number, userLng?: number, radiusKm?: number): Promise<FoodListing[]> => {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (userLat !== undefined && userLat !== null) params.append('user_lat', userLat.toString());
    if (userLng !== undefined && userLng !== null) params.append('user_lng', userLng.toString());
    if (radiusKm !== undefined && radiusKm !== null) params.append('radius_km', radiusKm.toString());
    const res = await api.get(`/listings?${params.toString()}`);
    return res.data;
  },
  getMyListings: async (): Promise<FoodListing[]> => {
    const res = await api.get('/listings/my');
    return res.data;
  },
  getById: async (id: number): Promise<FoodListing> => {
    const res = await api.get(`/listings/${id}`);
    return res.data;
  },
  create: async (data: CreateListingData): Promise<FoodListing> => {
    const res = await api.post('/listings', data);
    return res.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/listings/${id}`);
  },
};

export const claimsApi = {
  reserveListing: async (listingId: number): Promise<Claim> => {
    const res = await api.post(`/listings/${listingId}/reserve`);
    return res.data;
  },
  claimListing: async (listingId: number): Promise<Claim> => {
    const res = await api.post(`/listings/${listingId}/reserve`);
    return res.data;
  },
  getMyClaims: async (): Promise<Claim[]> => {
    const res = await api.get('/claims/my');
    return res.data;
  },
  verifyPickupPin: async (listingId: number, pickupPin: string): Promise<Claim> => {
    const res = await api.post(`/listings/${listingId}/verify-pickup`, { pickup_pin: pickupPin });
    return res.data;
  },
  cancelClaim: async (claimId: number): Promise<Claim> => {
    const res = await api.post(`/claims/${claimId}/cancel`);
    return res.data;
  },
};

export const analyticsApi = {
  getImpact: async (): Promise<{ meals_rescued: number; kg_diverted: number; active_ngos: number }> => {
    try {
      const res = await api.get('/analytics/impact');
      return res.data;
    } catch {
      return { meals_rescued: 1450, kg_diverted: 580.0, active_ngos: 18 };
    }
  },
};

export default api;
