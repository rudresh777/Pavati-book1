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
    const mobile = searchParams.get('mobile')?.trim() || '';
    const name = searchParams.get('name')?.trim() || '';

    if (!mobile && !name) {
      return NextResponse.json({ exists: false, donor: null, recentPavtis: [] });
    }

    const storage = getStorageProvider();
    await storage.init();

    const donors = await storage.getDonors(mode);
    const cleanMobile = mobile.replace(/\D/g, '');

    // Find donor by exact 10-digit mobile or exact name match
    let match = null;
    if (cleanMobile.length >= 10) {
      match = donors.find(
        (d) => d.mobile.replace(/\D/g, '') === cleanMobile && !d.isArchived
      );
    }

    if (!match && name.length >= 3) {
      match = donors.find(
        (d) => d.name.trim().toLowerCase() === name.toLowerCase() && !d.isArchived
      );
    }

    if (!match) {
      return NextResponse.json({ exists: false, donor: null, recentPavtis: [] });
    }

    // Fetch recent pavtis for this donor
    const allPavtis = await storage.getPavtis(mode);
    const donorPavtis = allPavtis
      .filter((p) => p.donorId === match!.id)
      .sort((a, b) => new Date(b.generatedAt || b.date).getTime() - new Date(a.generatedAt || a.date).getTime())
      .slice(0, 3);

    return NextResponse.json({
      exists: true,
      donor: match,
      recentPavtis: donorPavtis,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
