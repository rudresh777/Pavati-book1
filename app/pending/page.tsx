'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Clock,
  Search,
  CheckCircle2,
  Phone,
  PlusCircle,
  Calendar,
  User,
  CreditCard,
  Edit2,
  Trash2,
  AlertTriangle,
  Eye,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';
import { Payment, Pavti, MandalSettings } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';
import { PavtiCard } from '@/components/pavti/PavtiCard';
import { PavtiShareModal } from '@/components/pavti/PavtiShareModal';

export default function DueMembersPage() {
  const { mode } = useAppMode();
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const [pendingList, setPendingList] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Mark as Paid Modal State
  const [markPaidPayment, setMarkPaidPayment] = useState<Payment | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [transactionReference, setTransactionReference] = useState('');
  const [paidNotes, setPaidNotes] = useState('');
  const [isSubmittingPaid, setIsSubmittingPaid] = useState(false);
  const [paidModalError, setPaidModalError] = useState('');

  // 2. Edit Modal State
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editDonorName, setEditDonorName] = useState('');
  const [editDonorMobile, setEditDonorMobile] = useState('');
  const [editDonorAddress, setEditDonorAddress] = useState('');
  const [editExpectedAmount, setEditExpectedAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editModalError, setEditModalError] = useState('');

  // 3. Cancel Confirmation Modal State
  const [cancelPayment, setCancelPayment] = useState<Payment | null>(null);
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // 4. Generated / Preview Pavti for sharing
  const [selectedPavti, setSelectedPavti] = useState<Pavti | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchDueData = async () => {
    setIsLoading(true);
    try {
      const [payRes, setRes] = await Promise.all([
        fetch(`/api/payments?status=DUE&mode=${mode}`),
        fetch(`/api/settings`),
      ]);

      const payData = await payRes.json();
      const setData = await setRes.json();

      if (payData.payments) setPendingList(payData.payments);
      if (setData.settings) setSettings(setData.settings);
    } catch (err) {
      console.error('Failed to fetch due payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDueData();
  }, [mode]);

  // Handle Mark as Paid Modal Open
  const handleOpenMarkPaid = (payment: Payment) => {
    setMarkPaidPayment(payment);
    const remaining = payment.expectedAmount - (payment.receivedAmount || 0);
    setReceivedAmount(remaining.toString());
    setPaymentMethod('CASH');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setTransactionReference('');
    setPaidNotes('');
    setPaidModalError('');
  };

  // Submit Mark as Paid
  const handleConfirmPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markPaidPayment || isSubmittingPaid) return;

    const numAmt = Number(receivedAmount);
    if (!numAmt || numAmt <= 0) {
      setPaidModalError(isEn ? 'Please enter a valid amount.' : 'कृपया वैध रक्कम प्रविष्ट करा.');
      return;
    }

    setIsSubmittingPaid(true);
    setPaidModalError('');

    try {
      const res = await fetch(`/api/payments/${markPaidPayment.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivedAmount: numAmt,
          paymentMethod,
          paymentDate,
          transactionReference: transactionReference.trim(),
          notes: paidNotes.trim(),
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to record payment.' : 'पेमेंट नोंदवण्यात त्रुटी आली.'));

      // Trigger Confetti
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#ea580c', '#f59e0b', '#10b981'],
      });

      setMarkPaidPayment(null);
      setSelectedPavti(data.pavti);
      setIsShareModalOpen(true);
      fetchDueData();
    } catch (err: any) {
      setPaidModalError(err.message || (isEn ? 'Error occurred.' : 'त्रुटी आली.'));
    } finally {
      setIsSubmittingPaid(false);
    }
  };

  // Handle Edit Modal Open
  const handleOpenEdit = (payment: Payment) => {
    setEditPayment(payment);
    setEditDonorName(payment.donorName);
    setEditDonorMobile(payment.donorMobile || '');
    setEditDonorAddress(payment.donorAddress || '');
    setEditExpectedAmount(payment.expectedAmount.toString());
    setEditNotes(payment.notes || '');
    setEditModalError('');
  };

  // Submit Edit Due Record
  const handleConfirmEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPayment || isSubmittingEdit) return;

    const numAmt = Number(editExpectedAmount);
    if (!numAmt || numAmt <= 0) {
      setEditModalError(isEn ? 'Please enter a valid expected amount.' : 'कृपया वैध अपेक्षित रक्कम प्रविष्ट करा.');
      return;
    }

    setIsSubmittingEdit(true);
    setEditModalError('');

    try {
      const res = await fetch(`/api/payments/${editPayment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorName: editDonorName.trim(),
          donorMobile: editDonorMobile.trim(),
          donorAddress: editDonorAddress.trim(),
          expectedAmount: numAmt,
          notes: editNotes.trim(),
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to save changes.' : 'बदल सेव्ह करण्यात त्रुटी आली.'));

      setEditPayment(null);
      fetchDueData();
    } catch (err: any) {
      setEditModalError(err.message || (isEn ? 'Error occurred.' : 'त्रुटी आली.'));
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Submit Delete Due Record
  const handleConfirmCancel = async () => {
    if (!cancelPayment || isSubmittingCancel) return;

    setIsSubmittingCancel(true);
    try {
      const res = await fetch(`/api/payments/${cancelPayment.id}?mode=${mode}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to delete record.' : 'नोंद हटवण्यात त्रुटी आली.'));

      setCancelPayment(null);
      fetchDueData();
    } catch (err: any) {
      alert(err.message || (isEn ? 'Error occurred.' : 'त्रुटी आली.'));
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Preview Due Pavti
  const handlePreviewDuePavti = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/pavtis?mode=${mode}`);
      const data = await res.json();
      const pavti = (data.pavtis || []).find((p: Pavti) => p.paymentId === paymentId);
      if (pavti) {
        setSelectedPavti(pavti);
        setIsShareModalOpen(true);
      } else {
        alert(isEn ? 'Receipt not found.' : 'पावती उपलब्ध नाही.');
      }
    } catch {
      alert(isEn ? 'Error loading receipt.' : 'पावती लोड करताना त्रुटी आली.');
    }
  };

  // Filter Active Due Items
  const activeDueList = pendingList.filter(
    (p) => p.status === 'DUE' || p.status === 'PENDING' || p.status === 'PARTIALLY_PAID'
  );

  const filteredDue = activeDueList.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.donorName.toLowerCase().includes(q) ||
      p.donorMobile?.includes(q) ||
      (p.donorAddress && p.donorAddress.toLowerCase().includes(q));

    const matchesDate = !dateFilter || p.date === dateFilter;

    return matchesSearch && matchesDate;
  });

  // Dynamic Calculations from Active Due Records
  const totalDueCount = activeDueList.length;
  const totalDueAmount = activeDueList.reduce(
    (sum, p) => sum + (p.expectedAmount - (p.receivedAmount || 0)),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER & TOTAL DUE SUMMARY STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600" />
            <span>{isEn ? 'Pending Collections' : 'येणे बाकी यादी'}</span>
          </h1>
          <p className="text-xs text-stone-500 font-devanagari">
            {isEn
              ? 'List of members with pending contributions. Click "Mark as Paid" when received.'
              : 'ज्या देणगीदारांची वर्गणी येणे बाकी आहे त्यांची यादी. पैसे प्राप्त झाल्यावर "पैसे मिळाले" वर क्लिक करा.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* TOTAL DUE MEMBERS & AMOUNT SUMMARY WIDGET */}
          <div className="bg-amber-100/90 px-4 py-2 rounded-xl border-2 border-amber-300 shadow-sm text-right flex items-center gap-4">
            <div>
              <div className="text-[10px] font-bold text-amber-800 uppercase font-devanagari">
                {isEn ? 'Due Donors' : 'एकूण बाकीदार'}
              </div>
              <div className="text-lg font-black text-amber-950 font-mono">
                {totalDueCount}
              </div>
            </div>
            <div className="border-l border-amber-300 pl-4">
              <div className="text-[10px] font-bold text-amber-800 uppercase font-devanagari">
                {isEn ? 'Total Due Amount' : 'एकूण बाकी रक्कम'}
              </div>
              <div className="text-lg sm:text-xl font-black text-amber-950 font-mono tracking-tight text-orange-900">
                {formatIndianCurrency(totalDueAmount)}
              </div>
            </div>
          </div>

          <Link href="/pavti/new">
            <Button variant="primary" size="sm" className="font-devanagari py-2.5 px-3.5 flex items-center gap-1.5 shadow">
              <PlusCircle className="w-4 h-4" />
              <span>{isEn ? '+ New Receipt / Due' : '+ नवीन पावती / बाकी नोंद'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* SEARCH AND FILTER CONTROLS */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? 'Search by donor name or mobile number...' : 'देणगीदाराचे नाव किंवा मोबाईल नंबर शोधा...'}
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-devanagari"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-stone-500 hover:text-red-600 underline font-devanagari"
            >
              {isEn ? 'Clear Date' : 'तारीख साफ करा'}
            </button>
          )}
        </div>
      </div>

      {/* SIMPLE TABLE FORMAT */}
      <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 min-w-[800px]">
            <thead className="bg-amber-50 text-amber-950 font-bold border-b border-amber-200 uppercase font-devanagari">
              <tr>
                <th className="px-4 py-3.5">{isEn ? 'Receipt #' : 'पावती क्र.'}</th>
                <th className="px-4 py-3.5">{isEn ? 'Donor' : 'देणगीदार'}</th>
                <th className="px-4 py-3.5">{isEn ? 'Mobile' : 'मोबाईल'}</th>
                <th className="px-4 py-3.5">{isEn ? 'Address' : 'पत्ता'}</th>
                <th className="px-4 py-3.5">{isEn ? 'Due Amount' : 'बाकी रक्कम'}</th>
                <th className="px-4 py-3.5">{isEn ? 'Date' : 'दिनांक'}</th>
                <th className="px-4 py-3.5">{isEn ? 'Status' : 'स्थिती'}</th>
                <th className="px-4 py-3.5 text-right">{isEn ? 'Action' : 'कृती'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredDue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-stone-400 font-devanagari space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
                    <div className="font-bold text-stone-700 text-sm">
                      {searchQuery || dateFilter
                        ? (isEn ? 'No records match the filter criteria.' : 'दिलेल्या निकषानुसार कोणतीही बाकी नोंद आढळली नाही.')
                        : (isEn ? 'No pending payments at this time.' : 'सध्या कोणतीही बाकी रक्कम प्रलंबित नाही.')}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDue.map((p) => {
                  const balance = p.expectedAmount - (p.receivedAmount || 0);
                  return (
                    <tr key={p.id} className="hover:bg-amber-50/50 transition-colors">
                      {/* 1. Receipt Number */}
                      <td className="px-4 py-3.5 font-mono font-bold text-orange-800 whitespace-nowrap">
                        {p.receiptNumber ? `#${p.receiptNumber}` : '-'}
                      </td>

                      {/* 2. Donor Name */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-stone-900 text-sm font-devanagari">
                          {p.donorName}
                        </div>
                        {p.notes && (
                          <div className="text-[11px] text-stone-500 italic truncate max-w-xs font-devanagari">
                            {isEn ? 'Note:' : 'टीप:'} {p.notes}
                          </div>
                        )}
                      </td>

                      {/* 3. Mobile */}
                      <td className="px-4 py-3.5 font-mono text-stone-700 whitespace-nowrap">
                        {p.donorMobile ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{p.donorMobile}</span>
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      {/* 4. Address */}
                      <td className="px-4 py-3.5 text-stone-700 max-w-[200px] truncate font-devanagari">
                        {p.donorAddress || '-'}
                      </td>

                      {/* 5. Due Amount */}
                      <td className="px-4 py-3.5 font-mono font-bold text-base text-orange-800 whitespace-nowrap">
                        {formatIndianCurrency(balance)}
                      </td>

                      {/* 6. Date */}
                      <td className="px-4 py-3.5 font-mono text-stone-500 whitespace-nowrap">
                        {p.date}
                      </td>

                      {/* 7. Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-md font-bold text-[11px] font-devanagari inline-block shadow-sm">
                          {isEn ? 'DUE' : 'बाकी'}
                        </span>
                      </td>

                      {/* 8. Action */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Mark as Paid Action Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenMarkPaid(p)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs font-devanagari shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{isEn ? 'Mark as Paid' : 'पैसे मिळाले'}</span>
                          </button>

                          {/* Preview Due Pavti */}
                          <button
                            type="button"
                            onClick={() => handlePreviewDuePavti(p.id)}
                            title={isEn ? 'View / Share Receipt' : 'बाकी पावती पहा'}
                            className="p-1.5 text-amber-700 hover:text-orange-900 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Due Record */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            title={isEn ? 'Edit' : 'संपादित करा'}
                            className="p-1.5 text-stone-600 hover:text-orange-600 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Due Record */}
                          <button
                            type="button"
                            onClick={() => setCancelPayment(p)}
                            title={isEn ? 'Delete' : 'हटवा'}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. CONFIRM PAYMENT MODAL (MARK AS PAID CONFIRMATION) */}
      {markPaidPayment && (
        <Modal
          isOpen={!!markPaidPayment}
          onClose={() => setMarkPaidPayment(null)}
          title={
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-devanagari">
                {isEn ? 'Confirm Payment' : 'पेमेंट पुष्टीकरण'}
              </span>
            </div>
          }
          description={isEn ? `Confirm that donation has been received from ${markPaidPayment.donorName}?` : `${markPaidPayment.donorName} यांच्याकडून देणगी रक्कम प्राप्त झाली आहे का?`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmPaid} className="space-y-4 pt-1">
            {paidModalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-bold font-devanagari">
                {paidModalError}
              </div>
            )}

            {/* Donor & Amount Box */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-stone-800 space-y-1.5 font-devanagari">
              <div className="flex justify-between">
                <span>{isEn ? 'Donor:' : 'देणगीदार:'}</span>
                <strong className="text-stone-900">{markPaidPayment.donorName}</strong>
              </div>
              <div className="flex justify-between font-bold text-amber-900 text-sm">
                <span>{isEn ? 'Due Amount:' : 'बाकी रक्कम:'}</span>
                <span className="font-mono text-orange-900 text-base">
                  {formatIndianCurrency(
                    markPaidPayment.expectedAmount - (markPaidPayment.receivedAmount || 0)
                  )}
                </span>
              </div>
            </div>

            {/* Received Amount Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Actual Received Amount *' : 'प्रत्यक्षात प्राप्त रक्कम *'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-stone-500">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border-2 border-emerald-500 rounded-xl font-mono font-bold text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Payment Method (Cash or UPI only) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Payment Method :' : 'पेमेंट पद्धत निवडा :'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-devanagari flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-100 border-orange-600 text-orange-950 shadow-sm'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  💵 {isEn ? 'Cash' : 'रोख'}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold font-devanagari flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'UPI'
                      ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-sm'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  📱 {isEn ? 'UPI' : 'यूपीआय'}
                </button>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="space-y-1 pt-1 animate-in fade-in">
                  <label className="block text-[11px] font-bold text-blue-900 font-devanagari">
                    {isEn ? 'UPI Ref / UTR Number (Optional)' : 'यूपीआय संदर्भ क्रमांक (ऐच्छिक)'}
                  </label>
                  <input
                    type="text"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder={isEn ? 'e.g. 423589123456' : 'उदा. 423589123456'}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-xs font-mono"
                  />
                </div>
              )}
            </div>

            {/* Payment Date */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Payment Date' : 'पेमेंट दिनांक'}
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Notes (Optional)' : 'टीप'}
              </label>
              <input
                type="text"
                value={paidNotes}
                onChange={(e) => setPaidNotes(e.target.value)}
                placeholder={isEn ? 'e.g. Received in full' : 'उदा. वर्गणी प्राप्त झाली'}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMarkPaidPayment(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingPaid}
                className="font-devanagari font-bold px-5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isEn ? 'Confirm Paid' : 'होय, पैसे जमा झाले'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. EDIT DUE RECORD MODAL */}
      {editPayment && (
        <Modal
          isOpen={!!editPayment}
          onClose={() => setEditPayment(null)}
          title={
            <div className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-orange-600" />
              <span className="font-devanagari">
                {isEn ? 'Edit Pending Record' : 'बाकी नोंद बदल करा'}
              </span>
            </div>
          }
          description={isEn ? 'Update donor details or expected amount.' : 'देणगीदाराचे नाव, मोबाईल किंवा अपेक्षित रक्कम अद्ययावत करा.'}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmEdit} className="space-y-4">
            {editModalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-bold font-devanagari">
                {editModalError}
              </div>
            )}

            {/* Donor Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Donor Full Name *' : 'देणगीदाराचे पूर्ण नाव *'}
              </label>
              <input
                type="text"
                required
                value={editDonorName}
                onChange={(e) => setEditDonorName(e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 font-devanagari font-bold"
              />
            </div>

            {/* Mobile & Expected Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  {isEn ? 'Mobile Number' : 'मोबाईल नंबर'}
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={editDonorMobile}
                  onChange={(e) => setEditDonorMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  {isEn ? 'Due Amount *' : 'बाकी रक्कम *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editExpectedAmount}
                  onChange={(e) => setEditExpectedAmount(e.target.value)}
                  className="w-full px-3.5 py-2 border-2 border-amber-400 rounded-lg text-xs font-mono font-bold text-stone-900"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Address' : 'पत्ता'}
              </label>
              <input
                type="text"
                value={editDonorAddress}
                onChange={(e) => setEditDonorAddress(e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Notes' : 'टीप'}
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditPayment(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmittingEdit}
                className="font-devanagari font-bold px-4"
              >
                {isEn ? 'Save Changes' : 'बदल सेव्ह करा'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. DELETE DUE RECORD MODAL */}
      {cancelPayment && (
        <Modal
          isOpen={!!cancelPayment}
          onClose={() => setCancelPayment(null)}
          title={
            <div className="flex items-center gap-2 text-red-600 font-devanagari">
              <AlertTriangle className="w-5 h-5" />
              <span>{isEn ? 'Delete Due Record' : 'नोंद कायमस्वरूपी हटवा'}</span>
            </div>
          }
          description={isEn ? 'Are you sure you want to delete this record? This action cannot be undone.' : 'तुम्हाला खात्री आहे का की तुम्हाला ही नोंद हटवायची आहे? ही कृती कायमस्वरूपी आहे.'}
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-1 font-devanagari">
              <div><strong>{isEn ? 'Receipt #:' : 'पावती क्र.:'}</strong> #{cancelPayment.receiptNumber || '-'}</div>
              <div><strong>{isEn ? 'Donor:' : 'देणगीदार:'}</strong> {cancelPayment.donorName}</div>
              <div><strong>{isEn ? 'Due Amount:' : 'बाकी रक्कम:'}</strong> ₹{cancelPayment.expectedAmount}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCancelPayment(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isSubmittingCancel}
                onClick={handleConfirmCancel}
                className="font-devanagari font-bold"
              >
                {isEn ? 'Delete Record' : 'होय, नोंद हटवा'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 4. SHARE / PREVIEW MODAL */}
      {selectedPavti && settings && (
        <>
          <div className="fixed left-[-9999px] top-[-9999px]">
            <PavtiCard
              id="due-preview-pavti-element"
              pavti={selectedPavti}
              settings={settings}
            />
          </div>
          <PavtiShareModal
            isOpen={isShareModalOpen}
            onClose={() => {
              setIsShareModalOpen(false);
              setSelectedPavti(null);
            }}
            pavti={selectedPavti}
            settings={settings}
            elementId="due-preview-pavti-element"
          />
        </>
      )}
    </div>
  );
}
