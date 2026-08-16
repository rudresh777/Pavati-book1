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
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAppMode } from '@/lib/context/mode-context';
import { Payment, Pavti, MandalSettings } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';
import { PavtiCard } from '@/components/pavti/PavtiCard';
import { PavtiShareModal } from '@/components/pavti/PavtiShareModal';

export default function PendingPaymentsPage() {
  const { mode } = useAppMode();

  const [pendingList, setPendingList] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Mark as Paid Modal State
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'OTHER'>('CASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Generated Pavti for sharing
  const [generatedPavti, setGeneratedPavti] = useState<Pavti | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchPendingData = async () => {
    setIsLoading(true);
    try {
      const [payRes, setRes] = await Promise.all([
        fetch(`/api/payments?status=PENDING&mode=${mode}`),
        fetch(`/api/settings`),
      ]);

      const payData = await payRes.json();
      const setData = await setRes.json();

      if (payData.payments) setPendingList(payData.payments);
      if (setData.settings) setSettings(setData.settings);
    } catch (err) {
      console.error('Failed to fetch pending payments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, [mode]);

  const handleOpenMarkPaidModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setReceivedAmount((payment.expectedAmount - payment.receivedAmount).toString());
    setPaymentMethod('CASH');
    setTransactionReference('');
    setNotes('');
    setModalError('');
  };

  const handleConfirmPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;

    const numAmt = Number(receivedAmount);
    if (!numAmt || numAmt <= 0) {
      setModalError('कृपया वैध प्राप्त रक्कम प्रविष्ट करा.');
      return;
    }

    setIsSubmitting(true);
    setModalError('');

    try {
      const res = await fetch(`/api/payments/${selectedPayment.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivedAmount: numAmt,
          paymentMethod,
          transactionReference: transactionReference.trim(),
          notes: notes.trim(),
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'पेमेंट नोंद करण्यात अडचण आली.');

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ea580c', '#f59e0b', '#10b981'],
      });

      setSelectedPayment(null);
      setGeneratedPavti(data.pavti);
      setIsShareModalOpen(true);
      fetchPendingData();
    } catch (err: any) {
      setModalError(err.message || 'काहीतरी त्रुटी आली.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPending = pendingList.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.donorName.toLowerCase().includes(q) ||
      p.donorMobile?.includes(q) ||
      (p.donorAddress && p.donorAddress.toLowerCase().includes(q))
    );
  });

  const totalPendingAmount = pendingList.reduce(
    (sum, p) => sum + (p.expectedAmount - p.receivedAmount),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-600" />
            <span>येणे बाकी देणगी यादी (Pending Collections)</span>
          </h1>
          <p className="text-xs text-stone-500 font-devanagari">
            ज्या देणगीदारांची वर्गणी येणे बाकी आहे त्यांची यादी. पैसे आल्यावर "जमा करा" वर क्लिक करा.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-100/80 px-4 py-2 rounded-xl border border-amber-300 text-right">
            <div className="text-[10px] font-bold text-amber-900 uppercase font-devanagari">
              एकूण येणे बाकी रक्कम:
            </div>
            <div className="text-lg font-black text-amber-950 font-mono">
              {formatIndianCurrency(totalPendingAmount)}
            </div>
          </div>

          <Link href="/pavti/new?pending=true">
            <Button variant="primary" size="sm" className="font-devanagari py-2 px-3 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" />
              <span>+ बाकी नोंद</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="देणगीदाराचे नाव किंवा मोबाईल नंबर शोधा..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-devanagari"
        />
      </div>

      {/* Pending Table / Cards */}
      {filteredPending.length === 0 ? (
        <Card className="border-dashed border-stone-300">
          <CardContent className="p-12 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-stone-800 font-devanagari">
              {searchQuery ? 'शोध परिणामात कोणतीही नोंद आढळली नाही' : 'सध्या कोणतीही बाकी रक्कम प्रलंबित नाही'}
            </h3>
            <p className="text-xs text-stone-500 font-devanagari">
              सर्व देणगीदारांच्या पावत्या अधिकृतपणे जमा झालेल्या आहेत.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPending.map((p) => (
            <Card key={p.id} className="border-amber-200/90 hover:border-amber-400 transition-all shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-base text-stone-900 font-devanagari">
                      {p.donorName}
                    </h3>
                    {p.donorMobile && (
                      <div className="text-xs text-stone-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{p.donorMobile}</span>
                      </div>
                    )}
                  </div>
                  <Badge variant="warning">बाकी (Pending)</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-stone-600">
                  <div className="flex items-center justify-between">
                    <span className="font-devanagari">अपेक्षित देणगी:</span>
                    <span className="font-bold text-stone-900 font-mono text-sm">
                      {formatIndianCurrency(p.expectedAmount)}
                    </span>
                  </div>

                  {p.receivedAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="font-devanagari">आतापर्यंत जमा:</span>
                      <span className="font-bold font-mono">
                        {formatIndianCurrency(p.receivedAmount)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 font-bold text-amber-900">
                    <span className="font-devanagari">शिल्लक येणे बाकी:</span>
                    <span className="font-mono text-base">
                      {formatIndianCurrency(p.expectedAmount - p.receivedAmount)}
                    </span>
                  </div>
                </div>

                {p.donorAddress && (
                  <div className="text-[11px] text-stone-500 truncate font-devanagari">
                    📍 {p.donorAddress}
                  </div>
                )}

                {p.notes && (
                  <div className="text-[11px] text-stone-500 italic bg-stone-50 p-2 rounded border border-stone-100">
                    टीप: {p.notes}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="gold"
                    size="sm"
                    onClick={() => handleOpenMarkPaidModal(p)}
                    className="w-full font-devanagari py-2 font-bold flex items-center justify-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>पैसे मिळाले (Mark as Paid)</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MARK AS PAID MODAL */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title={
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="font-devanagari">रक्कम जमा करा व पावती फाडा</span>
            </div>
          }
          description={`देणगीदार: ${selectedPayment.donorName}`}
          maxWidth="md"
        >
          <form onSubmit={handleConfirmPaid} className="space-y-4">
            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-bold">
                {modalError}
              </div>
            )}

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-stone-700 space-y-1">
              <div className="flex justify-between">
                <span>अपेक्षित देणगी रक्कम:</span>
                <span className="font-bold font-mono">
                  {formatIndianCurrency(selectedPayment.expectedAmount)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-amber-900">
                <span>शिल्लक बाकी:</span>
                <span className="font-mono">
                  {formatIndianCurrency(
                    selectedPayment.expectedAmount - selectedPayment.receivedAmount
                  )}
                </span>
              </div>
            </div>

            {/* Received Amount */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                प्रत्यक्ष प्राप्त रक्कम (Received Amount ₹) *
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
                  className="w-full pl-8 pr-3.5 py-2.5 bg-white border-2 border-orange-400 rounded-xl font-mono font-bold text-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                पैसे भरण्याचा प्रकार (Payment Mode)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold font-devanagari ${
                    paymentMethod === 'CASH'
                      ? 'bg-amber-100 border-orange-600 text-orange-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  💵 रोख (Cash)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold font-devanagari ${
                    paymentMethod === 'UPI'
                      ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold'
                      : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  📱 UPI / Online
                </button>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="space-y-1 pt-1">
                  <label className="block text-[11px] font-bold text-blue-900">
                    UPI Ref / UTR No. (ऐच्छिक)
                  </label>
                  <input
                    type="text"
                    value={transactionReference}
                    onChange={(e) => setTransactionReference(e.target.value)}
                    placeholder="उदा. 423589123456"
                    className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-xs font-mono"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                टीप (Notes - Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="उदा. रोख रक्कम स्वीकारली"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayment(null)}
              >
                रद्द करा
              </Button>
              <Button
                type="submit"
                variant="gold"
                size="sm"
                isLoading={isSubmitting}
                className="font-devanagari font-bold px-4"
              >
                पावती तयार करा व सेव्ह करा
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* SHARE MODAL AFTER MARKING PAID */}
      {generatedPavti && settings && (
        <>
          <div className="fixed left-[-9999px] top-[-9999px]">
            <PavtiCard
              id="pending-marked-pavti-element"
              pavti={generatedPavti}
              settings={settings}
            />
          </div>
          <PavtiShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            pavti={generatedPavti}
            settings={settings}
            elementId="pending-marked-pavti-element"
          />
        </>
      )}
    </div>
  );
}
