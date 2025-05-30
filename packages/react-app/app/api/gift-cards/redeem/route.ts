import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GiftCard from '@/models/GiftCard';

export async function POST(req: Request) {
  try {
    const { code, redeemer } = await req.json();

    if (!code || !redeemer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and update the gift card
    const giftCard = await GiftCard.findOneAndUpdate(
      {
        redemptionCode: code,
        status: 'pending',
      },
      {
        status: 'redeemed',
        redeemedAt: new Date(),
        redeemedBy: redeemer,
      },
      { new: true }
    );

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Invalid or already redeemed gift card' },
        { status: 400 }
      );
    }

    return NextResponse.json(giftCard);
  } catch (error) {
    console.error('Error redeeming gift card:', error);
    return NextResponse.json(
      { error: 'Failed to redeem gift card' },
      { status: 500 }
    );
  }
} 