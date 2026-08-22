'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  Search,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  Receipt,
  UserCheck,
  FileText,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';
import { Expense, ExpenseSummary, DailyExpenseRecord, MandalSettings } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';
import { cn } from '@/lib/utils/cn';

export default function ExpensesPage() {
  const { mode, user } = useAppMode();
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters and Views
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'HISTORY'>('RECORDS');

  // Add Expense Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addForm, setAddForm] = useState({
    date: new Date().toISOString().split('T')[0],
    spentFor: '',
    description: '',
    amount: '',
    vendorPerson: '',
    note: '',
  });

  // Edit Expense Modal
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    date: '',
    spentFor: '',
    description: '',
    amount: '',
    vendorPerson: '',
    note: '',
  });

  // View Expense Modal
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Delete Confirmation Modal
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExpensesData = async () => {
    setIsLoading(true);
    try {
      const [expRes, sumRes, setRes] = await Promise.all([
        fetch(`/api/expenses?mode=${mode}${selectedDate ? `&date=${selectedDate}` : ''}`),
        fetch(`/api/expenses/summary?mode=${mode}${selectedDate ? `&date=${selectedDate}` : ''}`),
        fetch('/api/settings'),
      ]);

      const expData = await expRes.json();
      const sumData = await sumRes.json();
      const setData = await setRes.json();

      if (expData.expenses) setExpenses(expData.expenses);
      if (sumData.summary) setSummary(sumData.summary);
      if (setData.settings) setSettings(setData.settings);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesData();
  }, [mode, selectedDate]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setAddForm({
      date: new Date().toISOString().split('T')[0],
      spentFor: '',
      description: '',
      amount: '',
      vendorPerson: '',
      note: '',
    });
    setIsAddModalOpen(true);
  };

  // Submit Add Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSpentFor = addForm.spentFor.trim();

    if (!finalSpentFor) {
      alert(isEn ? 'Please specify what the expense was for.' : 'कृपया खर्च कशासाठी झाला ते नमूद करा.');
      return;
    }

    const numAmt = Number(addForm.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert(isEn ? 'Please enter a valid amount.' : 'कृपया वैध रक्कम प्रविष्ट करा.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: addForm.date,
          spentFor: finalSpentFor,
          description: addForm.description,
          amount: numAmt,
          vendorPerson: addForm.vendorPerson,
          note: addForm.note,
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEn ? 'Failed to save expense.' : 'खर्च जतन करताना त्रुटी आली.'));
      }

      setIsAddModalOpen(false);
      await fetchExpensesData();
    } catch (err: any) {
      alert(err.message || (isEn ? 'Failed to save expense.' : 'खर्च जतन करताना त्रुटी आली.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setEditForm({
      date: exp.date,
      spentFor: exp.spentFor || '',
      description: exp.description || '',
      amount: String(exp.amount),
      vendorPerson: exp.vendorPerson || '',
      note: exp.note || '',
    });
    setIsEditModalOpen(true);
  };

  // Submit Edit Expense
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const finalSpentFor = editForm.spentFor.trim();

    if (!finalSpentFor) {
      alert(isEn ? 'Please specify what the expense was for.' : 'कृपया खर्च कशासाठी झाला ते नमूद करा.');
      return;
    }

    const numAmt = Number(editForm.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      alert(isEn ? 'Please enter a valid amount.' : 'कृपया वैध रक्कम प्रविष्ट करा.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}?mode=${mode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editForm.date,
          spentFor: finalSpentFor,
          description: editForm.description,
          amount: numAmt,
          vendorPerson: editForm.vendorPerson,
          note: editForm.note,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEn ? 'Failed to update expense.' : 'खर्च बदलताना त्रुटी आली.'));
      }

      setIsEditModalOpen(false);
      setEditingExpense(null);
      await fetchExpensesData();
    } catch (err: any) {
      alert(err.message || (isEn ? 'Failed to update expense.' : 'खर्च बदलताना त्रुटी आली.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Open View Modal
  const handleOpenViewModal = (exp: Expense) => {
    setViewingExpense(exp);
    setIsViewModalOpen(true);
  };

  // Open Delete Confirmation
  const handleOpenDeleteModal = (exp: Expense) => {
    setDeletingExpense(exp);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}?mode=${mode}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEn ? 'Failed to delete expense.' : 'खर्च हटवण्यात त्रुटी आली.'));
      }

      setIsDeleteModalOpen(false);
      setDeletingExpense(null);
      await fetchExpensesData();
    } catch (err: any) {
      alert(err.message || (isEn ? 'Failed to delete expense.' : 'खर्च हटवण्यात त्रुटी आली.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Expenses by Search Query
  const filteredExpenses = useMemo(() => {
    if (!searchQuery.trim()) return expenses;
    const query = searchQuery.trim().toLowerCase();
    return expenses.filter(
      (e) =>
        (e.spentFor && e.spentFor.toLowerCase().includes(query)) ||
        (e.description && e.description.toLowerCase().includes(query)) ||
        (e.vendorPerson && e.vendorPerson.toLowerCase().includes(query)) ||
        (e.expenseNumber && e.expenseNumber.toLowerCase().includes(query)) ||
        (e.note && e.note.toLowerCase().includes(query)) ||
        (e.date && e.date.includes(query))
    );
  }, [expenses, searchQuery]);

  // Selected date total calculation
  const selectedDateTotal = useMemo(() => {
    if (!selectedDate) return 0;
    return expenses
      .filter((e) => e.date === selectedDate)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, selectedDate]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const clean = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-');
      return `${d}/${m}/${y}`;
    }
    return clean;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. HEADER & IDENTITY BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-600 text-white font-devanagari tracking-wide shadow-sm">
              ॥ {settings?.sloganMarathi || '॥ गणपती बाप्पा मोरया ॥'} ॥
            </span>
            <span className="text-xs text-stone-500 font-semibold font-devanagari">
              सन {settings?.year || '२०२६'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-orange-600 flex-shrink-0" />
            <span>{isEn ? 'Funds & Expenses' : 'निधी व खर्च व्यवस्थापन'}</span>
          </h1>
          <p className="text-xs text-stone-600 font-devanagari">
            {isEn
              ? 'Maintain a clear and transparent record of where the Mandal’s money is being spent.'
              : 'मंडळाचा सर्व खर्च, दिनांक, कशासाठी खर्च झाला आणि तपशील यांची पारदर्शक नोंद.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 shadow-md py-2.5 px-4 font-devanagari text-sm font-bold cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isEn ? '+ Add Expense' : '+ खर्च नोंदवा'}</span>
          </Button>
        </div>
      </div>

      {/* 2. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Expenses */}
        <Card className="border-l-4 border-l-rose-500 border-stone-200 shadow-sm hover:border-stone-300 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
              <span>{isEn ? "Today's Expenses" : 'आजचा खर्च'}</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono tracking-tight">
              {isLoading ? '...' : formatIndianCurrency(summary?.todayExpense || 0)}
            </div>
            <div className="text-xs text-stone-500 font-devanagari">
              {isEn ? 'Yesterday:' : 'कालचा खर्च:'} {formatIndianCurrency(summary?.yesterdayExpense || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="border-l-4 border-l-orange-600 border-stone-200 shadow-sm hover:border-stone-300 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
              <span>{isEn ? 'Total Expenses' : 'एकूण खर्च'}</span>
              <Wallet className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight">
              {isLoading ? '...' : formatIndianCurrency(summary?.totalExpense || 0)}
            </div>
            <div className="text-xs text-stone-500 font-devanagari flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-orange-600" />
              <span>
                <strong>{expenses.length}</strong> {isEn ? 'expense records recorded' : 'एकूण खर्च नोंदी'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Net Balance (Today's Collection - Today's Expenses) */}
        <Card className="border-l-4 border-l-emerald-600 border-stone-200 shadow-sm hover:border-stone-300 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
              <span>{isEn ? "Today's Net Balance" : 'आजची शिल्लक'}</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div
              className={cn(
                'text-2xl sm:text-3xl font-black font-mono tracking-tight',
                (summary?.todayBalance ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
              )}
            >
              {isLoading ? '...' : formatIndianCurrency(summary?.todayBalance || 0)}
            </div>
            <div className="text-xs text-stone-500 font-devanagari">
              {isEn ? 'Today Collected:' : 'आजची जमा:'} {formatIndianCurrency((summary as any)?.todayCollection || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Total Net Balance (Total Collection - Total Expenses) */}
        <Card className="border-l-4 border-l-blue-600 border-stone-200 shadow-sm hover:border-stone-300 transition-colors">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
              <span>{isEn ? 'Overall Net Balance' : 'एकूण शिल्लक निधी'}</span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <div
              className={cn(
                'text-2xl sm:text-3xl font-black font-mono tracking-tight',
                (summary?.totalBalance ?? 0) >= 0 ? 'text-blue-700' : 'text-rose-700'
              )}
            >
              {isLoading ? '...' : formatIndianCurrency(summary?.totalBalance || 0)}
            </div>
            <div className="text-xs text-stone-500 font-devanagari">
              {isEn ? 'Total Collected:' : 'एकूण जमा:'} {formatIndianCurrency((summary as any)?.totalCollection || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. CONTROLS, DATE FILTER & SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Navigation Tabs */}
          <div className="inline-flex rounded-lg bg-stone-100 p-1 text-xs font-bold font-devanagari self-start">
            <button
              onClick={() => setActiveTab('RECORDS')}
              className={cn(
                'px-3.5 py-1.5 rounded-md transition-all cursor-pointer',
                activeTab === 'RECORDS'
                  ? 'bg-white text-orange-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              {isEn ? 'Expense Records' : 'खर्च यादी'} ({filteredExpenses.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={cn(
                'px-3.5 py-1.5 rounded-md transition-all cursor-pointer',
                activeTab === 'HISTORY'
                  ? 'bg-white text-orange-950 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              )}
            >
              {isEn ? 'Date-wise History' : 'दैनिक इतिहास'} ({summary?.dailyHistory?.length || 0})
            </button>
          </div>

          {/* Right: Date Filter & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Filter */}
            <div className="flex items-center gap-1.5 bg-amber-50/70 border border-amber-300 rounded-lg px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-800 flex-shrink-0" />
              <span className="font-bold text-amber-950 font-devanagari">
                {isEn ? 'Date:' : 'दिनांक:'}
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-stone-800 focus:outline-none cursor-pointer"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  title={isEn ? 'Show all dates' : 'सर्व दिनांक पहा'}
                  className="p-1 text-stone-500 hover:text-red-600 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate('')}
                className="text-xs font-devanagari py-1 px-2.5 border-amber-300 bg-white hover:bg-amber-50"
              >
                {isEn ? 'All Dates' : 'सर्व दिनांक'}
              </Button>
            )}

            {/* Search Input */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isEn
                    ? 'Search purpose, vendor, desc...'
                    : 'खर्च प्रकार, व्यापारी, तपशील शोधा...'
                }
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg font-devanagari focus:bg-white focus:border-orange-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Specific Date Filter Banner */}
        {selectedDate && (
          <div className="flex items-center justify-between bg-amber-100/80 border border-amber-300 px-4 py-2.5 rounded-lg text-xs font-devanagari text-amber-950 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <span className="font-bold">
                {isEn
                  ? `Total Expenses on ${formatDateDisplay(selectedDate)}:`
                  : `${formatDateDisplay(selectedDate)} रोजीचा एकूण खर्च:`}
              </span>
              <span className="font-black text-rose-700 font-mono text-sm ml-1">
                {formatIndianCurrency(selectedDateTotal)}
              </span>
            </div>
            <button
              onClick={() => setSelectedDate('')}
              className="text-xs font-bold text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isEn ? 'Clear Filter (Show All)' : 'फिल्टर हटवा (सर्व दिनांक पहा)'}</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT AREA: TAB 1 (RECORDS TABLE) OR TAB 2 (DAILY HISTORY) */}
      {activeTab === 'RECORDS' ? (
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <Card className="border-dashed border-stone-300">
              <CardContent className="p-10 text-center space-y-3 font-devanagari">
                <Receipt className="w-12 h-12 text-stone-300 mx-auto" />
                <h4 className="text-base font-bold text-stone-700">
                  {selectedDate
                    ? isEn
                      ? 'No expenses recorded for this date'
                      : 'या तारखेसाठी कोणतीही खर्च नोंद सापडली नाही'
                    : isEn
                    ? 'No expenses recorded yet'
                    : 'अद्याप कोणतीही खर्च नोंद उपलब्ध नाही'}
                </h4>
                <p className="text-xs text-stone-500 max-w-md mx-auto">
                  {isEn
                    ? 'Click the "+ Add Expense" button above to record your first Mandal expenditure.'
                    : 'मंडळाचा खर्च नोंदवण्यासाठी वर दिलेल्या "+ खर्च नोंदवा" बटनावर क्लिक करा.'}
                </p>
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenAddModal}
                    className="font-devanagari font-bold"
                  >
                    {isEn ? '+ Add Expense' : '+ खर्च नोंदवा'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-gradient-to-r from-amber-50 to-orange-50 text-stone-800 font-bold border-b border-amber-200 uppercase font-devanagari">
                    <tr>
                      <th className="px-4 py-3.5">{isEn ? 'Expense #' : 'खर्च क्र.'}</th>
                      <th className="px-4 py-3.5">{isEn ? 'Date' : 'दिनांक'}</th>
                      <th className="px-4 py-3.5">{isEn ? 'Spent For' : 'खर्च कशासाठी'}</th>
                      <th className="px-4 py-3.5">{isEn ? 'Description' : 'तपशील'}</th>
                      <th className="px-4 py-3.5 text-right">{isEn ? 'Amount' : 'रक्कम'}</th>
                      <th className="px-4 py-3.5">{isEn ? 'Vendor / Person' : 'व्यक्ती / व्यापारी'}</th>
                      <th className="px-4 py-3.5">{isEn ? 'Added By' : 'नोंदणीकर्ता'}</th>
                      <th className="px-4 py-3.5 text-right">{isEn ? 'Actions' : 'कृती'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredExpenses.map((exp) => (
                      <tr
                        key={exp.id}
                        className="hover:bg-amber-50/40 transition-colors"
                      >
                        {/* Expense Number */}
                        <td className="px-4 py-3 font-mono font-bold text-orange-800 whitespace-nowrap">
                          #{exp.expenseNumber || exp.id.slice(0, 8)}
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 font-mono text-stone-800 whitespace-nowrap font-medium">
                          {formatDateDisplay(exp.date)}
                        </td>

                        {/* Spent For / Purpose */}
                        <td className="px-4 py-3 font-bold text-stone-900 font-devanagari whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 text-[11px] font-bold border border-amber-200">
                            {exp.spentFor}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="px-4 py-3 text-stone-600 font-devanagari max-w-[220px] truncate">
                          {exp.description || '-'}
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3 text-right font-mono font-black text-rose-700 text-sm whitespace-nowrap">
                          {formatIndianCurrency(exp.amount)}
                        </td>

                        {/* Vendor / Person */}
                        <td className="px-4 py-3 text-stone-700 font-devanagari whitespace-nowrap">
                          {exp.vendorPerson || '-'}
                        </td>

                        {/* Added By */}
                        <td className="px-4 py-3 text-stone-500 font-devanagari text-[11px] whitespace-nowrap">
                          {exp.addedBy || 'Admin'}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenViewModal(exp)}
                              title={isEn ? 'View details' : 'तपशील पहा'}
                              className="p-1.5 text-stone-600 hover:text-orange-600 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(exp)}
                              title={isEn ? 'Edit expense' : 'संपादित करा'}
                              className="p-1.5 text-blue-600 hover:text-blue-700 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDeleteModal(exp)}
                              title={isEn ? 'Delete expense' : 'हटवा'}
                              className="p-1.5 text-red-600 hover:text-red-700 rounded hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: DATE-WISE EXPENSE HISTORY */
        <div className="space-y-4">
          {(!summary?.dailyHistory || summary.dailyHistory.length === 0) ? (
            <Card className="border-dashed border-stone-300">
              <CardContent className="p-10 text-center space-y-2 font-devanagari text-stone-500">
                <Calendar className="w-10 h-10 text-stone-300 mx-auto" />
                <div className="font-bold text-stone-700 text-sm">
                  {isEn ? 'No date-wise history recorded yet' : 'अद्याप कोणताही दैनिक खर्च इतिहास उपलब्ध नाही'}
                </div>
                <p className="text-xs">
                  {isEn
                    ? 'Expenses will be automatically grouped by date here.'
                    : 'खर्च नोंदवल्यानंतर तारखेनुसार एकूण खर्च येथे आपोआप वर्गीकृत होईल.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-gradient-to-r from-amber-50 to-orange-50 text-stone-800 font-bold border-b border-amber-200 uppercase font-devanagari">
                    <tr>
                      <th className="px-4 py-3.5">{isEn ? 'Date' : 'दिनांक'}</th>
                      <th className="px-4 py-3.5 text-center">{isEn ? 'Expense Count' : 'खर्च नोंदी संख्या'}</th>
                      <th className="px-4 py-3.5 text-right">{isEn ? 'Total Spent on Date' : 'त्या तारखेचा एकूण खर्च'}</th>
                      <th className="px-4 py-3.5 text-right">{isEn ? 'Action' : 'कृती'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {summary.dailyHistory.map((record) => {
                      const isToday = record.date === new Date().toISOString().split('T')[0];
                      return (
                        <tr
                          key={record.date}
                          className={cn(
                            'hover:bg-amber-50/40 transition-colors',
                            isToday && 'bg-amber-50/60 font-semibold'
                          )}
                        >
                          <td className="px-4 py-3 font-mono text-stone-900 flex items-center gap-2">
                            <span className="font-bold">{record.formattedDate || record.date}</span>
                            {isToday && (
                              <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full font-devanagari">
                                {isEn ? 'Today' : 'आज'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-stone-800">
                            <span className="bg-stone-100 px-2.5 py-0.5 rounded-md">
                              {record.expenseCount} {isEn ? 'entries' : 'नोंदी'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-rose-700 font-extrabold text-sm">
                            {formatIndianCurrency(record.totalExpense)}
                          </td>
                          <td className="px-4 py-3 text-right font-devanagari">
                            <button
                              onClick={() => {
                                setSelectedDate(record.date);
                                setActiveTab('RECORDS');
                              }}
                              className="text-xs font-bold text-orange-600 hover:text-orange-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isEn ? 'View Expenses' : 'खर्च पहा'}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ADD EXPENSE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={
          <div className="flex items-center gap-2 font-devanagari">
            <Wallet className="w-5 h-5 text-orange-600" />
            <span>{isEn ? 'Add New Expense' : 'नवीन खर्च नोंदवा'}</span>
          </div>
        }
        description={
          isEn
            ? 'Enter expense details. Date defaults to today.'
            : 'खर्चाचा सर्व तपशील प्रविष्ट करा. दिनांक आजची असेल.'
        }
        maxWidth="md"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4 font-devanagari text-xs">
          {/* Expense Date */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'Expense Date *' : 'खर्च दिनांक *'}
            </label>
            <input
              type="date"
              required
              value={addForm.date}
              onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-xs focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Spent For / Purpose */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'Spent For / Purpose *' : 'खर्च कशासाठी *'}
            </label>
            <input
              type="text"
              required
              placeholder={isEn ? 'e.g. Mandap, Lighting, Prasad, Sound, Banner, etc.' : 'उदा. मंडप, लाईट व्यवस्था, प्रसाद, बॅनर, सजावट, इत्यादी'}
              value={addForm.spentFor}
              onChange={(e) => setAddForm({ ...addForm, spentFor: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'तपशील / Description' : 'तपशील (वैकल्पिक)'}
            </label>
            <textarea
              rows={2}
              placeholder={isEn ? 'e.g. Stage material, lighting items' : 'उदा. सजावटीचे साहित्य, लाईटिंग खर्च'}
              value={addForm.description}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'रक्कम / Amount (₹) *' : 'रक्कम (₹) *'}
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="उदा. २५००"
              value={addForm.amount}
              onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-sm font-bold text-stone-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Vendor / Person */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'Vendor / Person' : 'व्यक्ती / व्यापारी (वैकल्पिक)'}
            </label>
            <input
              type="text"
              placeholder={isEn ? 'e.g. Sachin Decorators / Ramesh' : 'उदा. सचिन डेकोरेटर्स, रमेश जोशी'}
              value={addForm.vendorPerson}
              onChange={(e) => setAddForm({ ...addForm, vendorPerson: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'Note' : 'टीप (वैकल्पिक)'}
            </label>
            <input
              type="text"
              placeholder={isEn ? 'Additional notes...' : 'अतिरिक्त माहिती किंवा बिल संदर्भ...'}
              value={addForm.note}
              onChange={(e) => setAddForm({ ...addForm, note: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSaving}
            >
              {isEn ? 'Cancel' : 'रद्द करा'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
              className="font-bold"
            >
              {isSaving ? '...' : isEn ? 'Save Expense' : 'खर्च जतन करा'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 6. EDIT EXPENSE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={
          <div className="flex items-center gap-2 font-devanagari">
            <Edit2 className="w-5 h-5 text-blue-600" />
            <span>{isEn ? 'Edit Expense Record' : 'खर्च नोंद संपादित करा'}</span>
          </div>
        }
        description={
          editingExpense ? `#${editingExpense.expenseNumber || editingExpense.id}` : ''
        }
        maxWidth="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4 font-devanagari text-xs">
          {/* Expense Date */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'Expense Date *' : 'खर्च दिनांक *'}
            </label>
            <input
              type="date"
              required
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-xs focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Spent For / Purpose */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'Spent For / Purpose *' : 'खर्च कशासाठी *'}
            </label>
            <input
              type="text"
              required
              placeholder={isEn ? 'e.g. Mandap, Lighting, Prasad, Sound, Banner, etc.' : 'उदा. मंडप, लाईट व्यवस्था, प्रसाद, बॅनर, सजावट, इत्यादी'}
              value={editForm.spentFor}
              onChange={(e) => setEditForm({ ...editForm, spentFor: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'तपशील / Description' : 'तपशील (वैकल्पिक)'}
            </label>
            <textarea
              rows={2}
              placeholder={isEn ? 'e.g. Stage material, lighting items' : 'उदा. सजावटीचे साहित्य, लाईटिंग खर्च'}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'रक्कम / Amount (₹) *' : 'रक्कम (₹) *'}
            </label>
            <input
              type="number"
              required
              min="1"
              step="any"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-sm font-bold text-stone-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Vendor / Person */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'Vendor / Person' : 'व्यक्ती / व्यापारी (वैकल्पिक)'}
            </label>
            <input
              type="text"
              value={editForm.vendorPerson}
              onChange={(e) => setEditForm({ ...editForm, vendorPerson: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label className="font-bold text-stone-800 block">
              {isEn ? 'Note' : 'टीप (वैकल्पिक)'}
            </label>
            <input
              type="text"
              value={editForm.note}
              onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              {isEn ? 'Cancel' : 'रद्द करा'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSaving}
              className="font-bold"
            >
              {isSaving ? '...' : isEn ? 'Save Changes' : 'बदल जतन करा'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* 7. VIEW EXPENSE DETAILS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={
          <div className="flex items-center gap-2 font-devanagari">
            <FileText className="w-5 h-5 text-orange-600" />
            <span>{isEn ? 'Expense Details' : 'खर्च तपशील'}</span>
          </div>
        }
        description={viewingExpense ? `#${viewingExpense.expenseNumber}` : ''}
        maxWidth="sm"
      >
        {viewingExpense && (
          <div className="space-y-3.5 font-devanagari text-xs">
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-center space-y-1">
              <div className="text-stone-500 text-[11px] font-bold uppercase">
                {isEn ? 'Expense Amount' : 'खर्च रक्कम'}
              </div>
              <div className="text-2xl font-black text-rose-700 font-mono">
                {formatIndianCurrency(viewingExpense.amount)}
              </div>
            </div>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white">
              <div className="px-3.5 py-2.5 flex justify-between">
                <span className="text-stone-500 font-semibold">{isEn ? 'Date' : 'दिनांक:'}</span>
                <span className="font-mono font-bold text-stone-900">
                  {formatDateDisplay(viewingExpense.date)}
                </span>
              </div>
              <div className="px-3.5 py-2.5 flex justify-between">
                <span className="text-stone-500 font-semibold">{isEn ? 'Spent For' : 'खर्च कशासाठी:'}</span>
                <span className="font-bold text-stone-900">{viewingExpense.spentFor}</span>
              </div>
              {viewingExpense.description && (
                <div className="px-3.5 py-2.5 flex justify-between">
                  <span className="text-stone-500 font-semibold">{isEn ? 'Description' : 'तपशील:'}</span>
                  <span className="text-stone-800 text-right max-w-[200px]">
                    {viewingExpense.description}
                  </span>
                </div>
              )}
              {viewingExpense.vendorPerson && (
                <div className="px-3.5 py-2.5 flex justify-between">
                  <span className="text-stone-500 font-semibold">{isEn ? 'Vendor / Person' : 'व्यक्ती / व्यापारी:'}</span>
                  <span className="font-bold text-stone-900">{viewingExpense.vendorPerson}</span>
                </div>
              )}
              {viewingExpense.note && (
                <div className="px-3.5 py-2.5 flex justify-between">
                  <span className="text-stone-500 font-semibold">{isEn ? 'Note' : 'टीप:'}</span>
                  <span className="text-stone-700 text-right max-w-[200px]">
                    {viewingExpense.note}
                  </span>
                </div>
              )}
              <div className="px-3.5 py-2.5 flex justify-between">
                <span className="text-stone-500 font-semibold">{isEn ? 'Added By' : 'नोंदणीकर्ता:'}</span>
                <span className="text-stone-800 font-semibold">{viewingExpense.addedBy}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsViewModalOpen(false)}
              >
                {isEn ? 'Close' : 'बंद करा'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 8. DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-red-600 font-devanagari">
            <AlertTriangle className="w-5 h-5" />
            <span>{isEn ? 'Are you sure you want to delete this expense?' : 'खर्च नोंद हटवायची आहे का?'}</span>
          </div>
        }
        description={
          isEn
            ? 'This record will be permanently deleted. Please confirm.'
            : 'ही नोंद कायमची हटवली जाईल. कृपया पुष्टी करा.'
        }
        maxWidth="sm"
      >
        {deletingExpense && (
          <div className="space-y-4 font-devanagari text-xs">
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-1.5 text-stone-800">
              <div className="flex justify-between">
                <span className="text-stone-500">{isEn ? 'Expense #' : 'खर्च क्र.:'}</span>
                <span className="font-mono font-bold text-orange-900">
                  #{deletingExpense.expenseNumber || deletingExpense.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{isEn ? 'Date:' : 'दिनांक:'}</span>
                <span className="font-mono font-semibold">
                  {formatDateDisplay(deletingExpense.date)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{isEn ? 'Spent For:' : 'खर्च कशासाठी:'}</span>
                <span className="font-bold text-stone-900">{deletingExpense.spentFor}</span>
              </div>
              <div className="flex justify-between border-t border-red-200/60 pt-1">
                <span className="text-stone-600 font-bold">{isEn ? 'Amount:' : 'रक्कम:'}</span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  {formatIndianCurrency(deletingExpense.amount)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                {isEn ? 'Cancel' : 'रद्द करा'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="font-bold"
              >
                {isDeleting ? '...' : isEn ? 'Delete Expense' : 'खर्च हटवा'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
