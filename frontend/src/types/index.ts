export type UserRole = 'donor' | 'ngo';

export type ListingCategory = 'cooked' | 'bakery' | 'produce';

export type ListingStatus = 'available' | 'reserved' | 'collected' | 'expired';

export type ClaimStatus = 'active' | 'completed' | 'cancelled';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  organization_name: string;
  phone?: string;
  created_at: string;
}

export type StorageCondition = 'hot_holding' | 'refrigerated' | 'ambient';

export interface FoodListing {
  id: number;
  donor_id: number;
  title: string;
  description?: string;
  category: ListingCategory;
  quantity_kg: number;
  expires_at: string;
  status: ListingStatus;
  storage_condition?: StorageCondition;
  safety_temperature?: number;
  pickup_pin?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  created_at: string;
  donor?: User;
}

export interface Claim {
  id: number;
  listing_id: number;
  ngo_id: number;
  reserved_at: string;
  reservation_expires_at?: string;
  pickup_pin?: string;
  food_safety_acknowledged?: boolean;
  status: ClaimStatus;
  listing?: FoodListing;
  ngo?: User;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CreateListingData {
  title: string;
  description?: string;
  category: ListingCategory;
  quantity_kg: number;
  expires_at: string;
  storage_condition?: StorageCondition;
  safety_temperature?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
}
