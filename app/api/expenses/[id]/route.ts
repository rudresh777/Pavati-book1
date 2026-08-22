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

    const expense = await storage.getExpenseById(id, mode);
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ expense });
  } catch (error: any) {
    console.error('[API /api/expenses/[id] GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const {
      date,
      spentFor,
      description,
      amount,
      vendorPerson,
      note,
    } = body;

    const storage = getStorageProvider();
    await storage.init();

    const updated = await storage.updateExpense(
      id,
      {
        date: date?.trim() || undefined,
        spentFor: spentFor?.trim() || undefined,
        description: description !== undefined ? description?.trim() : undefined,
        amount: amount !== undefined ? Number(amount) : undefined,
        vendorPerson: vendorPerson !== undefined ? vendorPerson?.trim() : undefined,
        note: note !== undefined ? note?.trim() : undefined,
      },
      mode,
      {
        userId: session.userId,
        userName: session.name,
        userRole: session.role,
      }
    );

    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    console.error('[API /api/expenses/[id] PUT] Error:', error);
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

    const result = await storage.deleteExpense(id, mode, {
      userId: session.userId,
      userName: session.name,
      userRole: session.role,
    });

    return NextResponse.json({ success: true, deletedExpense: result.deletedExpense });
  } catch (error: any) {
    console.error('[API /api/expenses/[id] DELETE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
