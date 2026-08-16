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

export async function DELETE(
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
      return NextResponse.json({ error: 'देणगीदार आढळला नाही.' }, { status: 404 });
    }

    const result = await storage.deleteOrArchiveDonor(id, mode);

    await storage.addAuditLog({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: result.action === 'ARCHIVED' ? 'DONOR_ARCHIVED' : 'DONOR_DELETED',
      entityType: 'DONOR',
      entityId: id,
      details: `${result.action === 'ARCHIVED' ? 'Archived (financial history preserved)' : 'Permanently deleted'} donor ${donor.name} by ${session.name}.`,
      mode,
    });

    return NextResponse.json({
      success: true,
      action: result.action,
      message:
        result.action === 'ARCHIVED'
          ? 'देणगीदाराचा आर्थिक इतिहास असल्याने रेकॉर्ड सुरक्षितपणे निष्क्रिय (Archived) करण्यात आले.'
          : 'देणगीदाराचे रेकॉर्ड यशस्वीरीत्या हटवण्यात आले.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
