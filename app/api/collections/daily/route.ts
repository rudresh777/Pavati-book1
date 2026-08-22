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

    return NextResponse.json({
      success: true,
      role: session.role,
      todayCollection: fullSummary.todayCollection,
      yesterdayCollection: fullSummary.yesterdayCollection,
      dailyHistory: fullSummary.dailyHistory || [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
