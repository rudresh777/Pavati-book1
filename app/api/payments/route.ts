import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { AppMode, Payment, PaymentStatus, PaymentMethod, Pavti, Donor } from '@/types';
import { numberToWordsMarathi, numberToWordsEnglish } from '@/lib/utils/number-to-words';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') as AppMode) || 'LIVE';
    const status = searchParams.get('status') as PaymentStatus | null;
    const paymentMethod = searchParams.get('method') as PaymentMethod | null;
    const donorId = searchParams.get('donorId');

    const storage = getStorageProvider();
    await storage.init();

    let payments = await storage.getPayments(mode);

    if (status) {
      if (status === 'PENDING' || status === 'DUE') {
        payments = payments.filter((p) => p.status === 'PENDING' || p.status === 'DUE');
      } else {
        payments = payments.filter((p) => p.status === status);
      }
    }
    if (paymentMethod) {
      payments = payments.filter((p) => p.paymentMethod === paymentMethod);
    }
    if (donorId) {
      payments = payments.filter((p) => p.donorId === donorId);
    }

    return NextResponse.json({ payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      donorName,
      donorMobile,
      donorAddress,
      donorId,
      amount,
      expectedAmount,
      status = 'PAID',
      paymentMethod = 'CASH',
      transactionReference,
      notes,
      mode = 'LIVE',
    } = body;

    if (!donorName?.trim()) {
      return NextResponse.json({ error: 'देणगीदाराचे नाव आवश्यक आहे.' }, { status: 400 });
    }

    const numAmount = Number(amount) || 0;
    const numExpected = Number(expectedAmount) || numAmount;

    if (status === 'PAID' && numAmount <= 0) {
      return NextResponse.json({ error: 'पावतीसाठी रक्कम ₹१ पेक्षा जास्त असावी.' }, { status: 400 });
    }
    if ((status === 'DUE' || status === 'PENDING') && numExpected <= 0) {
      return NextResponse.json({ error: 'बाकी पावतीसाठी अपेक्षित रक्कम ₹१ पेक्षा जास्त असावी.' }, { status: 400 });
    }

    const storage = getStorageProvider();
    await storage.init();

    // 1. Ensure or create Donor record
    let finalDonorId = donorId;
    if (!finalDonorId) {
      // Check if donor with same mobile exists
      if (donorMobile?.trim()) {
        const existing = await storage.getDonorByMobile(donorMobile.trim(), mode as AppMode);
        if (existing) {
          finalDonorId = existing.id;
        }
      }

      if (!finalDonorId) {
        const newDonor: Donor = {
          id: `donor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: donorName.trim(),
          mobile: donorMobile?.trim() || '',
          address: donorAddress?.trim() || '',
          totalContributed: 0,
          pavtiCount: 0,
          mode: mode as AppMode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const saved = await storage.saveDonor(newDonor, mode as AppMode);
        finalDonorId = saved.id;
      }
    }

    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const today = new Date().toISOString().split('T')[0];

    // 2. Handle PAID payment
    if (status === 'PAID') {
      // Assign atomic official receipt number
      const { formatted: formattedReceiptNumber, numeric: nextNumber } =
        await storage.getNextReceiptNumber(mode as AppMode);

      const payment: Payment = {
        id: paymentId,
        receiptNumber: formattedReceiptNumber,
        numericReceiptNumber: nextNumber,
        donorId: finalDonorId,
        donorName: donorName.trim(),
        donorMobile: donorMobile?.trim() || '',
        donorAddress: donorAddress?.trim() || '',
        expectedAmount: numExpected,
        receivedAmount: numAmount,
        remainingAmount: Math.max(0, numExpected - numAmount),
        status: 'PAID',
        paymentMethod: paymentMethod as PaymentMethod,
        transactionReference: transactionReference?.trim() || '',
        date: today,
        hostId: session.userId,
        hostName: session.name,
        notes: notes?.trim() || '',
        mode: mode as AppMode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await storage.savePayment(payment, mode as AppMode);

      // Create Pavti Record
      const pavti: Pavti = {
        id: `pavti-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        receiptNumber: formattedReceiptNumber,
        numericReceiptNumber: nextNumber,
        paymentId: payment.id,
        donorId: finalDonorId,
        donorName: donorName.trim(),
        donorMobile: donorMobile?.trim() || '',
        donorAddress: donorAddress?.trim() || '',
        amount: numAmount,
        amountInWordsMarathi: numberToWordsMarathi(numAmount),
        amountInWordsEnglish: numberToWordsEnglish(numAmount),
        paymentMethod: paymentMethod as PaymentMethod,
        status: 'PAID',
        transactionReference: transactionReference?.trim() || '',
        date: today,
        hostName: session.name,
        mode: mode as AppMode,
        generatedAt: new Date().toISOString(),
      };

      await storage.savePavti(pavti, mode as AppMode);

      // Audit Log
      await storage.addAuditLog({
        userId: session.userId,
        userName: session.name,
        userRole: session.role,
        action: 'PAVTI_GENERATED',
        entityType: 'PAVTI',
        entityId: pavti.id,
        details: `Generated Pavti #${formattedReceiptNumber} (₹${numAmount}) for ${donorName}.`,
        mode: mode as AppMode,
      });

      return NextResponse.json({
        success: true,
        payment,
        pavti,
      });
    }

    // 3. Handle DUE (or PENDING) payment
    // IMPORTANT: Due payments do NOT consume an official receipt number or add to collection
    const duePayment: Payment = {
      id: paymentId,
      receiptNumber: undefined,
      numericReceiptNumber: undefined,
      donorId: finalDonorId,
      donorName: donorName.trim(),
      donorMobile: donorMobile?.trim() || '',
      donorAddress: donorAddress?.trim() || '',
      expectedAmount: numExpected,
      receivedAmount: 0,
      remainingAmount: numExpected,
      status: 'DUE',
      paymentMethod: paymentMethod as PaymentMethod,
      transactionReference: transactionReference?.trim() || '',
      date: today,
      hostId: session.userId,
      hostName: session.name,
      notes: notes?.trim() || '',
      mode: mode as AppMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storage.savePayment(duePayment, mode as AppMode);

    // Create Due Pavti Record (Same design, status DUE, no numeric receipt number)
    const duePavti: Pavti = {
      id: `pavti-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber: '',
      paymentId: duePayment.id,
      donorId: finalDonorId,
      donorName: donorName.trim(),
      donorMobile: donorMobile?.trim() || '',
      donorAddress: donorAddress?.trim() || '',
      amount: numExpected,
      amountInWordsMarathi: numberToWordsMarathi(numExpected),
      amountInWordsEnglish: numberToWordsEnglish(numExpected),
      paymentMethod: paymentMethod as PaymentMethod,
      status: 'DUE',
      transactionReference: transactionReference?.trim() || '',
      date: today,
      hostName: session.name,
      mode: mode as AppMode,
      generatedAt: new Date().toISOString(),
    };

    await storage.savePavti(duePavti, mode as AppMode);

    await storage.addAuditLog({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: 'DUE_PAVTI_CREATED',
      entityType: 'PAYMENT',
      entityId: duePayment.id,
      details: `Generated Due Pavti (बाकी) for ${donorName} (₹${numExpected}).`,
      mode: mode as AppMode,
    });

    return NextResponse.json({
      success: true,
      payment: duePayment,
      pavti: duePavti,
    });
  } catch (error: any) {
    console.error('Payment creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
