import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
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

    const cleanEmail = email.trim().toLowerCase();
    const storage = getStorageProvider();
    await storage.init();

    const user = await storage.getUserByEmail(cleanEmail);

    if (!user || !user.active) {
      return NextResponse.json(
        { error: 'अवैध ईमेल किंवा पासवर्ड (Invalid email or password)' },
        { status: 401 }
      );
    }

    let isMatch = false;

    // 1. Try Supabase Auth verification if configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let authAttempted = false;

    if (supabaseUrl && supabaseAnonKey) {
      try {
        authAttempted = true;
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          realtime: { transport: ws as any },
        });
        const { data: authData, error: authErr } = await authClient.auth.signInWithPassword({
          email: cleanEmail,
          password: password.trim(),
        });
        if (!authErr && authData?.user) {
          isMatch = true;
        } else if (authErr) {
          // If Supabase Auth explicitly rejects the password as invalid credentials, do not fall back
          if (
            authErr.message?.toLowerCase().includes('invalid login credentials') ||
            authErr.status === 400
          ) {
            isMatch = false;
            authAttempted = true;
          }
        }
      } catch (authErr) {
        console.warn('[Supabase Auth Login] error connecting to Auth, falling back to hash check:', authErr);
        authAttempted = false;
      }
    }

    // 2. Hash verification fallback (only if Supabase Auth was not used or in local mode)
    if (!isMatch && !authAttempted && user.passwordHash) {
      try {
        isMatch = await bcrypt.compare(password.trim(), user.passwordHash);
      } catch {
        isMatch = false;
      }
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
