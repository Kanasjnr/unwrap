import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GiftCard from '@/models/GiftCard';
import { sendGiftCardEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Missing redemption code' },
        { status: 400 }
      );
    }

    await connectDB();

    const giftCard = await GiftCard.findOne({
      redemptionCode: code,
      status: 'pending',
    });

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Invalid or already redeemed gift card' },
        { status: 400 }
      );
    }

    // Resend email
    try {
      await sendGiftCardEmail({
        to: giftCard.recipientEmail,
        redemptionCode: giftCard.redemptionCode,
        amount: giftCard.amount,
        sender: giftCard.sender,
        message: giftCard.message,
        template: giftCard.template,
      });

      return NextResponse.json({ message: 'Email resent successfully' });
    } catch (error) {
      console.error('Error resending email:', error);
      return NextResponse.json(
        { error: 'Failed to resend email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error resending gift card email:', error);
    return NextResponse.json(
      { error: 'Failed to resend gift card email' },
      { status: 500 }
    );
  }
} 