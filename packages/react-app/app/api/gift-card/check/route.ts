import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GiftCard from '@/models/GiftCard';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Redemption code is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Find the gift card in MongoDB
    const giftCard = await GiftCard.findOne({ redemptionCode: code });
    
    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found in database' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      exists: true,
      status: giftCard.status,
      amount: giftCard.amount,
      codeHash: giftCard.codeHash,
      createdAt: giftCard.createdAt,
      redeemedAt: giftCard.redeemedAt,
      redeemedBy: giftCard.redeemedBy,
      transactionHash: giftCard.transactionHash,
      redemptionTransactionHash: giftCard.redemptionTransactionHash
    });
  } catch (error) {
    console.error('Error checking gift card:', error);
    return NextResponse.json(
      { error: 'Failed to check gift card' },
      { status: 500 }
    );
  }
} 