import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  amount: number;
  asset: string;
  type: string;
  fee: number;
  status: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  asset: { type: String, required: true },
  type: { type: String, required: true },
  fee: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'completed', 'disputed'], default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);