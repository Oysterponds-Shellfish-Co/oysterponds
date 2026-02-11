// Shared types for Oysterponds Invoice System

export interface IAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
}

export interface ICustomPricing {
    product: string | IProduct;
    price: number;
}

export interface IProduct {
    _id: string;
    name: string;
    description: string;
    basePrice: number;
    unit: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ICustomer {
    _id: string;
    name: string;
    businessName: string;
    slug: string;
    billingAddress: IAddress;
    shippingAddress: IAddress;
    contactEmail: string;
    accountingEmail: string;
    additionalAccountingEmail?: string;
    phone: string;
    accountingPerson?: string;
    accountingPhone?: string;
    contactPerson2?: string;
    contactPerson2Phone?: string;
    paymentAlias?: string;
    paymentMethod?: string;
    customPricing: ICustomPricing[];
    reminderEnabled: boolean;
    reminderDay: string;
    requiresShippingTag: boolean;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IHarvestLocation {
    _id: string;
    code: string;
    name: string;
    active: boolean;
}

export interface IOrderItem {
    product: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    lineTotal: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderSource = 'internal' | 'customer-portal';

export interface IOrder {
    _id: string;
    orderNumber: string;
    customer: string | ICustomer;
    customerName: string;
    harvestLocation?: string;
    items: IOrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: OrderStatus;
    orderSource: OrderSource;
    deliveryDate: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
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

export interface PaginatedResponse<T> {
    orders: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

// Customer pricing for order form
export interface ICustomerProductPricing {
    productId: string;
    productName: string;
    unit: string;
    basePrice: number;
    price: number;
    hasCustomPrice: boolean;
}

// Order stats
export interface IOrderStats {
    totalOrders: number;
    pendingOrders: number;
    todayOrders: number;
    weeklyTotal: number;
    weeklyCount: number;
}

// Form types
export interface CreateOrderForm {
    customer: string;
    harvestLocation?: string;
    items: {
        product: string;
        quantity: number;
        pricePerUnit: number;
    }[];
    deliveryDate: string;
    notes?: string;
}

export interface CreateCustomerForm {
    businessName: string;
    name?: string;
    slug?: string;
    billingAddress?: IAddress;
    shippingAddress?: IAddress;
    contactEmail?: string;
    accountingEmail?: string;
    additionalAccountingEmail?: string;
    phone?: string;
    accountingPerson?: string;
    accountingPhone?: string;
    contactPerson2?: string;
    contactPerson2Phone?: string;
    paymentAlias?: string;
    paymentMethod?: string;
    customPricing?: { product: string; price: number }[];
    reminderEnabled?: boolean;
    reminderDay?: string;
    requiresShippingTag?: boolean;
    notes?: string;
}

export interface PublicOrderForm {
    customerSlug: string;
    harvestLocation?: string;
    items: {
        product: string;
        quantity: number;
    }[];
    deliveryDate: string;
    notes?: string;
}

// Invoice Types
export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface IInvoiceItem {
    product: string;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    lineTotal: number;
}

export interface IInvoice {
    _id: string;
    invoiceNumber: string;
    order: string | IOrder;
    customer: string | ICustomer;
    customerName: string;
    billTo: {
        businessName: string;
        attention: string;
        address: IAddress;
    };
    shippingDate: string;
    harvestDate: string;
    harvestTime: string;
    harvestLocation: string;
    shipperCertification: string;
    departureTemperature: string;
    timeOnTruck: string;
    deliveredBy: string;
    items: IInvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: InvoiceStatus;
    pdfPath: string;
    emailSentAt: string;
    emailSentTo: string[];
    paidAt?: string;
    checkNumber?: string;
    checkDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateInvoiceForm {
    orderId: string;
    shippingDate?: string;
    harvestDate: string;
    harvestTime: string;
    harvestLocation?: string;
    departureTemperature: string;
    timeOnTruck: string;
    deliveredBy: string;
}

export interface CompanyInfo {
    name: string;
    address: string;
    phone: string;
    website: string;
    shipperCertification: string;
    remittance: {
        payableTo: string;
        mailingAddress: string;
        achInquiries: string;
    };
    internalEmail: string;
    drivers: string[];
}
