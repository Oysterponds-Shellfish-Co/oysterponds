import mongoose, { Schema, Document } from 'mongoose';

export interface IProductDocument extends Document {
    name: string;
    description: string;
    basePrice: number;
    unit: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema = new Schema<IProductDocument>(
    {
        name: {
            type: String,
            required: [true, 'Product name is required'],
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            default: '',
        },
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
            min: [0, 'Price cannot be negative'],
            default: 0.80,
        },
        unit: {
            type: String,
            required: [true, 'Unit is required'],
            default: 'oyster',
            enum: ['oyster', 'dozen', 'piece', 'pound'],
        },
        active: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
productSchema.index({ active: 1 });
productSchema.index({ name: 'text' });

export const Product = mongoose.model<IProductDocument>('Product', productSchema);
