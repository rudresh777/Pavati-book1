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
    const targetDate = searchParams.get('date') || undefined;

    const storage = getStorageProvider();
    await storage.init();

    const fullSummary = await (storage as any).getCollectionSummary(mode, targetDate);
    const isSuperAdmin = session.role === 'SUPER_ADMIN';

    // SERVER-SIDE PRIVACY ENFORCEMENT:
    // - SUPER_ADMIN receives overall lifetime totals, Today's Collection, and Collection History.
    // - HOST receives Today's Collection and Collection History (without exposing lifetime totals).
    const summary = isSuperAdmin
      ? fullSummary
      : {
          todayCollection: fullSummary.todayCollection,
          yesterdayCollection: fullSummary.yesterdayCollection,
          dailyHistory: fullSummary.dailyHistory || [],
          pendingAmount: fullSummary.pendingAmount,
          pendingDonorsCount: fullSummary.pendingDonorsCount,
          paidPavtisCount: fullSummary.paidPavtisCount,
          partiallyPaidAmount: fullSummary.partiallyPaidAmount,
          mode: fullSummary.mode,
          // Explicitly omit / nullify lifetime financial totals for non-super-admins
          totalCollection: null,
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
