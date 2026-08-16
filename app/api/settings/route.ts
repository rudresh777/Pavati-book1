import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { MandalSettings } from '@/types';

export async function GET() {
  try {
    const storage = getStorageProvider();
    await storage.init();
    const settings = await storage.getSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Super Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Partial<MandalSettings>;
    const storage = getStorageProvider();
    await storage.init();

    const currentSettings = await storage.getSettings();
    const updatedSettings: MandalSettings = {
      ...currentSettings,
      ...body,
      updatedAt: new Date().toISOString(),
    };

    await storage.saveSettings(updatedSettings);

    await storage.addAuditLog({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: 'SETTINGS_UPDATED',
      entityType: 'SETTINGS',
      entityId: updatedSettings.id,
      details: `Mandal settings updated by ${session.name}.`,
      mode: 'LIVE',
    });

    return NextResponse.json({ success: true, settings: updatedSettings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
