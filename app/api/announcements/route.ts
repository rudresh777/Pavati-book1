import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { Announcement } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const onlyActive = searchParams.get('active') === 'true';

    const storage = getStorageProvider();
    await storage.init();

    const announcements = await storage.getAnnouncements(onlyActive);
    return NextResponse.json({ announcements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      titleMarathi,
      titleEnglish,
      contentMarathi,
      contentEnglish,
      date,
      active = true,
      priority = 'NORMAL',
      eventDate,
      venue,
    } = body;

    if (!titleMarathi || !contentMarathi) {
      return NextResponse.json(
        { error: 'शीर्षक आणि मजकूर आवश्यक आहे.' },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    await storage.init();

    const announcement: Announcement = {
      id: id || `ann-${Date.now()}`,
      titleMarathi: titleMarathi.trim(),
      titleEnglish: titleEnglish?.trim() || '',
      contentMarathi: contentMarathi.trim(),
      contentEnglish: contentEnglish?.trim() || '',
      date: date || new Date().toISOString().split('T')[0],
      active,
      priority,
      eventDate: eventDate || undefined,
      venue: venue?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await storage.saveAnnouncement(announcement);

    await storage.addAuditLog({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: id ? 'ANNOUNCEMENT_UPDATED' : 'ANNOUNCEMENT_CREATED',
      entityType: 'ANNOUNCEMENT',
      entityId: saved.id,
      details: `Announcement "${saved.titleMarathi}" ${id ? 'updated' : 'published'}.`,
      mode: 'LIVE',
    });

    return NextResponse.json({ success: true, announcement: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const storage = getStorageProvider();
    await storage.init();

    await storage.deleteAnnouncement(id);

    await storage.addAuditLog({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: 'ANNOUNCEMENT_DELETED',
      entityType: 'ANNOUNCEMENT',
      entityId: id,
      details: `Announcement ${id} deleted by ${session.name}.`,
      mode: 'LIVE',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
