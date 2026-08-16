import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { AppMode } from '@/types';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'अनधिकृत: फक्त सुपर ॲडमिन संपूर्ण डेटा रीसेट करू शकतात.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { confirmation, mode = 'LIVE' } = body;

    if (confirmation !== 'RESET') {
      return NextResponse.json(
        { error: 'कृपया अचूक शब्द टाईप करा: RESET' },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    await storage.init();

    await storage.resetAllData(confirmation, mode as AppMode, {
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    });

    return NextResponse.json({
      success: true,
      message: 'सर्व डेटा यशस्वीरीत्या रीसेट करण्यात आला आहे.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
