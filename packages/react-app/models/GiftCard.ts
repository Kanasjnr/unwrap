import mongoose from 'mongoose';

export interface IGiftCard {
  redemptionCode: string;
  codeHash: string;
  amount: string;
  blockchainAmount?: string;
  sender: string;
  creator: string;
  recipientEmail: string;
  message?: string;
  status: 'pending' | 'redeemed' | 'expired';
  createdAt: Date;
  redeemedAt?: Date;
  redeemedBy?: string;
  template?: string;
  // Blockchain specific fields
  blockNumber?: number;
  transactionHash?: string;
  redemptionBlockNumber?: number;
  redemptionTransactionHash?: string;
  valid?: boolean;
}

const giftCardSchema = new mongoose.Schema<IGiftCard>({
  redemptionCode: {
    type: String,
    required: true,
    unique: true,
  },
  codeHash: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: String,
    required: true,
  },
  blockchainAmount: {
    type: String,
  },
  sender: {
    type: String,
    required: true,
  },
  creator: {
    type: String,
    required: true,
  },
  recipientEmail: {
    type: String,
    required: true,
  },
  message: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'redeemed', 'expired'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  redeemedAt: {
    type: Date,
  },
  redeemedBy: {
    type: String,
  },
  template: {
    type: String,
  },
  // Blockchain specific fields
  blockNumber: {
    type: Number,
  },
  transactionHash: {
    type: String,
  },
  redemptionBlockNumber: {
    type: Number,
  },
  redemptionTransactionHash: {
    type: String,
  },
  valid: {
    type: Boolean,
  },
});

// Add indexes for common queries
giftCardSchema.index({ recipientEmail: 1 });
giftCardSchema.index({ status: 1 });
giftCardSchema.index({ blockNumber: 1 });

// Add TTL index to automatically expire gift cards after 30 days
giftCardSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.models.GiftCard || mongoose.model<IGiftCard>('GiftCard', giftCardSchema); 