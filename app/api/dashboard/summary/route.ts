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

    const summary = await storage.getCollectionSummary(mode);
    const recentPayments = (await storage.getPayments(mode)).slice(0, 8);
    const pendingPayments = (await storage.getPendingPayments(mode)).slice(0, 5);

    return NextResponse.json({
      summary,
      recentPayments,
      pendingPayments,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
