import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { AppMode } from '@/types';

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
    const {
      status,
      donorName,
      donorMobile,
      donorAddress,
      expectedAmount,
      notes,
      date,
      mode = 'LIVE',
    } = body;

    const storage = getStorageProvider();
    await storage.init();

    const payment = await storage.getPaymentById(id, mode as AppMode);
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // 1. If cancelling
    if (status === 'CANCELLED') {
      if (session.role !== 'SUPER_ADMIN' && payment.status === 'PAID') {
        return NextResponse.json(
          { error: 'फक्त सुपर ॲडमिन जमा पावती रद्द करू शकतात.' },
          { status: 403 }
        );
      }
      const cancelled = await storage.cancelPendingPayment(id, mode as AppMode);
      return NextResponse.json({ success: true, payment: cancelled });
    }

    // 2. If editing pending payment
    if (payment.status === 'PENDING' || payment.status === 'PARTIALLY_PAID') {
      const numExpected = expectedAmount !== undefined ? Number(expectedAmount) : undefined;
      const updated = await storage.updatePendingPayment(
        id,
        {
          donorName,
          donorMobile,
          donorAddress,
          expectedAmount: numExpected,
          notes,
          date,
        },
        mode as AppMode
      );

      await storage.addAuditLog({
        userId: session.userId,
        userName: session.name,
        userRole: session.role,
        action: 'PENDING_PAYMENT_EDITED',
        entityType: 'PAYMENT',
        entityId: id,
        details: `Pending payment for ${updated.donorName} updated to ₹${updated.expectedAmount} by ${session.name}.`,
        mode: mode as AppMode,
      });

      return NextResponse.json({ success: true, payment: updated });
    }

    // 3. If updating paid payment notes
    if (notes !== undefined) {
      payment.notes = notes;
    }
    const saved = await storage.savePayment(payment, mode as AppMode);
    return NextResponse.json({ success: true, payment: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
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

    const result = await storage.deletePayment(id, mode, {
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    });

    return NextResponse.json({ success: true, deletedPayment: result.deletedPayment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
