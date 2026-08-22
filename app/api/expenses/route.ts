import { NextResponse } from 'next/server';
import { getStorageProvider } from '@/lib/storage';
import { getSession } from '@/lib/auth/session';
import { Expense, AppMode } from '@/types';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') as AppMode) || 'LIVE';
    const date = searchParams.get('date') || undefined;
    const search = (searchParams.get('search') || '').trim().toLowerCase();

    const storage = getStorageProvider();
    await storage.init();

    let expenses = await storage.getExpenses(mode, date);

    if (search) {
      expenses = expenses.filter(
        (e) =>
          (e.spentFor && e.spentFor.toLowerCase().includes(search)) ||
          (e.description && e.description.toLowerCase().includes(search)) ||
          (e.vendorPerson && e.vendorPerson.toLowerCase().includes(search)) ||
          (e.expenseNumber && e.expenseNumber.toLowerCase().includes(search)) ||
          (e.note && e.note.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ expenses });
  } catch (error: any) {
    console.error('[API /api/expenses GET] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      spentFor,
      description,
      amount,
      vendorPerson,
      note,
      mode = 'LIVE',
    } = body;

    const trimmedSpentFor = (spentFor || '').trim();
    const parsedAmount = Number(amount);

    if (!trimmedSpentFor) {
      return NextResponse.json(
        { error: 'खर्च कशासाठी (Purpose / Spent For) आवश्यक आहे.' },
        { status: 400 }
      );
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'कृपया वैध रक्कम प्रविष्ट करा (Valid amount is required).' },
        { status: 400 }
      );
    }

    const expenseDate = date?.trim() || new Date().toISOString().split('T')[0];

    const storage = getStorageProvider();
    await storage.init();

    const newExpense: Expense = {
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: expenseDate,
      spentFor: trimmedSpentFor,
      description: description?.trim() || undefined,
      amount: parsedAmount,
      vendorPerson: vendorPerson?.trim() || undefined,
      note: note?.trim() || undefined,
      addedBy: session.name || 'Admin',
      addedById: session.userId,
      userRole: session.role,
      mode: mode as AppMode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const savedExpense = await storage.saveExpense(newExpense, mode as AppMode);

    return NextResponse.json({ success: true, expense: savedExpense });
  } catch (error: any) {
    console.error('[API /api/expenses POST] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
