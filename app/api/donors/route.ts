import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { AppMode, Donor } from '@/types';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') as AppMode) || 'LIVE';
    const query = searchParams.get('q') || '';

    const storage = getStorageProvider();
    await storage.init();

    let donors: Donor[];
    if (query) {
      donors = await storage.searchDonors(query, mode);
    } else {
      donors = await storage.getDonors(mode);
    }

    return NextResponse.json({ donors });
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
    const { id, name, mobile, address, notes, mode = 'LIVE' } = body;

    if (!name) {
      return NextResponse.json({ error: 'देणगीदाराचे नाव आवश्यक आहे.' }, { status: 400 });
    }

    const storage = getStorageProvider();
    await storage.init();

    const existingDonor = id ? await storage.getDonorById(id, mode as AppMode) : null;

    const donor: Donor = {
      id: id || `donor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      mobile: mobile?.trim() || '',
      address: address?.trim() || '',
      notes: notes?.trim() || '',
      totalContributed: existingDonor?.totalContributed || 0,
      pavtiCount: existingDonor?.pavtiCount || 0,
      lastPaymentDate: existingDonor?.lastPaymentDate,
      mode: mode as AppMode,
      createdAt: existingDonor?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedDonor = await storage.saveDonor(donor, mode as AppMode);

    return NextResponse.json({ success: true, donor: savedDonor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
