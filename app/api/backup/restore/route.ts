import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const backupData = await request.json();
    const storage = getStorageProvider();
    await storage.init();

    await storage.importBackup(backupData);

    return NextResponse.json({
      success: true,
      message: 'डेटा बॅकअप यशस्वीरीत्या रिस्टोअर झाला आहे.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
