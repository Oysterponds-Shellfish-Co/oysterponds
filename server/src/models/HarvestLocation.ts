import mongoose, { Schema, Document } from 'mongoose';

export interface IHarvestLocationDocument extends Document {
    code: string;
    name: string;
    active: boolean;
}

const harvestLocationSchema = new Schema<IHarvestLocationDocument>(
    {
        code: {
            type: String,
            required: [true, 'Location code is required'],
            unique: true,
            trim: true,
        },
        name: {
            type: String,
            required: [true, 'Location name is required'],
            trim: true,
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

export const HarvestLocation = mongoose.model<IHarvestLocationDocument>(
    'HarvestLocation',
    harvestLocationSchema
);
