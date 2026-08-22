import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'अनधिकृत: फक्त सुपर ॲडमिन पासवर्ड व्यवस्थापन पाहू शकतात (Unauthorized: Only Super Admin can access password management).' },
        { status: 403 }
      );
    }

    const storage = getStorageProvider();
    await storage.init();

    const allUsers = await storage.getUsers();

    // Sanitize user list: explicitly exclude any password hashes
    const sanitizedUsers = allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      active: u.active,
      createdAt: u.createdAt,
    }));

    const adminUsers = sanitizedUsers.filter((u) => u.role === 'HOST');
    const superAdminUsers = sanitizedUsers.filter((u) => u.role === 'SUPER_ADMIN');

    return NextResponse.json({
      success: true,
      users: sanitizedUsers,
      adminUsers,
      superAdminUsers,
    });
  } catch (error: any) {
    console.error('[API /api/settings/passwords GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'अनधिकृत: फक्त सुपर ॲडमिन पासवर्ड बदलू शकतात (Unauthorized: Only Super Admin can change passwords).' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'वापरकर्ता खाते निवडणे आवश्यक आहे (Please select an account).' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return NextResponse.json(
        { error: 'पासवर्ड किमान ६ अक्षरांचा असावा (New password must be at least 6 characters).' },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    await storage.init();

    const targetUser = await storage.getUserById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { error: 'निवडलेले वापरकर्ता खाते सापडले नाही (Selected account not found).' },
        { status: 404 }
      );
    }

    await storage.updateUserPassword(userId, newPassword.trim(), {
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    });

    const isHost = targetUser.role === 'HOST';
    const message = isHost
      ? 'Admin password changed successfully. (ॲडमिन पासवर्ड यशस्वीरित्या बदलला आहे.)'
      : 'Super Admin password changed successfully. (सुपर ॲडमिन पासवर्ड यशस्वीरित्या बदलला आहे.)';

    return NextResponse.json({
      success: true,
      message,
      targetUserId: targetUser.id,
      targetRole: targetUser.role,
    });
  } catch (error: any) {
    console.error('[API /api/settings/passwords POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
