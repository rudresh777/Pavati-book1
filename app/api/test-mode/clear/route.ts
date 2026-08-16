import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    if (body.confirmation !== 'CLEAR_ALL_TEST_DATA') {
      return NextResponse.json(
        { error: 'Invalid confirmation token. Confirmation "CLEAR_ALL_TEST_DATA" required.' },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    await storage.init();

    const result = await storage.clearTestData();

    return NextResponse.json({
      success: true,
      message: 'सर्व चाचणी (Test) डेटा यशस्वीरीत्या हटवला गेला. मूळ (Live) डेटा सुरक्षित आहे.',
      result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
