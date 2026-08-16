import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { AppMode, PaymentStatus } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') as AppMode) || 'LIVE';

    const storage = getStorageProvider();
    await storage.init();

    const payment = await storage.getPaymentById(id, mode);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    const pavti = payment.status === 'PAID' ? await storage.getPavtiByPaymentId(id, mode) : null;

    return NextResponse.json({ payment, pavti });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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
    const { status, notes, mode = 'LIVE' } = body;

    const storage = getStorageProvider();
    await storage.init();

    const payment = await storage.getPaymentById(id, mode as AppMode);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Only allow updating notes or cancelling if not already paid
    if (status === 'CANCELLED') {
      if (session.role !== 'SUPER_ADMIN' && payment.status === 'PAID') {
        return NextResponse.json(
          { error: 'फक्त सुपर ॲडमिन जमा पावती रद्द करू शकतात.' },
          { status: 403 }
        );
      }
      payment.status = 'CANCELLED';
    }

    if (notes) {
      payment.notes = notes;
    }

    const updated = await storage.savePayment(payment, mode as AppMode);

    await storage.addAuditLog({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: 'PAYMENT_UPDATED',
      entityType: 'PAYMENT',
      entityId: id,
      details: `Payment ${id} status updated to ${payment.status} by ${session.name}.`,
      mode: mode as AppMode,
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
