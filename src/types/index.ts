// Type Definitions for Vintage Soccer Jersey Store

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUser {
  id: number;
  userId: number;
  role: string;
  permissions: Record<string, any>;
  createdAt: Date;
}

export interface Product {
  id: number;
  name: string;
  team: string;
  year: string;
  price: number;
  condition: 'Mint' | 'Excellent' | 'Good' | 'Fair';
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  description: string;
  sku: string;
  inventory: number;
  featured: boolean;
  images?: ProductImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  createdAt: Date;
}

export interface Address {
  id: number;
  userId: number;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product?: Product;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: number;
  userId: number;
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: Address;
  trackingNumber?: string;
  notes?: string;
  items?: OrderItem[];
  payment?: Payment;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId?: number;
  productSnapshot: Product;
  quantity: number;
  price: number;
  createdAt: Date;
}

export interface Payment {
  id: number;
  orderId: number;
  paymentMethod: 'stripe' | 'paypal' | 'square';
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  paymentDetails?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProductFilters {
  team?: string;
  year?: string;
  condition?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CheckoutRequest {
  cartItems: CartItem[];
  shippingAddress: Omit<Address, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
  paymentMethod: 'stripe' | 'paypal' | 'square';
  paymentDetails?: Record<string, any>;
}

export interface CreateProductRequest {
  name: string;
  team: string;
  year: string;
  price: number;
  condition: string;
  size: string;
  description: string;
  sku: string;
  inventory: number;
  featured?: boolean;
  images?: Array<{
    imageUrl: string;
    altText?: string;
    displayOrder: number;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
}

// Session and JWT Types
export interface SessionUser {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface JWTPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}
