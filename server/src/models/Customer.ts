import mongoose, { Schema, Document, Types } from 'mongoose';

// Sub-document for custom pricing
interface ICustomPricing {
    product: Types.ObjectId;
    price: number;
}

// Sub-document for address
interface IAddress {
    street: string;
    city: string;
    state: string;
    zip: string;
}

export interface ICustomerDocument extends Document {
    name: string;
    businessName: string;
    slug: string;
    billingAddress: IAddress;
    shippingAddress: IAddress;
    contactEmail: string;
    accountingEmail: string;
    additionalAccountingEmail: string;
    phone: string;
    accountingPerson: string;
    accountingPhone: string;
    contactPerson2: string;
    contactPerson2Phone: string;
    paymentAlias: string;
    paymentMethod: string;
    customPricing: ICustomPricing[];
    reminderEnabled: boolean;
    reminderDay: string;
    requiresShippingTag: boolean;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
    {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: 'NY' },
        zip: { type: String, default: '' },
    },
    { _id: false }
);

const customPricingSchema = new Schema<ICustomPricing>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative'],
        },
    },
    { _id: false }
);

const customerSchema = new Schema<ICustomerDocument>(
    {
        name: {
            type: String,
            trim: true,
            default: '',
        },
        businessName: {
            type: String,
            required: [true, 'Business name is required'],
            trim: true,
        },
        slug: {
            type: String,
            required: [true, 'Slug is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        billingAddress: {
            type: addressSchema,
            default: () => ({}),
        },
        shippingAddress: {
            type: addressSchema,
            default: () => ({}),
        },
        contactEmail: {
            type: String,
            lowercase: true,
            trim: true,
            default: '',
        },
        accountingEmail: {
            type: String,
            lowercase: true,
            trim: true,
            default: '',
        },
        additionalAccountingEmail: {
            type: String,
            lowercase: true,
            trim: true,
            default: '',
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        accountingPerson: {
            type: String,
            trim: true,
            default: '',
        },
        accountingPhone: {
            type: String,
            trim: true,
            default: '',
        },
        contactPerson2: {
            type: String,
            trim: true,
            default: '',
        },
        contactPerson2Phone: {
            type: String,
            trim: true,
            default: '',
        },
        paymentAlias: {
            type: String,
            trim: true,
            default: '',
        },
        paymentMethod: {
            type: String,
            trim: true,
            default: '',
        },
        customPricing: {
            type: [customPricingSchema],
            default: [],
        },
        reminderEnabled: {
            type: Boolean,
            default: false,
        },
        reminderDay: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            default: 'Monday',
        },
        requiresShippingTag: {
            type: Boolean,
            default: false,
        },
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster text search queries
customerSchema.index({ businessName: 'text', name: 'text' });

// Pre-save hook to generate slug if not provided
customerSchema.pre('save', function (next) {
    if (!this.slug && this.businessName) {
        this.slug = this.businessName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

export const Customer = mongoose.model<ICustomerDocument>('Customer', customerSchema);
