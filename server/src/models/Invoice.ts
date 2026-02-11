import mongoose, { Schema, Document, Types } from 'mongoose';

// Invoice item interface
export interface IInvoiceItem {
    product: Types.ObjectId;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    lineTotal: number;
}

// Invoice status enum
export type InvoiceStatus = 'draft' | 'sent' | 'paid';

// Invoice document interface
export interface IInvoiceDocument extends Document {
    invoiceNumber: string;
    order: Types.ObjectId;
    customer: Types.ObjectId;
    customerName: string;

    // Billing info
    billTo: {
        businessName: string;
        attention: string;
        address: {
            street: string;
            city: string;
            state: string;
            zip: string;
        };
    };

    // Shipping/Compliance info
    shippingDate: Date;
    harvestDate: Date;
    harvestTime: string;
    harvestLocation: string;
    shipperCertification: string;
    departureTemperature: string;
    timeOnTruck: string;
    deliveredBy: string;

    // Line items
    items: IInvoiceItem[];

    // Totals
    subtotal: number;
    tax: number;
    total: number;

    // Status & tracking
    status: InvoiceStatus;
    pdfPath: string;
    emailSentAt: Date;
    emailSentTo: string[];

    // Payment tracking
    paidAt: Date;
    checkNumber: string;
    checkDate: Date;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        productName: {
            type: String,
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        pricePerUnit: {
            type: Number,
            required: true,
            min: 0,
        },
        lineTotal: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    { _id: false }
);

const invoiceSchema = new Schema<IInvoiceDocument>(
    {
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },
        order: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: true,
        },
        customerName: {
            type: String,
            required: true,
        },
        billTo: {
            businessName: { type: String, required: true },
            attention: { type: String, default: '' },
            address: {
                street: { type: String, default: '' },
                city: { type: String, default: '' },
                state: { type: String, default: 'NY' },
                zip: { type: String, default: '' },
            },
        },
        shippingDate: {
            type: Date,
            required: true,
        },
        harvestDate: {
            type: Date,
            required: true,
        },
        harvestTime: {
            type: String,
            required: true,
        },
        harvestLocation: {
            type: String,
            default: '',
        },
        shipperCertification: {
            type: String,
            default: 'NY27496SS',
        },
        departureTemperature: {
            type: String,
            required: true,
        },
        timeOnTruck: {
            type: String,
            required: true,
        },
        deliveredBy: {
            type: String,
            required: true,
        },
        items: {
            type: [invoiceItemSchema],
            required: true,
            validate: [(v: IInvoiceItem[]) => v.length > 0, 'Invoice must have at least one item'],
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        tax: {
            type: Number,
            default: 0,
            min: 0,
        },
        total: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['draft', 'sent', 'paid'],
            default: 'draft',
        },
        pdfPath: {
            type: String,
            default: '',
        },
        emailSentAt: {
            type: Date,
        },
        emailSentTo: {
            type: [String],
            default: [],
        },
        paidAt: {
            type: Date,
        },
        checkNumber: {
            type: String,
            default: '',
        },
        checkDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries (invoiceNumber already indexed via unique: true)
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ createdAt: -1 });

export const Invoice = mongoose.model<IInvoiceDocument>('Invoice', invoiceSchema);
