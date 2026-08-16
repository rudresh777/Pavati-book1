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
    const receiptNumber = searchParams.get('receiptNumber');

    const storage = getStorageProvider();
    await storage.init();

    if (receiptNumber) {
      const pavti = await storage.getPavtiByReceiptNumber(receiptNumber, mode);
      return NextResponse.json({ pavti });
    }

    const pavtis = await storage.getPavtis(mode);
    return NextResponse.json({ pavtis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
