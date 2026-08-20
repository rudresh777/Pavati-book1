'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  Search,
  Download,
  Eye,
  Share2,
  Trash2,
  AlertTriangle,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';
import { Payment, Pavti, MandalSettings } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';
import { PavtiCard } from '@/components/pavti/PavtiCard';
import { PavtiShareModal } from '@/components/pavti/PavtiShareModal';

export default function PaymentsLedgerPage() {
  const { mode } = useAppMode();
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Pavti Share state
  const [selectedPavti, setSelectedPavti] = useState<Pavti | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Delete Individual Record state
  const [deletePaymentTarget, setDeletePaymentTarget] = useState<Payment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const [payRes, setRes] = await Promise.all([
        fetch(`/api/payments?mode=${mode}`),
        fetch('/api/settings'),
      ]);
      const payData = await payRes.json();
      const setData = await setRes.json();

      if (payData.payments) setPayments(payData.payments);
      if (setData.settings) setSettings(setData.settings);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [mode]);

  const handleSharePayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/pavtis?mode=${mode}`);
      const data = await res.json();
      const pavti = (data.pavtis || []).find((p: Pavti) => p.paymentId === paymentId);
      if (pavti) {
        setSelectedPavti(pavti);
        setIsShareModalOpen(true);
      } else {
        alert(isEn ? 'Receipt not found.' : 'पावती सापडली नाही.');
      }
    } catch (err) {
      console.error('Failed to load pavti for share:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletePaymentTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/payments/${deletePaymentTarget.id}?mode=${mode}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEn ? 'Failed to delete record.' : 'नोंद हटवण्यात त्रुटी आली.'));
      }
      setDeletePaymentTarget(null);
      fetchPayments();
    } catch (err: any) {
      alert(err.message || (isEn ? 'Error occurred.' : 'त्रुटी आली.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    // Status filter
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    // Method filter
    if (methodFilter !== 'ALL' && p.paymentMethod !== methodFilter) return false;
    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.donorName.toLowerCase().includes(q) ||
      p.donorMobile?.includes(q) ||
      p.receiptNumber?.toLowerCase().includes(q) ||
      p.transactionReference?.toLowerCase().includes(q)
    );
  });

  // Calculate totals for currently filtered list
  const totalPaidFiltered = filteredPayments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.receivedAmount || 0), 0);

  // Export filtered ledger to CSV
  const handleExportCSV = () => {
    const headers = [
      'Receipt_No',
      'Date',
      'Donor_Name',
      'Mobile',
      'Amount_Received',
      'Expected_Amount',
      'Status',
      'Payment_Method',
      'Transaction_Ref',
      'Host_Name',
      'Notes',
    ];

    const rows = filteredPayments.map((p) => [
      p.receiptNumber || 'N/A',
      p.date,
      `"${p.donorName.replace(/"/g, '""')}"`,
      p.donorMobile || '',
      p.receivedAmount || 0,
      p.expectedAmount || 0,
      p.status,
      p.status === 'DUE' || p.status === 'PENDING' ? 'DUE' : p.paymentMethod,
      p.transactionReference || '',
      `"${(p.hostName || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Mandal_Ledger_${mode}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-orange-600" />
            <span>{t('ledger.title')}</span>
          </h1>
          <p className="text-xs text-stone-500 font-devanagari">
            {t('ledger.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="font-devanagari flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{t('ledger.exportCsv')}</span>
          </Button>

          <Link href="/pavti/new">
            <Button variant="primary" size="sm" className="font-devanagari flex items-center gap-1.5 shadow">
              <PlusCircle className="w-4 h-4" />
              <span>{t('ledger.newPavti')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('ledger.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">{t('ledger.allStatus')}</option>
              <option value="PAID">{t('ledger.paidOnly')}</option>
              <option value="DUE">{isEn ? 'Due Only' : 'फक्त बाकी'}</option>
              <option value="PENDING">{t('ledger.pendingOnly')}</option>
              <option value="CANCELLED">{t('ledger.cancelledOnly')}</option>
            </select>
          </div>

          {/* Method Filter (Strictly Cash and UPI) */}
          <div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-800 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">{t('ledger.allMethods')}</option>
              <option value="CASH">{isEn ? 'Cash Only' : 'फक्त रोख'}</option>
              <option value="UPI">{isEn ? 'UPI Only' : 'फक्त यूपीआय'}</option>
              <option value="DUE">{isEn ? 'Due Only' : 'फक्त बाकी'}</option>
            </select>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="flex flex-wrap items-center justify-between text-xs text-stone-600 pt-2 border-t border-stone-100 font-devanagari">
          <span>
            {t('ledger.totalRecords')} <strong>{filteredPayments.length}</strong>
          </span>
          <span>
            {t('ledger.filteredTotal')} <strong className="text-orange-800 font-mono">{formatIndianCurrency(totalPaidFiltered)}</strong>
          </span>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700 min-w-[760px]">
            <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase font-devanagari">
              <tr>
                <th className="px-4 py-3">{isEn ? 'Receipt #' : 'पावती क्र.'}</th>
                <th className="px-4 py-3">{isEn ? 'Date' : 'दिनांक'}</th>
                <th className="px-4 py-3">{isEn ? 'Donor Name' : 'देणगीदाराचे नाव'}</th>
                <th className="px-4 py-3">{isEn ? 'Amount' : 'रक्कम'}</th>
                <th className="px-4 py-3">{isEn ? 'Status' : 'स्थिती'}</th>
                <th className="px-4 py-3">{isEn ? 'Payment Mode' : 'माध्यम'}</th>
                <th className="px-4 py-3">{isEn ? 'Representative' : 'प्रतिनिधी'}</th>
                <th className="px-4 py-3 text-right">{isEn ? 'Actions' : 'कृती'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-stone-400 font-devanagari">
                    {isEn ? 'No records found.' : 'कोणतीही नोंद आढळली नाही.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isDue = p.status === 'DUE' || p.status === 'PENDING' || p.paymentMethod === 'DUE';
                  return (
                    <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                      {/* 1. Receipt No */}
                      <td className="px-4 py-3 font-mono font-bold text-orange-800 whitespace-nowrap">
                        {p.receiptNumber ? `#${p.receiptNumber}` : '-'}
                      </td>

                      {/* 2. Date */}
                      <td className="px-4 py-3 text-stone-500 font-mono whitespace-nowrap">{p.date}</td>

                      {/* 3. Donor Name */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-stone-900 font-devanagari">{p.donorName}</div>
                        {p.donorMobile && (
                          <div className="text-[11px] text-stone-500 font-mono">{p.donorMobile}</div>
                        )}
                      </td>

                      {/* 4. Amount */}
                      <td className="px-4 py-3 font-bold text-stone-900 font-mono text-sm whitespace-nowrap">
                        {formatIndianCurrency(isDue ? p.expectedAmount : (p.receivedAmount || p.expectedAmount))}
                      </td>

                      {/* 5. Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={
                            p.status === 'PAID'
                              ? 'success'
                              : isDue
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {p.status === 'PAID'
                            ? (isEn ? 'PAID' : 'जमा')
                            : isDue
                            ? (isEn ? 'DUE' : 'बाकी')
                            : (isEn ? 'CANCELLED' : 'रद्द')}
                        </Badge>
                      </td>

                      {/* 6. Payment Mode */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isDue ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold text-[11px] font-devanagari">
                            {isEn ? 'Due' : 'बाकी'}
                          </span>
                        ) : (
                          <div className="font-devanagari font-semibold text-stone-800">
                            {p.paymentMethod === 'CASH' ? (isEn ? 'Cash' : 'रोख') : 'UPI'}
                            {p.transactionReference && (
                              <div className="text-[10px] text-stone-400 font-mono">
                                Ref: {p.transactionReference}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* 7. Host */}
                      <td className="px-4 py-3 text-stone-600 font-devanagari whitespace-nowrap">{p.hostName || (isEn ? 'Admin' : 'प्रतिनिधी')}</td>

                      {/* 8. Actions: View, Share, Delete */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Receipt */}
                          <Link
                            href={`/pavti/${p.receiptNumber || p.id}`}
                            className="p-1.5 text-stone-600 hover:text-orange-600 rounded-lg hover:bg-stone-100 transition-colors"
                            title={isEn ? 'View Receipt' : 'पावती पहा'}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          {/* Share Receipt */}
                          <button
                            type="button"
                            onClick={() => handleSharePayment(p.id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                            title={isEn ? 'Share' : 'शेअर करा'}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          {/* Delete Individual Record */}
                          <button
                            type="button"
                            onClick={() => setDeletePaymentTarget(p)}
                            className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title={isEn ? 'Delete Record' : 'नोंद हटवा'}
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

      {/* INDIVIDUAL RECORD DELETE CONFIRMATION MODAL */}
      {deletePaymentTarget && (
        <Modal
          isOpen={!!deletePaymentTarget}
          onClose={() => setDeletePaymentTarget(null)}
          title={
            <div className="flex items-center gap-2 text-red-600 font-devanagari">
              <AlertTriangle className="w-5 h-5" />
              <span>{isEn ? 'Delete Record Permanently' : 'नोंद कायमस्वरूपी हटवा'}</span>
            </div>
          }
          description={isEn ? 'Are you sure you want to delete this receipt record permanently? This action cannot be undone.' : 'तुम्हाला खात्री आहे का की तुम्हाला ही पावती / देणगी नोंद कायमस्वरूपी हटवायची आहे? ही कृती पूर्ववत केली जाऊ शकत नाही.'}
          maxWidth="sm"
        >
          <div className="space-y-4 pt-2">
            <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-1 font-devanagari">
              <div><strong>{isEn ? 'Receipt #:' : 'पावती क्र.:'}</strong> #{deletePaymentTarget.receiptNumber || deletePaymentTarget.id}</div>
              <div><strong>{isEn ? 'Donor:' : 'देणगीदार:'}</strong> {deletePaymentTarget.donorName}</div>
              <div>
                <strong>{isEn ? 'Amount:' : 'रक्कम:'}</strong> ₹
                {deletePaymentTarget.status === 'DUE'
                  ? deletePaymentTarget.expectedAmount
                  : deletePaymentTarget.receivedAmount || deletePaymentTarget.expectedAmount} (
                {deletePaymentTarget.status === 'DUE' ? (isEn ? 'DUE' : 'बाकी') : (isEn ? 'PAID' : 'जमा')})
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletePaymentTarget(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isDeleting}
                onClick={handleConfirmDelete}
                className="font-devanagari font-bold"
              >
                {isEn ? 'Delete Record' : 'होय, नोंद हटवा'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* SHARE MODAL IF TRIGGERED */}
      {selectedPavti && settings && (
        <>
          <div className="fixed left-[-9999px] top-[-9999px]">
            <PavtiCard
              id="ledger-pavti-share-element"
              pavti={selectedPavti}
              settings={settings}
            />
          </div>
          <PavtiShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            pavti={selectedPavti}
            settings={settings}
            elementId="ledger-pavti-share-element"
          />
        </>
      )}
    </div>
  );
}
