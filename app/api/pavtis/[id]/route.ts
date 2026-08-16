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

    // Check by pavti ID or receiptNumber
    let pavti = await storage.getPavtiById(id, mode);
    if (!pavti) {
      pavti = await storage.getPavtiByReceiptNumber(id, mode);
    }

    if (!pavti) {
      return NextResponse.json({ error: 'Pavti not found' }, { status: 404 });
    }

    const settings = await storage.getSettings();

    return NextResponse.json({ pavti, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
