import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { AppMode, PaymentMethod } from '@/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      receivedAmount,
      paymentMethod = 'CASH',
      transactionReference,
      notes,
      mode = 'LIVE',
    } = body;

    const numReceived = Number(receivedAmount);
    if (!numReceived || numReceived <= 0) {
      return NextResponse.json({ error: 'प्राप्त रक्कम ₹१ पेक्षा जास्त असावी.' }, { status: 400 });
    }

    const storage = getStorageProvider();
    await storage.init();

    const { payment, pavti } = await storage.markPaymentAsPaid(
      id,
      {
        receivedAmount: numReceived,
        paymentMethod: paymentMethod as PaymentMethod,
        transactionReference: transactionReference?.trim(),
        notes: notes?.trim(),
        hostId: session.userId,
        hostName: session.name,
      },
      mode as AppMode
    );

    return NextResponse.json({
      success: true,
      payment,
      pavti,
    });
  } catch (error: any) {
    console.error('Mark as paid error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
