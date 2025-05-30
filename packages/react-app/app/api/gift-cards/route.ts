import { NextResponse } from 'next/server';
import { generateRedemptionCode } from '@/lib/utils';
import connectDB from '@/lib/db';
import GiftCard from '@/models/GiftCard';
import { sendGiftCardEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const giftCard = await GiftCard.create(body);
    return NextResponse.json(giftCard);
  } catch (error: any) {
    console.error('Error creating gift card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create gift card' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      return NextResponse.json(
        { error: 'Redemption code is required' },
        { status: 400 }
      );
    }
    
    const giftCard = await GiftCard.findOne({ redemptionCode: code });
    
    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(giftCard);
  } catch (error: any) {
    console.error('Error fetching gift card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch gift card' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const body = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Redemption code is required' },
        { status: 400 }
      );
    }
    
    const giftCard = await GiftCard.findOneAndUpdate(
      { redemptionCode: code },
      body,
      { new: true }
    );
    
    if (!giftCard) {
      return NextResponse.json(
        { error: 'Gift card not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(giftCard);
  } catch (error: any) {
    console.error('Error updating gift card:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update gift card' },
      { status: 500 }
    );
  }
} 