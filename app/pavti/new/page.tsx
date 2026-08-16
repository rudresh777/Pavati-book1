'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileCheck,
  User,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';
import { numberToWordsMarathi, numberToWordsEnglish, formatIndianCurrency } from '@/lib/utils/number-to-words';
import { MandalSettings, Payment, Pavti, Donor } from '@/types';
import { PavtiCard } from '@/components/pavti/PavtiCard';
import { PavtiShareModal } from '@/components/pavti/PavtiShareModal';

const QUICK_AMOUNTS = [101, 251, 501, 1001, 2100, 5001, 11000];

function NewPavtiForm() {
  const router = useRouter();
  const { mode } = useAppMode();
  const { language, t } = useLanguage();

  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [amount, setAmount] = useState<string>('501');
  const [paymentChoice, setPaymentChoice] = useState<'CASH' | 'UPI' | 'DUE'>('CASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  // Duplicate Donor Warning state
  const [existingDonorMatch, setExistingDonorMatch] = useState<Donor | null>(null);
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState(false);

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

        // Check for exact mobile duplicate if mobile is 10 digits
        const cleanMobile = text.replace(/\D/g, '');
        if (cleanMobile.length === 10) {
          const exact = data.donors.find((d: Donor) => d.mobile.replace(/\D/g, '') === cleanMobile);
          if (exact && exact.id !== selectedDonorId && !ignoreDuplicateWarning) {
            setExistingDonorMatch(exact);
          } else {
            setExistingDonorMatch(null);
          }
        }
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
    setExistingDonorMatch(null);
  };

  const numAmount = Number(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!donorName.trim()) {
      setError(language === 'mr' ? 'कृपया देणगीदाराचे नाव प्रविष्ट करा.' : 'Please enter donor name.');
      return;
    }

    if (numAmount <= 0) {
      setError(language === 'mr' ? 'कृपया वैध रक्कम प्रविष्ट करा (किमान ₹१).' : 'Please enter a valid amount (minimum ₹1).');
      return;
    }

    setIsLoading(true);

    try {
      const isDue = paymentChoice === 'DUE';
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donorId: selectedDonorId,
          donorName: donorName.trim(),
          donorMobile: donorMobile.trim(),
          donorAddress: donorAddress.trim(),
          amount: isDue ? 0 : numAmount,
          expectedAmount: numAmount,
          status: isDue ? 'DUE' : 'PAID',
          paymentMethod: isDue ? 'CASH' : paymentChoice,
          transactionReference: isDue ? '' : transactionReference.trim(),
          notes: notes.trim(),
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('common.error'));
      }

      if (!isDue) {
        // Confetti for official Paid Pavti
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#f59e0b', '#10b981'],
        });
      }

      if (data.pavti) {
        setGeneratedResult({
          payment: data.payment,
          pavti: data.pavti,
        });
        setIsShareModalOpen(true);
      }
    } catch (err: any) {
      setError(err.message || t('common.error'));
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
              {language === 'mr' ? 'नवीन पावती तयार करा' : 'Create New Receipt'}
            </h1>
            <p className="text-xs text-stone-500 font-devanagari">
              {language === 'mr'
                ? 'रोख, UPI किंवा येणे बाकी (Due) पावती तत्काळ तयार करा'
                : 'Generate Cash, UPI, or Due receipts instantly'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2 font-devanagari">
          <span>⚠️ {error}</span>
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
                <span>{language === 'mr' ? '१. देणगीदाराची माहिती' : '1. Donor Details'}</span>
              </h3>

              {/* Duplicate Donor Warning Card */}
              {existingDonorMatch && !ignoreDuplicateWarning && (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-xs text-amber-950 font-devanagari">
                    <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span>
                      {language === 'mr'
                        ? 'संभाव्य विद्यमान देणगीदार आढळले (Possible Existing Member)'
                        : 'Possible Existing Member Found'}
                    </span>
                  </div>
                  <div className="text-xs text-stone-700 font-devanagari pl-6">
                    हा मोबाईल नंबर (<strong>{existingDonorMatch.mobile}</strong>) आधीच <strong>{existingDonorMatch.name}</strong> यांच्या नावावर नोंदणीकृत आहे. एकूण जमा: <strong>{formatIndianCurrency(existingDonorMatch.totalContributed)}</strong> ({existingDonorMatch.pavtiCount} पावत्या).
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                    <button
                      type="button"
                      onClick={() => handleSelectDonor(existingDonorMatch)}
                      className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold font-devanagari hover:bg-orange-700 shadow-sm"
                    >
                      विद्यमान माहिती वापरा (Use Existing)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIgnoreDuplicateWarning(true)}
                      className="px-3 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-xs font-semibold font-devanagari"
                    >
                      तरीही नवीन तयार करा (Create Anyway)
                    </button>
                  </div>
                </div>
              )}

              {/* Donor Name with Suggestions */}
              <div className="space-y-1 relative">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  {language === 'mr' ? 'देणगीदाराचे पूर्ण नाव *' : 'Donor Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => {
                    setDonorName(e.target.value);
                    setSelectedDonorId(null);
                    setIgnoreDuplicateWarning(false);
                    handleSearchDonor(e.target.value);
                  }}
                  placeholder={language === 'mr' ? 'उदा. श्री. राहुल पाटील' : 'e.g. Rahul Patil'}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />

                {/* Autocomplete Suggestions */}
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
                        className="w-full p-2.5 text-left text-xs hover:bg-stone-50 flex items-center justify-between transition-colors font-devanagari"
                      >
                        <div className="font-bold text-stone-900">{d.name}</div>
                        <div className="text-stone-500 font-mono">
                          {d.mobile || '-'} • एकूण: {formatIndianCurrency(d.totalContributed)}
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
                    <span>{language === 'mr' ? 'मोबाईल नंबर' : 'Mobile Number'}</span>
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
                    <span>{language === 'mr' ? 'पत्ता / गल्ली' : 'Address'}</span>
                  </label>
                  <input
                    type="text"
                    value={donorAddress}
                    onChange={(e) => setDonorAddress(e.target.value)}
                    placeholder="उदा. तापडिया नगर, अकोला"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: AMOUNT & PAYMENT / STATUS SELECTION */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider font-devanagari flex items-center gap-1.5 pb-2 border-b border-amber-100">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span>{language === 'mr' ? '२. वर्गणी रक्कम व पेमेंट पद्धत' : '2. Amount & Payment Method'}</span>
              </h3>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 font-devanagari">
                    {paymentChoice === 'DUE'
                      ? (language === 'mr' ? 'अपेक्षित / येणे बाकी रक्कम *' : 'Due Amount *')
                      : (language === 'mr' ? 'प्राप्त रक्कम *' : 'Amount Received *')}
                  </label>
                  <span className="text-xs font-bold text-orange-600 font-mono">
                    {formatIndianCurrency(numAmount)}
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
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="501"
                    className="w-full pl-9 pr-4 py-3 bg-amber-50/50 border-2 border-amber-300 rounded-xl text-xl font-bold font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Quick Amount Chips */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt.toString())}
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all border ${
                        numAmount === amt
                          ? 'bg-orange-600 text-white border-orange-600 shadow'
                          : 'bg-stone-50 hover:bg-amber-100/70 text-stone-800 border-stone-200'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Realtime Number-in-words Preview */}
                <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 space-y-0.5">
                  <div className="text-xs font-bold text-amber-950 font-devanagari">
                    अक्षरी (Marathi): {numberToWordsMarathi(numAmount)}
                  </div>
                  <div className="text-[11px] text-stone-500 italic">
                    In Words: {numberToWordsEnglish(numAmount)}
                  </div>
                </div>
              </div>

              {/* PAYMENT / STATUS SELECTION (Cash, UPI, Due / बाकी) */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  {language === 'mr' ? 'पेमेंट प्रकार / स्थिती निवडा :' : 'Select Payment Option / Status :'}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {/* 1. CASH */}
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('CASH')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs sm:text-sm font-devanagari flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                      paymentChoice === 'CASH'
                        ? 'bg-amber-100 border-orange-600 text-orange-950 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>💵</span>
                    <span>{language === 'mr' ? 'रोख (Cash)' : 'Cash'}</span>
                  </button>

                  {/* 2. UPI */}
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('UPI')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs sm:text-sm font-devanagari flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                      paymentChoice === 'UPI'
                        ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>📱</span>
                    <span>{language === 'mr' ? 'UPI (ऑनलाइन)' : 'UPI'}</span>
                  </button>

                  {/* 3. DUE / बाकी */}
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('DUE')}
                    className={`p-3 rounded-xl border-2 font-bold text-xs sm:text-sm font-devanagari flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                      paymentChoice === 'DUE'
                        ? 'bg-amber-200 border-amber-600 text-amber-950 shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>⏳</span>
                    <span>{language === 'mr' ? 'बाकी (Due)' : 'Due / बाकी'}</span>
                  </button>
                </div>

                {/* Optional UPI Ref Input if UPI selected */}
                {paymentChoice === 'UPI' && (
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5 animate-in fade-in">
                    <label className="block text-xs font-bold text-blue-900 font-devanagari">
                      {language === 'mr' ? 'UPI Transaction ID / Ref Number (ऐच्छिक)' : 'UPI Transaction ID / Ref Number (Optional)'}
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

                {/* Due notice strip if Due selected */}
                {paymentChoice === 'DUE' && (
                  <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 font-devanagari space-y-0.5 animate-in fade-in">
                    <div className="font-bold">
                      ℹ️ बाकी (Due) पावती तयार होईल:
                    </div>
                    <div className="text-[11px] text-amber-800">
                      पावतीवर <strong>बाकी / DUE</strong> स्थिती दिसेल. पैसे प्रत्यक्षात मिळेपर्यंत अधिकृत पावती क्रमांक दिला जाणार नाही व ही रक्कम बाकी यादीत जोडली जाईल.
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  {language === 'mr' ? 'नोंद / टीप (Optional Notes)' : 'Notes (Optional)'}
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
                variant={paymentChoice === 'DUE' ? 'gold' : 'primary'}
                size="lg"
                isLoading={isLoading}
                className="w-full py-4 text-base font-bold font-devanagari shadow-lg"
              >
                <span className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  <span>
                    {paymentChoice === 'DUE'
                      ? (language === 'mr' ? 'बाकी पावती तयार करा (Generate Due Pavti)' : 'Generate Due Receipt')
                      : (language === 'mr' ? 'अधिकृत पावती तयार करा (Generate Paid Pavti)' : 'Generate Official Receipt')}
                  </span>
                </span>
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
              if (generatedResult.pavti.status === 'DUE' || !generatedResult.pavti.receiptNumber) {
                router.push('/pending');
              } else {
                router.push(`/pavti/${generatedResult.pavti.receiptNumber}`);
              }
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
    <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
      <NewPavtiForm />
    </Suspense>
  );
}
