'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileCheck,
  Clock,
  User,
  Phone,
  MapPin,
  CreditCard,
  Sparkles,
  CheckCircle,
  HelpCircle,
  QrCode,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppMode } from '@/lib/context/mode-context';
import { numberToWordsMarathi, numberToWordsEnglish, formatIndianCurrency } from '@/lib/utils/number-to-words';
import { MandalSettings, Payment, Pavti, Donor } from '@/types';
import { PavtiCard } from '@/components/pavti/PavtiCard';
import { PavtiShareModal } from '@/components/pavti/PavtiShareModal';

const QUICK_AMOUNTS = [101, 251, 501, 1001, 2100, 5001, 11000];

function NewPavtiForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPendingQuery = searchParams.get('pending') === 'true';

  const { mode, user } = useAppMode();

  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [amount, setAmount] = useState<string>('501');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'OTHER'>('CASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isPendingRecord, setIsPendingRecord] = useState(isPendingQuery);
  const [enablePartial, setEnablePartial] = useState(false);
  const [expectedAmount, setExpectedAmount] = useState('1001');

  // Donor search autocomplete
  const [donorSuggestions, setDonorSuggestions] = useState<Donor[]>([]);
  const [selectedDonorId, setSelectedDonorId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Generated Pavti result state
  const [generatedResult, setGeneratedResult] = useState<{
    payment: Payment;
    pavti: Pavti;
  } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  // Search existing donors when typing name or mobile
  const handleSearchDonor = async (text: string) => {
    if (!text || text.length < 2) {
      setDonorSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/donors?q=${encodeURIComponent(text)}&mode=${mode}`);
      const data = await res.json();
      if (data.donors) {
        setDonorSuggestions(data.donors.slice(0, 4));
      }
    } catch {
      // ignore
    }
  };

  const handleSelectDonor = (donor: Donor) => {
    setSelectedDonorId(donor.id);
    setDonorName(donor.name);
    setDonorMobile(donor.mobile || '');
    setDonorAddress(donor.address || '');
    setDonorSuggestions([]);
  };

  const numAmount = Number(amount) || 0;
  const numExpected = isPendingRecord
    ? Number(expectedAmount) || numAmount
    : enablePartial
    ? Number(expectedAmount) || numAmount
    : numAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!donorName.trim()) {
      setError('कृपया देणगीदाराचे नाव प्रविष्ट करा.');
      return;
    }

    if (!isPendingRecord && numAmount <= 0) {
      setError('कृपया वैध रक्कम प्रविष्ट करा (किमान ₹१).');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: selectedDonorId,
          donorName: donorName.trim(),
          donorMobile: donorMobile.trim(),
          donorAddress: donorAddress.trim(),
          amount: isPendingRecord ? 0 : numAmount,
          expectedAmount: numExpected,
          status: isPendingRecord ? 'PENDING' : enablePartial ? 'PARTIALLY_PAID' : 'PAID',
          paymentMethod,
          transactionReference: transactionReference.trim(),
          notes: notes.trim(),
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'पावती नोंद करण्यात त्रुटी आली.');
      }

      if (!isPendingRecord && data.pavti) {
        // Trigger celebratory confetti on official Pavti generation
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#f59e0b', '#10b981'],
        });

        setGeneratedResult({
          payment: data.payment,
          pavti: data.pavti,
        });
        setIsShareModalOpen(true);
      } else {
        // Redirect to pending list
        router.push('/pending?success=true');
      }
    } catch (err: any) {
      setError(err.message || 'त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900">
              {isPendingRecord ? 'नवीन बाकी नोंद (Record Pending)' : 'नवीन अधिकृत पावती (New Pavti)'}
            </h1>
            <p className="text-xs text-stone-500 font-devanagari">
              {isPendingRecord
                ? 'देणगीदार नंतर पैसे देणार असल्यास येथे नोंद करा.'
                : 'वर्गणी / देणगी रक्कम जमा करून अधिकृत पावती तयार करा.'}
            </p>
          </div>
        </div>

        {/* Toggle Mode Button */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setIsPendingRecord(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-devanagari transition-all ${
              !isPendingRecord
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            अधिकृत पावती (Paid)
          </button>
          <button
            type="button"
            onClick={() => setIsPendingRecord(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold font-devanagari transition-all ${
              isPendingRecord
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            येणे बाकी (Pending)
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <Card className="border-amber-300 shadow-pavti">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: DONOR INFORMATION */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider font-devanagari flex items-center gap-1.5 pb-2 border-b border-amber-100">
                <User className="w-4 h-4 text-orange-600" />
                <span>१. देणगीदाराची माहिती (Donor Details)</span>
              </h3>

              {/* Donor Name with suggestions */}
              <div className="space-y-1 relative">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  देणगीदाराचे पूर्ण नाव (श्री. / सौ.) *
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => {
                    setDonorName(e.target.value);
                    setSelectedDonorId(null);
                    handleSearchDonor(e.target.value);
                  }}
                  placeholder="उदा. श्री. राहुल वसंत कदम"
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500"
                />

                {/* Autocomplete suggestions */}
                {donorSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-stone-100">
                    <div className="p-2 bg-amber-50 text-[11px] font-bold text-amber-900 font-devanagari">
                      पूर्वीचे देणगीदार आढळले (क्लिक करून निवडा):
                    </div>
                    {donorSuggestions.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleSelectDonor(d)}
                        className="w-full p-2.5 text-left text-xs hover:bg-stone-50 flex items-center justify-between transition-colors"
                      >
                        <div className="font-bold text-stone-900 font-devanagari">{d.name}</div>
                        <div className="text-stone-500 font-mono">
                          {d.mobile || 'मोबाईल नाही'} • एकूण: {formatIndianCurrency(d.totalContributed)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile & Address Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700 font-devanagari flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-400" />
                    <span>मोबाईल क्रमांक (Mobile Number)</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={donorMobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setDonorMobile(val);
                      if (val.length >= 4) handleSearchDonor(val);
                    }}
                    placeholder="उदा. 98XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700 font-devanagari flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>पत्ता / इमारत / विंग (ऐच्छिक)</span>
                  </label>
                  <input
                    type="text"
                    value={donorAddress}
                    onChange={(e) => setDonorAddress(e.target.value)}
                    placeholder="उदा. फ्लॅट ३०२, गणेश कृपा इमारत"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: AMOUNT & NUMBER TO WORDS */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider font-devanagari flex items-center gap-1.5 pb-2 border-b border-amber-100">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span>२. देणगी / वर्गणी रक्कम (Amount & Details)</span>
              </h3>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 font-devanagari">
                    {isPendingRecord ? 'अपेक्षित देणगी रक्कम (Expected Amount ₹) *' : 'जमा रक्कम (Received Amount ₹) *'}
                  </label>
                  <span className="text-xs font-bold text-orange-600 font-mono">
                    {formatIndianCurrency(isPendingRecord ? numExpected : numAmount)}
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={isPendingRecord ? expectedAmount : amount}
                    onChange={(e) => {
                      if (isPendingRecord) setExpectedAmount(e.target.value);
                      else setAmount(e.target.value);
                    }}
                    placeholder="501"
                    className="w-full pl-9 pr-4 py-3 bg-amber-50/50 border-2 border-amber-300 rounded-xl text-xl font-bold font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Quick Amount Selector Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        if (isPendingRecord) setExpectedAmount(amt.toString());
                        else setAmount(amt.toString());
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all border ${
                        (isPendingRecord ? Number(expectedAmount) : numAmount) === amt
                          ? 'bg-orange-600 text-white border-orange-600 shadow'
                          : 'bg-stone-50 hover:bg-amber-100/70 text-stone-800 border-stone-200'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Realtime Number-in-words preview */}
                <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 space-y-0.5">
                  <div className="text-xs font-bold text-amber-950 font-devanagari">
                    अक्षरी : {numberToWordsMarathi(isPendingRecord ? numExpected : numAmount)}
                  </div>
                  <div className="text-[11px] text-stone-500 italic">
                    In words: {numberToWordsEnglish(isPendingRecord ? numExpected : numAmount)}
                  </div>
                </div>
              </div>

              {/* PAYMENT METHOD (Only if Paid) */}
              {!isPendingRecord && (
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-stone-700 font-devanagari">
                    पैसे भरण्याचा प्रकार (Payment Method)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`p-3.5 rounded-xl border-2 font-bold text-xs sm:text-sm font-devanagari flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'CASH'
                          ? 'bg-amber-100/80 border-orange-600 text-orange-950 shadow-sm'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>💵 रोख (Cash)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('UPI')}
                      className={`p-3.5 rounded-xl border-2 font-bold text-xs sm:text-sm font-devanagari flex items-center justify-center gap-2 transition-all ${
                        paymentMethod === 'UPI'
                          ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-sm'
                          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span>📱 UPI / Online</span>
                    </button>
                  </div>

                  {paymentMethod === 'UPI' && (
                    <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5 animate-in fade-in">
                      <label className="block text-xs font-bold text-blue-900 font-devanagari">
                        UPI संदर्भ क्रमांक / UTR Ref No. (ऐच्छिक)
                      </label>
                      <input
                        type="text"
                        value={transactionReference}
                        onChange={(e) => setTransactionReference(e.target.value)}
                        placeholder="उदा. 423589123456 किंवा GooglePay/PhonePe Ref"
                        className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Notes / Ticker */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  विशेष टीप (Notes / Reference - Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="उदा. महाप्रसाद देणगी / आरती वर्गणी"
                  className="w-full px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* SUBMIT ACTION BUTTON */}
            <div className="pt-4 border-t border-stone-200">
              <Button
                type="submit"
                variant={isPendingRecord ? 'secondary' : 'gold'}
                size="lg"
                isLoading={isLoading}
                className="w-full py-4 text-base font-bold font-devanagari shadow-lg"
              >
                {isPendingRecord ? (
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-900" />
                    <span>बाकी नोंद सेव्ह करा (Save Pending)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5" />
                    <span>अधिकृत पावती फाडा व शेअर करा (Generate Pavti)</span>
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* PAVTI GENERATED SUCCESS MODAL & SHARE DIALOG */}
      {generatedResult && settings && (
        <>
          <div className="fixed left-[-9999px] top-[-9999px]">
            <PavtiCard
              id="new-pavti-preview-element"
              pavti={generatedResult.pavti}
              settings={settings}
            />
          </div>

          <PavtiShareModal
            isOpen={isShareModalOpen}
            onClose={() => {
              setIsShareModalOpen(false);
              router.push(`/pavti/${generatedResult.pavti.receiptNumber}`);
            }}
            pavti={generatedResult.pavti}
            settings={settings}
            elementId="new-pavti-preview-element"
          />
        </>
      )}
    </div>
  );
}

export default function NewPavtiPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">फॉर्म लोड होत आहे...</div>}>
      <NewPavtiForm />
    </Suspense>
  );
}
