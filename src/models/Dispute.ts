import mongoose, { Schema, Document } from 'mongoose';

export interface IDispute extends Document {
  transactionId: mongoose.Types.ObjectId;
  claimant: mongoose.Types.ObjectId;
  reason: string;
  status: string;
  createdAt: Date;
}

const DisputeSchema: Schema = new Schema({
  transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true },
  claimant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved', 'rejected'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);