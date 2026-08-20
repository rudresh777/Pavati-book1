'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileCheck,
  User,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  ArrowLeft,
  Search,
  ExternalLink,
  PlusCircle,
  X,
  History,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
  const isEn = language === 'en';

  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [donorName, setDonorName] = useState('');
  const [donorMobile, setDonorMobile] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [amount, setAmount] = useState<string>('501');
  const [paymentChoice, setPaymentChoice] = useState<'CASH' | 'UPI' | 'DUE'>('CASH');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  // Duplicate Donor Modal & State
  const [duplicateCheckDonor, setDuplicateCheckDonor] = useState<Donor | null>(null);
  const [duplicateRecentPavtis, setDuplicateRecentPavtis] = useState<Pavti[]>([]);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isConfirmedForExistingDonor, setIsConfirmedForExistingDonor] = useState(false);

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

  // Check if donor mobile already exists in the system
  const checkDuplicateDonor = async (mobileNum: string, nameText?: string) => {
    const cleanMobile = mobileNum.replace(/\D/g, '');
    if (cleanMobile.length !== 10 && (!nameText || nameText.trim().length < 3)) {
      return;
    }

    try {
      const url = `/api/donors/check?mobile=${encodeURIComponent(cleanMobile)}&name=${encodeURIComponent(nameText || '')}&mode=${mode}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.exists && data.donor) {
        // If this donor is not already the selected donor and not confirmed
        if (selectedDonorId !== data.donor.id && !isConfirmedForExistingDonor) {
          setDuplicateCheckDonor(data.donor);
          setDuplicateRecentPavtis(data.recentPavtis || []);
          setIsDuplicateModalOpen(true);
        }
      }
    } catch {
      // ignore
    }
  };

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

        const cleanMobile = text.replace(/\D/g, '');
        if (cleanMobile.length === 10) {
          checkDuplicateDonor(cleanMobile, donorName);
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
    setIsConfirmedForExistingDonor(true);
    setIsDuplicateModalOpen(false);
  };

  const handleAcceptExistingDonorForNewPavti = () => {
    if (duplicateCheckDonor) {
      handleSelectDonor(duplicateCheckDonor);
    }
  };

  const numAmount = Number(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!donorName.trim()) {
      setError(isEn ? 'Please enter donor name.' : 'कृपया देणगीदाराचे नाव प्रविष्ट करा.');
      return;
    }

    if (numAmount <= 0) {
      setError(isEn ? 'Please enter a valid amount (minimum ₹1).' : 'कृपया वैध रक्कम प्रविष्ट करा (किमान ₹१).');
      return;
    }

    // If mobile number entered is 10 digits and not confirmed yet, verify duplicate before submitting
    const cleanMobile = donorMobile.replace(/\D/g, '');
    if (cleanMobile.length === 10 && !selectedDonorId && !isConfirmedForExistingDonor) {
      try {
        const res = await fetch(`/api/donors/check?mobile=${cleanMobile}&mode=${mode}`);
        const checkData = await res.json();
        if (checkData.exists && checkData.donor) {
          setDuplicateCheckDonor(checkData.donor);
          setDuplicateRecentPavtis(checkData.recentPavtis || []);
          setIsDuplicateModalOpen(true);
          return;
        }
      } catch {}
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
              {isEn ? 'Create New Receipt' : 'नवीन पावती तयार करा'}
            </h1>
            <p className="text-xs text-stone-500 font-devanagari">
              {isEn
                ? 'Generate Cash, UPI, or Due receipts instantly'
                : 'रोख, यूपीआय किंवा येणे बाकी पावती तत्काळ तयार करा'}
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
              <div className="flex items-center justify-between pb-2 border-b border-amber-100">
                <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider font-devanagari flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-600" />
                  <span>{isEn ? '1. Donor Information' : '१. देणगीदाराची माहिती'}</span>
                </h3>
                {selectedDonorId && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-devanagari flex items-center gap-1">
                    <span>✓</span>
                    <span>{isEn ? 'Existing Donor Selected' : 'नोंदणीकृत देणगीदार निवडले'}</span>
                  </span>
                )}
              </div>

              {/* Donor Name with Suggestions */}
              <div className="space-y-1 relative">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  {isEn ? 'Donor Full Name *' : 'देणगीदाराचे पूर्ण नाव *'}
                </label>
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => {
                    setDonorName(e.target.value);
                    if (selectedDonorId) setSelectedDonorId(null);
                    setIsConfirmedForExistingDonor(false);
                    handleSearchDonor(e.target.value);
                  }}
                  onBlur={() => {
                    if (donorName.trim().length >= 3 && !selectedDonorId) {
                      checkDuplicateDonor(donorMobile, donorName);
                    }
                  }}
                  placeholder={isEn ? 'e.g. Rahul Patil' : 'उदा. राहुल पाटील'}
                  className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />

                {/* Autocomplete Suggestions */}
                {donorSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-stone-100">
                    <div className="p-2 bg-amber-50 text-[11px] font-bold text-amber-900 font-devanagari flex items-center justify-between">
                      <span>{isEn ? 'Existing Donors Found:' : 'पूर्वीचे देणगीदार आढळले:'}</span>
                      <button
                        type="button"
                        onClick={() => setDonorSuggestions([])}
                        className="text-stone-400 hover:text-stone-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
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
                          {d.mobile || '-'} • {isEn ? 'Total:' : 'एकूण:'} {formatIndianCurrency(d.totalContributed)}
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
                    <span>{isEn ? 'Mobile Number' : 'मोबाईल नंबर'}</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={donorMobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setDonorMobile(val);
                      if (selectedDonorId) setSelectedDonorId(null);
                      setIsConfirmedForExistingDonor(false);
                      if (val.length === 10) {
                        checkDuplicateDonor(val, donorName);
                      } else if (val.length >= 4) {
                        handleSearchDonor(val);
                      }
                    }}
                    onBlur={() => {
                      if (donorMobile.length === 10 && !selectedDonorId) {
                        checkDuplicateDonor(donorMobile, donorName);
                      }
                    }}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700 font-devanagari flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{isEn ? 'Address' : 'पत्ता'}</span>
                  </label>
                  <input
                    type="text"
                    value={donorAddress}
                    onChange={(e) => setDonorAddress(e.target.value)}
                    placeholder={isEn ? 'e.g. Tapadiya Nagar, Akola' : 'उदा. तापडिया नगर, अकोला'}
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: AMOUNT & PAYMENT / STATUS SELECTION */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider font-devanagari flex items-center gap-1.5 pb-2 border-b border-amber-100">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span>{isEn ? '2. Contribution Amount and Payment Method' : '२. वर्गणी रक्कम व पेमेंट पद्धत'}</span>
              </h3>

              {/* Amount Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 font-devanagari">
                    {paymentChoice === 'DUE'
                      ? (isEn ? 'Expected / Due Amount *' : 'अपेक्षित / येणे बाकी रक्कम *')
                      : (isEn ? 'Received Amount *' : 'प्राप्त रक्कम *')}
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
                    {isEn
                      ? `In Words: ${numberToWordsEnglish(numAmount)}`
                      : `अक्षरी : ${numberToWordsMarathi(numAmount)}`}
                  </div>
                </div>
              </div>

              {/* PAYMENT / STATUS SELECTION (Cash, UPI, Due / बाकी) */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  {isEn ? 'Select Payment Mode :' : 'पेमेंट प्रकार निवडा :'}
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
                    <span>{isEn ? 'Cash' : 'रोख'}</span>
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
                    <span>{isEn ? 'UPI' : 'यूपीआय'}</span>
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
                    <span>{isEn ? 'Due' : 'बाकी'}</span>
                  </button>
                </div>

                {/* Optional UPI Ref Input if UPI selected */}
                {paymentChoice === 'UPI' && (
                  <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5 animate-in fade-in">
                    <label className="block text-xs font-bold text-blue-900 font-devanagari">
                      {isEn ? 'UPI Transaction ID / Ref Number' : 'यूपीआय संदर्भ क्रमांक'}
                    </label>
                    <input
                      type="text"
                      value={transactionReference}
                      onChange={(e) => setTransactionReference(e.target.value)}
                      placeholder={isEn ? 'e.g. 423589123456 or UTR Ref' : 'उदा. 423589123456 किंवा UTR Ref'}
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Due notice strip if Due selected */}
                {paymentChoice === 'DUE' && (
                  <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 font-devanagari space-y-0.5 animate-in fade-in">
                    <div className="font-bold">
                      {isEn ? 'ℹ️ Due Receipt will be created:' : 'ℹ️ बाकी पावती तयार होईल:'}
                    </div>
                    <div className="text-[11px] text-amber-800">
                      {isEn
                        ? 'The receipt will be issued with official number and marked as DUE. This amount will be added to the pending list until paid.'
                        : 'पावतीवर अधिकृत अनुक्रमांक व बाकी स्थिती दिसेल. ही रक्कम बाकी यादीत जोडली जाईल व पैसे मिळाल्यावर याच पावतीवर जमा केली जाईल.'}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  {isEn ? 'Notes (Optional)' : 'टीप'}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={isEn ? 'e.g. Prasad donation / Aarti contribution' : 'उदा. महाप्रसाद देणगी / आरती वर्गणी'}
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
                      ? (isEn ? 'Generate Due Receipt' : 'बाकी पावती तयार करा')
                      : (isEn ? 'Generate Official Receipt' : 'अधिकृत पावती तयार करा')}
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
              router.push(`/pavti/${generatedResult.pavti.receiptNumber || generatedResult.payment.id}`);
            }}
            pavti={generatedResult.pavti}
            settings={settings}
            elementId="new-pavti-preview-element"
          />
        </>
      )}

      {/* DUPLICATE DONOR CONFIRMATION MODAL POPUP */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="font-devanagari font-bold text-base sm:text-lg">
              {isEn ? 'Donor Already Exists!' : 'हा देणगीदार आधीच नोंदणीकृत आहे!'}
            </span>
          </div>
        }
        description={
          isEn
            ? 'A donor with this mobile number/name is already recorded in the system.'
            : 'या मोबाईल नंबरवर/नावावर आधीच देणगीदाराची नोंदणी व पावती झालेली आहे.'
        }
        maxWidth="md"
      >
        {duplicateCheckDonor && (
          <div className="space-y-4">
            {/* Donor Detail Card */}
            <div className="p-3.5 bg-amber-50/90 rounded-xl border border-amber-300 space-y-2">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <div className="font-bold text-sm sm:text-base text-stone-900 font-devanagari">
                  👤 {duplicateCheckDonor.name}
                </div>
                <span className="text-xs font-mono font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded border border-amber-300">
                  📱 {duplicateCheckDonor.mobile || '-'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-devanagari text-stone-700 pt-0.5">
                <div>
                  <span className="text-stone-500">{isEn ? 'Total Donated:' : 'एकूण वर्गणी:'} </span>
                  <span className="font-bold text-orange-700 font-mono">
                    {formatIndianCurrency(duplicateCheckDonor.totalContributed)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500">{isEn ? 'Total Receipts:' : 'एकूण पावत्या:'} </span>
                  <span className="font-bold text-stone-900">
                    {duplicateCheckDonor.pavtiCount} {isEn ? 'Pavtis' : 'पावत्या'}
                  </span>
                </div>
              </div>

              {duplicateCheckDonor.address && (
                <div className="text-xs font-devanagari text-stone-600 truncate pt-0.5 border-t border-amber-200/60">
                  📍 {duplicateCheckDonor.address}
                </div>
              )}
            </div>

            {/* Recent Receipts if available */}
            {duplicateRecentPavtis.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-stone-700 font-devanagari flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-orange-600" />
                  <span>{isEn ? 'Previous Receipts for this Donor:' : 'या देणगीदाराच्या आधीच्या पावत्या:'}</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {duplicateRecentPavtis.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-xs font-devanagari"
                    >
                      <div>
                        <div className="font-bold font-mono text-orange-950">
                          #{p.receiptNumber} • {formatIndianCurrency(p.amount)}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {p.date} • {p.status === 'DUE' ? (isEn ? 'DUE' : 'बाकी') : (isEn ? 'PAID' : 'जमा')}
                        </div>
                      </div>
                      <Link
                        href={`/pavti/${p.receiptNumber || p.id}`}
                        target="_blank"
                        className="px-2 py-1 bg-white hover:bg-orange-50 text-orange-700 border border-orange-200 rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>{isEn ? 'View' : 'पाहा'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-stone-200 space-y-2">
              <Button
                variant="primary"
                onClick={handleAcceptExistingDonorForNewPavti}
                className="w-full py-3 font-devanagari text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>
                  {isEn
                    ? 'Yes, Add Another Receipt for this Donor'
                    : 'होय, याच देणगीदाराची दुसरी पावती बनवा'}
                </span>
              </Button>

              <div className="flex gap-2">
                {duplicateRecentPavtis.length > 0 && (
                  <Link
                    href={`/pavti/${duplicateRecentPavtis[0].receiptNumber || duplicateRecentPavtis[0].id}`}
                    target="_blank"
                    className="flex-1"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full py-2 font-devanagari text-xs text-stone-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      <span>{isEn ? 'View Last Receipt' : 'शेवटची पावती पाहा'}</span>
                    </Button>
                  </Link>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDuplicateModalOpen(false);
                    setDonorMobile('');
                    setSelectedDonorId(null);
                  }}
                  className="flex-1 py-2 font-devanagari text-xs text-red-600 hover:bg-red-50 border-red-200"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  <span>{isEn ? 'Change Mobile / Cancel' : 'माहिती बदला / रद्द करा'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
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
