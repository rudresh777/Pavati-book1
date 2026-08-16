import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { User } from '@/types';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const storage = getStorageProvider();
    await storage.init();
    const users = await storage.getUsers();

    // Sanitize password hashes from response
    const sanitized = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      active: u.active,
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ users: sanitized });
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
    const { id, name, email, password, role = 'HOST', phone, active = true } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'नाव आणि ईमेल आवश्यक आहे.' }, { status: 400 });
    }

    const storage = getStorageProvider();
    await storage.init();

    const existingUser = id ? await storage.getUserById(id) : await storage.getUserByEmail(email);

    let passwordHash = existingUser?.passwordHash || '';
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'पासवर्ड किमान ६ अक्षरांचा असावा.' }, { status: 400 });
      }
      passwordHash = await bcrypt.hash(password, 10);
    } else if (!existingUser) {
      return NextResponse.json({ error: 'नवीन वापरकर्त्यासाठी पासवर्ड आवश्यक आहे.' }, { status: 400 });
    }

    const user: User = {
      id: id || `user-${Date.now()}`,
      name,
      email: email.trim().toLowerCase(),
      passwordHash,
      role,
      phone,
      active,
      createdAt: existingUser?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storage.saveUser(user);

    await storage.addAuditLog({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: id ? 'USER_UPDATED' : 'USER_CREATED',
      entityType: 'USER',
      entityId: user.id,
      details: `${user.role} account ${id ? 'updated' : 'created'} for ${user.name} (${user.email}).`,
      mode: 'LIVE',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        active: user.active,
      },
    });
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
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    if (id === session.userId) {
      return NextResponse.json({ error: 'तुम्ही स्वतःचे खाते हटवू शकत नाही.' }, { status: 400 });
    }

    const storage = getStorageProvider();
    await storage.init();

    const targetUser = await storage.getUserById(id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    await storage.deleteUser(id);

    await storage.addAuditLog({
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
      action: 'USER_DELETED',
      entityType: 'USER',
      entityId: id,
      details: `User ${targetUser.name} (${targetUser.email}) was deleted by ${session.name}.`,
      mode: 'LIVE',
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
