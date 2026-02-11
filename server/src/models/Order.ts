import mongoose, { Schema, Document, Types } from 'mongoose';

// Sub-document for order items
interface IOrderItem {
    product: Types.ObjectId;
    productName: string;
    quantity: number;
    pricePerUnit: number;
    lineTotal: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderSource = 'internal' | 'customer-portal';

export interface IOrderDocument extends Document {
    orderNumber: string;
    customer: Types.ObjectId;
    customerName: string;
    harvestLocation: string;
    items: IOrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: OrderStatus;
    orderSource: OrderSource;
    deliveryDate: Date;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
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
            min: [1, 'Quantity must be at least 1'],
        },
        pricePerUnit: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative'],
        },
        lineTotal: {
            type: Number,
            required: true,
        },
    },
    { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        customer: {
            type: Schema.Types.ObjectId,
            ref: 'Customer',
            required: [true, 'Customer is required'],
        },
        customerName: {
            type: String,
            required: true,
        },
        harvestLocation: {
            type: String,
            default: '',
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (items: IOrderItem[]) {
                    return items.length > 0;
                },
                message: 'Order must have at least one item',
            },
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
            enum: ['pending', 'confirmed', 'delivered', 'cancelled'],
            default: 'pending',
        },
        orderSource: {
            type: String,
            enum: ['internal', 'customer-portal'],
            default: 'internal',
        },
        deliveryDate: {
            type: Date,
            required: [true, 'Delivery date is required'],
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

// Indexes for faster queries (orderNumber index already created by unique: true)
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryDate: 1 });
orderSchema.index({ createdAt: -1 });

// Static method to generate next order number
orderSchema.statics.getNextOrderNumber = async function (): Promise<string> {
    const startNumber = parseInt(process.env.ORDER_NUMBER_START || '16000', 10);

    const lastOrder = await this.findOne()
        .sort({ orderNumber: -1 })
        .select('orderNumber')
        .lean();

    if (!lastOrder) {
        return String(startNumber + 1);
    }

    const lastNumber = parseInt(lastOrder.orderNumber, 10);
    return String(lastNumber + 1);
};

// Pre-save hook to calculate totals
orderSchema.pre('save', function (next) {
    // Calculate subtotal from items
    this.subtotal = this.items.reduce((sum, item) => sum + item.lineTotal, 0);

    // Calculate total (subtotal + tax)
    this.total = this.subtotal + this.tax;

    next();
});

// Interface for the model with static methods
interface IOrderModel extends mongoose.Model<IOrderDocument> {
    getNextOrderNumber(): Promise<string>;
}

export const Order = mongoose.model<IOrderDocument, IOrderModel>('Order', orderSchema);
