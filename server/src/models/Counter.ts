import mongoose, { Schema, Document } from 'mongoose';

interface ICounter extends Document {
    name: string;
    value: number;
}

const counterSchema = new Schema<ICounter>({
    name: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
});

export const Counter = mongoose.model<ICounter>('Counter', counterSchema);
