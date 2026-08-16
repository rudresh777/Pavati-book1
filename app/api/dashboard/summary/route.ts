import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { AppMode } from '@/types';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') as AppMode) || 'LIVE';

    const storage = getStorageProvider();
    await storage.init();

    const fullSummary = await storage.getCollectionSummary(mode);
    const isSuperAdmin = session.role === 'SUPER_ADMIN';

    // STRICT SERVER-SIDE PRIVACY ENFORCEMENT:
    // Only SUPER_ADMIN receives total collections, today's collection, and payment mode breakdowns.
    // HOST receives only operational metrics (pending amount, pending count, paid count).
    const summary = isSuperAdmin
      ? fullSummary
      : {
          pendingAmount: fullSummary.pendingAmount,
          pendingDonorsCount: fullSummary.pendingDonorsCount,
          paidPavtisCount: fullSummary.paidPavtisCount,
          mode: fullSummary.mode,
          // Explicitly omit / nullify financial totals
          totalCollection: null,
          todayCollection: null,
          yesterdayCollection: null,
          thisWeekCollection: null,
          thisMonthCollection: null,
          currentYearCollection: null,
          cashCollection: null,
          upiCollection: null,
          otherCollection: null,
        };

    const allPayments = await storage.getPayments(mode);
    const recentPayments = allPayments.slice(0, 8);
    const pendingPayments = (await storage.getPendingPayments(mode)).slice(0, 5);

    return NextResponse.json({
      role: session.role,
      summary,
      recentPayments,
      pendingPayments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
