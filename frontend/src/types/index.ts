export type Role = "ADMIN" | "STAFF";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  position: number;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  price: string;
  cost?: string | null;
  stock: number;
  minStock: number;
  active: boolean;
  categoryId: string;
  category: Category;
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  errors?: unknown;
}
