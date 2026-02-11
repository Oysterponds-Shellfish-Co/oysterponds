// Shared types for the Oysterponds Invoice System

export interface ICustomPricing {
    product: string; // Product ID reference
    price: number;
}

export interface IAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
}

export interface ICustomer {
    _id?: string;
    name: string;
    businessName: string;
    slug: string;
    billingAddress: IAddress;
    shippingAddress: IAddress;
    contactEmail: string;
    accountingEmail: string;
    phone: string;
    customPricing: ICustomPricing[];
    reminderEnabled: boolean;
    reminderDay: string;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IProduct {
    _id?: string;
    name: string;
    description: string;
    basePrice: number;
    unit: string;
    active: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IHarvestLocation {
    _id?: string;
    code: string;
    name: string;
    active: boolean;
}

export interface IOrderItem {
    product: string; // Product ID
    productName: string;
    quantity: number;
    pricePerUnit: number;
    lineTotal: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderSource = 'internal' | 'customer-portal';

export interface IOrder {
    _id?: string;
    orderNumber: string;
    customer: string; // Customer ID
    customerName: string;
    items: IOrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: OrderStatus;
    orderSource: OrderSource;
    deliveryDate: Date;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    errors?: ValidationError[];
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
