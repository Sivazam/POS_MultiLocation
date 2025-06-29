export type UserRole = 'superadmin' | 'admin' | 'manager' | 'salesperson' | 'franchise_manager' | 'franchise_staff' | 'super_admin';

export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: UserRole;
  isActive: boolean;
  locationId?: string;
  franchiseId?: string;
  phone?: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, locationId?: string) => Promise<void>;
  register: (email: string, password: string, role: UserRole, franchiseId?: string, locationId?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export interface Location {
  id: string;
  name: string;
  storeName: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  description?: string;
  gstNumber?: string;
  isActive: boolean;
  franchiseId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationFormData {
  name: string;
  storeName: string;
  address: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  locationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  quantity: number;
  imageUrl?: string;
  locationId?: string;
  vendor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  address: string;
  gstNumber?: string;
  email?: string;
  locationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorFormData {
  name: string;
  phone: string;
  address: string;
  gstNumber?: string;
  email?: string;
}

export interface StockUpdate {
  id: string;
  productId: string;
  vendorId: string;
  quantity: number;
  invoiceNumber?: string;
  notes?: string;
  locationId?: string;
  createdAt: Date;
}

export interface StockUpdateFormData {
  productId: string;
  vendorId: string;
  quantity: number;
  invoiceNumber?: string;
  notes?: string;
  type: 'add' | 'reduce';
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  locationId?: string;
  createdAt: Date;
  createdBy: string;
}

export interface Receipt {
  sale: Sale;
  businessName: string;
  businessAddress: string;
  gstNumber: string;
  contactNumber: string;
  email: string;
}

export interface Purchase {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  vendor: string;
  invoiceNumber?: string;
  notes?: string;
  locationId?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface PurchaseFormData {
  productId: string;
  quantity: number;
  costPrice: number;
  vendor: string;
  invoiceNumber?: string;
  notes?: string;
}

export type ReturnType = 'sale' | 'purchase';

export interface Return {
  id: string;
  type: ReturnType;
  referenceId: string;
  items: ReturnItem[];
  reason: string;
  total: number;
  locationId?: string;
  createdAt: Date;
  createdBy?: string;
  refundMethod?: Sale['paymentMethod'];
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface ReturnItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface ReturnFormData {
  type: ReturnType;
  referenceId: string;
  items: ReturnItem[];
  reason: string;
  refundMethod?: Sale['paymentMethod'];
  total?: number; // Optional total override
}

export type FranchisePlan = 'basic' | 'premium' | 'enterprise';

export interface FranchiseStoredFeatures {
  returns: boolean;
  inventory: boolean;
  reports: boolean;
  multiLocation: boolean;
  apiAccess: boolean;
  api?: boolean; // Legacy support
}

export interface Franchise {
  id: string;
  name: string;
  businessName?: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  panNumber?: string;
  licenseNumber?: string;
  isActive: boolean;
  isApproved: boolean;
  plan?: FranchisePlan;
  subscriptionPlan?: FranchisePlan;
  subscriptionStatus?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  monthlyFee?: number;
  commissionRate?: number;
  features?: FranchiseStoredFeatures;
  settings?: {
    maxUsers?: number;
    maxProducts?: number;
    maxLocations?: number;
    features?: FranchiseStoredFeatures;
  };
  branding?: {
    businessName?: string;
    primaryColor?: string;
    tagline?: string;
    receiptFooter?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
}

export interface FranchiseFormData {
  name: string;
  businessName?: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  gstNumber?: string;
  plan?: FranchisePlan;
  commissionRate?: number;
  features?: FranchiseStoredFeatures;
}