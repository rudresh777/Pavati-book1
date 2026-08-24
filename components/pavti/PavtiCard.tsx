'use client';

import React from 'react';
import {
  FileText,
  Calendar,
  User,
  Phone,
  PenTool,
  Banknote,
  Smartphone,
  AlertTriangle,
} from 'lucide-react';
import { MandalSettings, Pavti } from '@/types';
import {
  formatIndianCurrency,
  numberToWordsEnglish,
  numberToWordsMarathi,
} from '@/lib/utils/number-to-words';
import { useLanguage } from '@/lib/context/language-context';
import {
  CornerOrnament,
  FloralDivider,
  RupeeMedallion,
  TempleSilhouette,
  OfficialStamp,
} from './PavtiOrnaments';
import { GANPATI_IMAGE_DATA_URI } from '@/lib/assets/ganpati-image';

interface PavtiCardProps {
  pavti: Pavti;
  settings: MandalSettings;
  id?: string;
}

/**
 * Formats a date string reliably to DD-MM-YYYY
 */
function formatReceiptDate(dateStr: string): string {
  if (!dateStr) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch {}
  return dateStr;
}

export function PavtiCard({
  pavti,
  settings,
  id = 'digital-pavti-receipt',
}: PavtiCardProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const enabledDesignations = (settings?.designations || []).filter(
    (d) => d.enabled && d.name
  );

  const isDue =
    pavti.status === 'DUE' ||
    !pavti.paymentMethod ||
    pavti.paymentMethod === 'DUE';

  // Amount in words
  const amountWords = isEn
    ? pavti.amountInWordsEnglish || numberToWordsEnglish(pavti.amount)
    : pavti.amountInWordsMarathi || numberToWordsMarathi(pavti.amount);

  // Format Receipt Number
  const rawReceiptNum = pavti.receiptNumber || '000001';
  const displayReceiptNumber = rawReceiptNum.startsWith('#')
    ? rawReceiptNum
    : `#${rawReceiptNum}`;

  const formattedDate = formatReceiptDate(pavti.date);

  // Clean numeric amount without rupee symbol for custom bold rendering
  const formattedAmountNum = formatIndianCurrency(pavti.amount).replace('₹', '').trim();

  // Payment method label and icon
  const isUPI = pavti.paymentMethod === 'UPI';
  const paymentModeLabel = isDue
    ? (isEn ? 'DUE' : 'बाकी')
    : isUPI
    ? 'UPI'
    : 'Cash';

  return (
    <div className="w-full max-w-[620px] mx-auto p-1 sm:p-2">
      {/* 
        ========================================================================
        OFFICIAL PREMIUM GANPATI MANDAL DONATION PAVTI
        Design: Dedicated Right-Side Ganpati Artwork + Structured Left/Center Form
        ========================================================================
      */}
      <div
        id={id}
        className="relative bg-[#fffefb] text-stone-900 rounded-2xl overflow-hidden shadow-2xl transition-all select-none border-[3px] border-[#b45309]"
        style={{
          boxShadow:
            '0 15px 35px -5px rgba(180, 83, 9, 0.2), 0 0 0 1px rgba(217, 119, 6, 0.25)',
          background:
            'linear-gradient(180deg, #fffdf8 0%, #fffbf2 40%, #fffdf8 100%)',
        }}
      >
        {/* ====================================================================
            LAYER 0: DECORATIVE CORNER FILIGREE & INNER BORDERS
            ==================================================================== */}
        <div className="absolute inset-1.5 sm:inset-2 rounded-xl border border-amber-600/35 pointer-events-none z-10" />
        <div className="absolute inset-2.5 sm:inset-3 rounded-lg border border-dashed border-amber-500/30 pointer-events-none z-10" />

        {/* 4 Corner Traditional Filigree */}
        <CornerOrnament position="top-left" className="absolute top-1 left-1 z-20 opacity-80" />
        <CornerOrnament position="top-right" className="absolute top-1 right-1 z-20 opacity-80" />
        <CornerOrnament position="bottom-left" className="absolute bottom-1 left-1 z-20 opacity-80" />
        <CornerOrnament position="bottom-right" className="absolute bottom-1 right-1 z-20 opacity-80" />

        {/* ====================================================================
            LAYER 1: MAIN RECEIPT CONTENT CONTAINER
            ==================================================================== */}
        <div className="relative z-20 px-4 sm:px-6 pt-3 pb-3 space-y-3">
          {/* ------------------------------------------------------------------
              1. TOP AUSPICIOUS SLOGAN (STRICTLY MARATHI: वर्ष १६)
              ------------------------------------------------------------------ */}
          <div className="text-center pt-0.5">
            <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-[13px] font-bold text-[#451806] font-devanagari tracking-wide drop-shadow-sm">
              <span>॥ श्री गणेशाय नमः ॥</span>
              <span className="text-[#a1400e] font-extrabold">•</span>
              <span className="text-[#641b06] font-extrabold">वर्ष १६</span>
              <span className="text-[#a1400e] font-extrabold">•</span>
              <span>॥ गणपती बाप्पा मोरया ॥</span>
            </div>
            {/* Ornate Gold Floral Divider */}
            <FloralDivider className="opacity-80 my-0.5" />
          </div>

          {/* ------------------------------------------------------------------
              2. TOP SECTION: MANDAL IDENTITY (LEFT) + GANPATI ARTWORK (RIGHT)
              ------------------------------------------------------------------ */}
          <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
            {/* LEFT 7-COLUMNS: MANDAL NAME, ADDRESS, LOCATION & RECEIPT BADGES */}
            <div className="col-span-12 sm:col-span-7 space-y-2 text-left pl-1">
              {/* Mandal Name */}
              <div className="space-y-0.5">
                <h1
                  className="text-2xl sm:text-3xl font-black font-devanagari tracking-tight leading-tight"
                  style={{
                    color: '#70081e',
                    textShadow:
                      '0 1px 2px rgba(112, 8, 30, 0.25), 0 2px 8px rgba(245, 158, 11, 0.25)',
                  }}
                >
                  {settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ'}
                </h1>
              </div>

              {/* Address Badge Ribbon */}
              <div className="inline-block">
                <div
                  className="px-2.5 sm:px-3 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold text-white font-devanagari tracking-wide shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #571309 0%, #3e0c05 100%)',
                    boxShadow: '0 2px 4px rgba(62, 12, 5, 0.3)',
                    border: '1px solid rgba(251, 191, 36, 0.5)',
                  }}
                >
                  {settings?.addressMarathi || 'तापडिया नगर अकोला 444001'}
                </div>
              </div>

              {/* Location Tag */}
              <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-[#451806] font-devanagari pt-0.5">
                <span className="text-red-600">📍</span>
                <span>{settings?.locationMarathi || 'अकोला, महाराष्ट्र'}</span>
              </div>

              {/* RECEIPT NO & DATE BADGES */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {/* Receipt Number Badge */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#fffdf7] border border-[#d6aa65] shadow-sm">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#691807] text-white flex items-center justify-center flex-shrink-0 shadow-inner">
                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] sm:text-[10px] font-semibold text-stone-600 leading-tight font-devanagari">
                      {isEn ? 'Receipt No.' : 'पावती क्र.'}
                    </div>
                    <div className="mt-0.5">
                      <span className="inline-block font-mono font-black text-[11px] sm:text-xs px-1.5 py-0.5 rounded bg-[#571309] text-white shadow-inner tracking-wide">
                        {displayReceiptNumber}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Badge */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#fffdf7] border border-[#d6aa65] shadow-sm">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#691807] text-white flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-200" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[9px] sm:text-[10px] font-semibold text-stone-600 leading-tight font-devanagari">
                      {isEn ? 'Date' : 'दिनांक'}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-stone-900 font-mono tracking-tight mt-0.5 truncate">
                      {formattedDate}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT 5-COLUMNS: DEDICATED VISUAL GANPATI ARTWORK PANEL */}
            <div className="col-span-12 sm:col-span-5 flex justify-center sm:justify-end">
              <div
                className="relative w-full max-w-[210px] sm:max-w-[230px] h-[180px] sm:h-[210px] rounded-2xl overflow-hidden border-2 border-[#d6aa65]/70 shadow-md flex items-center justify-center bg-[#fffdf8]"
              >
                {/* Radiant Golden Sunburst Glow Behind Ganpati */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 35%, rgba(251, 191, 36, 0.45) 0%, rgba(245, 158, 11, 0.2) 50%, transparent 75%)',
                  }}
                />

                {/* 100% Reliable Multi-Layer Ganpati Idol Artwork for WebKit/Safari foreignObject & Canvas */}
                {/* Layer 1: Native SVG Image (Always rendered synchronously by WebKit & Safari canvas) */}
                <svg
                  viewBox="0 0 300 300"
                  className="w-full h-full absolute inset-0 z-10"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <image
                    href={GANPATI_IMAGE_DATA_URI}
                    xlinkHref={GANPATI_IMAGE_DATA_URI}
                    x="0"
                    y="0"
                    width="300"
                    height="300"
                    preserveAspectRatio="xMidYMin slice"
                  />
                </svg>

                {/* Layer 2: CSS Background Image */}
                <div
                  className="w-full h-full absolute inset-0 z-10 pointer-events-none"
                  style={{
                    backgroundImage: `url("${GANPATI_IMAGE_DATA_URI}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 12%',
                    backgroundRepeat: 'no-repeat',
                  }}
                />

                {/* Subtle soft edge gradient transitions */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#fffdf8]/60 via-transparent to-transparent pointer-events-none z-20" />
                <div className="absolute inset-0 rounded-2xl border border-amber-400/40 pointer-events-none z-20" />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
              3. DONOR INFORMATION CARD (ELEGANT PARCHMENT CONTAINER)
              ------------------------------------------------------------------ */}
          <div
            className="rounded-xl p-2.5 sm:p-3 space-y-2 border border-[#d6aa65] shadow-sm"
            style={{
              background: 'rgba(255, 253, 247, 0.95)',
              boxShadow: 'inset 0 1px 3px rgba(217, 119, 6, 0.05)',
            }}
          >
            {/* ROW 1: DONOR NAME */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#691807] text-amber-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <div className="flex-1 flex items-baseline gap-2 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-[#451806] whitespace-nowrap font-devanagari">
                  {isEn ? 'Donor Name :' : 'देणगीदाराचे नाव :'}
                </span>
                <span className="font-bold text-sm sm:text-base text-stone-950 font-devanagari truncate">
                  {pavti.donorName || (isEn ? 'Anonymous Donor' : 'देणगीदार')}
                </span>
              </div>
            </div>

            {/* ROW 2: MOBILE & ADDRESS */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 sm:gap-2 items-center text-xs pt-1 border-t border-dotted border-[#c89d54]/60">
              {/* Mobile */}
              <div className="sm:col-span-6 flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#691807] text-amber-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div className="flex-1 flex items-baseline gap-2 min-w-0">
                  <span className="text-[11px] sm:text-xs font-bold text-[#451806] whitespace-nowrap font-devanagari">
                    {isEn ? 'Mobile :' : 'मोबाईल :'}
                  </span>
                  <span className="font-mono font-bold text-xs sm:text-sm text-stone-900 truncate">
                    {pavti.donorMobile || '-'}
                  </span>
                </div>
              </div>

              {/* Address */}
              <div className="sm:col-span-6 flex items-baseline gap-1.5 pl-8 sm:pl-0 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-[#451806] whitespace-nowrap font-devanagari">
                  {isEn ? 'Address :' : 'पत्ता :'}
                </span>
                <span
                  className="font-medium text-[11px] sm:text-xs text-stone-800 font-devanagari truncate"
                  title={pavti.donorAddress || ''}
                >
                  {pavti.donorAddress || (isEn ? 'Not specified' : 'उल्लेख नाही')}
                </span>
              </div>
            </div>

            {/* ROW 3: AMOUNT IN WORDS */}
            <div className="flex items-center gap-2 pt-1 border-t border-dotted border-[#c89d54]/60">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#691807] text-amber-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <PenTool className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <div className="flex-1 flex items-baseline gap-2 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-[#451806] whitespace-nowrap font-devanagari">
                  {isEn ? 'In Words :' : 'रक्कम अक्षरी :'}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-stone-800 font-devanagari italic truncate">
                  {amountWords}
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
              4. AMOUNT PAID & PAYMENT MODE (PROMINENT HIGHLIGHT SECTION)
              ------------------------------------------------------------------ */}
          <div
            className="rounded-xl p-2.5 sm:p-3 border border-[#d6aa65] shadow-sm flex items-center justify-between gap-2"
            style={{
              background:
                'linear-gradient(135deg, rgba(255, 252, 240, 0.98) 0%, rgba(254, 245, 215, 0.92) 100%)',
            }}
          >
            {/* LEFT: RUPEE MEDALLION + AMOUNT PAID */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <RupeeMedallion />
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-bold text-[#451806] font-devanagari leading-tight">
                  {isDue
                    ? (isEn ? 'Due Amount' : 'बाकी रक्कम')
                    : (isEn ? 'Amount Paid' : 'जमा रक्कम')}
                </div>
                <div className="flex items-baseline gap-0.5">
                  <span className="text-xl sm:text-2xl font-black text-[#c2410c] font-devanagari">
                    ₹
                  </span>
                  <span
                    className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none"
                    style={{ color: '#c2410c' }}
                  >
                    {formattedAmountNum}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: MODE OF PAYMENT */}
            <div className="flex flex-col items-end pl-2">
              <div className="text-[10px] sm:text-[11px] font-bold text-stone-600 font-devanagari text-right mb-1">
                {isEn ? 'Mode of Payment' : 'देयक पद्धत'}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-[#d6aa65] shadow-sm">
                {isDue ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : isUPI ? (
                  <Smartphone className="w-4 h-4 text-[#70081e] flex-shrink-0" />
                ) : (
                  <div className="w-5 h-4 bg-[#691807] text-white rounded flex items-center justify-center text-[10px]">
                    <Banknote className="w-3.5 h-3.5 text-amber-200" />
                  </div>
                )}
                <span className="font-bold text-xs sm:text-sm text-stone-900 font-devanagari">
                  {paymentModeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------------
              5. FOOTER WITH BLESSING, TEMPLE SILHOUETTE & OFFICIAL STAMP
              ------------------------------------------------------------------ */}
          <div className="relative pt-1 pb-1">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
              {/* Left: Traditional Gratitude & Blessing / Committee Designations */}
              <div className="text-center sm:text-left space-y-0.5">
                <div className="text-xs sm:text-[13px] font-bold text-[#451806] font-devanagari">
                  आपल्या उदार देणगीबद्दल मनःपूर्वक धन्यवाद!
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-[#641b06] font-devanagari">
                  • ॥ गणपती बाप्पा मोरया ॥ •
                </div>

                {/* Optional Committee Designations if enabled */}
                {enabledDesignations.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-0.5 pt-1 text-[10px] text-stone-700 font-devanagari">
                    {enabledDesignations.map((d) => (
                      <span key={d.id}>
                        <strong className="text-[#451806]">{d.titleMarathi}:</strong> {d.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Official Stamp Seal */}
              <div className="flex-shrink-0">
                <OfficialStamp
                  status={isDue ? 'DUE' : 'PAID'}
                  authId={pavti.id ? `pavti-${pavti.id.slice(0, 4)}` : undefined}
                  isEn={isEn}
                />
              </div>
            </div>

            {/* Bottom Temple Silhouette Motif */}
            <div className="pt-2 opacity-75 overflow-hidden">
              <TempleSilhouette className="h-6 sm:h-7" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
