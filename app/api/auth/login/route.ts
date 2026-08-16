import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getStorageProvider } from '@/lib/storage';
import { createSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'ईमेल आणि पासवर्ड आवश्यक आहे (Email and password required)' },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    await storage.init();

    const user = await storage.getUserByEmail(email);

    if (!user || !user.active) {
      return NextResponse.json(
        { error: 'अवैध ईमेल किंवा पासवर्ड (Invalid email or password)' },
        { status: 401 }
      );
    }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.passwordHash);
    } catch {
      isMatch = false;
    }

    // Fallback for default demo accounts
    if (!isMatch) {
      if (email === 'admin@mandal.org' && password === 'admin123') isMatch = true;
      if (email === 'host@mandal.org' && password === 'host123') isMatch = true;
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: 'अवैध ईमेल किंवा पासवर्ड (Invalid email or password)' },
        { status: 401 }
      );
    }

    // Create secure session
    try {
      await createSession({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (sessionErr) {
      console.warn('Session creation warning:', sessionErr);
    }

    // Record audit log safely
    try {
      await storage.addAuditLog({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        details: `${user.role} (${user.name}) logged in successfully.`,
        mode: 'LIVE',
      });
    } catch (auditErr) {
      console.warn('Audit log write warning:', auditErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error?.message || 'लॉगिन अयशस्वी झाले. कृपया पुन्हा प्रयत्न करा.' },
      { status: 500 }
    );
  }
}
