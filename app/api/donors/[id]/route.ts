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

    const donor = await storage.getDonorById(id, mode);
    if (!donor) {
      return NextResponse.json({ error: 'Donor not found' }, { status: 404 });
    }

    const payments = await storage.getPaymentsByDonorId(id, mode);
    const allPavtis = await storage.getPavtis(mode);
    const pavtis = allPavtis.filter((p) => p.donorId === id);

    return NextResponse.json({ donor, payments, pavtis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
