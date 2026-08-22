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

    const [expenseSummary, collectionSummary] = await Promise.all([
      storage.getExpenseSummary(mode, targetDate),
      storage.getCollectionSummary(mode),
    ]);

    const todayCollection = collectionSummary.todayCollection || 0;
    const totalCollection = collectionSummary.totalCollection || 0;

    const todayBalance = todayCollection - expenseSummary.todayExpense;
    const totalBalance = totalCollection - expenseSummary.totalExpense;

    return NextResponse.json({
      summary: {
        ...expenseSummary,
        todayCollection,
        totalCollection,
        todayBalance,
        totalBalance,
      },
    });
  } catch (error: any) {
    console.error('[API /api/expenses/summary GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
