'use client';

import React from 'react';
import { Pavti, MandalSettings } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';

interface PavtiCardProps {
  pavti: Pavti;
  settings: MandalSettings;
  id?: string;
  isPrintMode?: boolean;
}

export const PavtiCard = React.forwardRef<HTMLDivElement, PavtiCardProps>(
  ({ pavti, settings, id = 'pavti-card-element', isPrintMode = false }, ref) => {
    const enabledDesignations = (settings?.designations || []).filter((d) => d.enabled);

    return (
      <div
        id={id}
        ref={ref}
        className="w-full max-w-[650px] mx-auto bg-[#FFFDF7] text-stone-900 rounded-xl p-6 sm:p-8 shadow-pavti border-2 border-amber-600/80 relative overflow-hidden font-sans select-none"
        style={{
          boxShadow: isPrintMode ? 'none' : undefined,
          backgroundImage: 'radial-gradient(#fed7aa 0.75px, #fffdf7 0.75px)',
          backgroundSize: '16px 16px',
        }}
      >
        {/* Double Ornate Border Accents */}
        <div className="absolute inset-2 border border-amber-500/40 rounded-lg pointer-events-none" />
        <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-amber-700 pointer-events-none" />
        <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-amber-700 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-amber-700 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-amber-700 pointer-events-none" />

        {/* Watermark Motif */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none select-none">
          <span className="text-[12rem] font-bold font-devanagari text-amber-900">ॐ</span>
        </div>

        {/* TOP BANNER / SLOGANS */}
        <div className="relative z-10 text-center space-y-1 pb-3 border-b-2 border-amber-600/60">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 tracking-wider">
            <span>{settings?.taglineMarathi || '॥ श्री गणेशाय नमः ॥'}</span>
            <span className="bg-amber-100 text-amber-900 px-3 py-0.5 rounded-full border border-amber-300 text-[11px] font-semibold">
              सन {settings?.year || '२०२६-२०२७'}
            </span>
            <span>{settings?.sloganMarathi || '॥ गणपती बाप्पा मोरया ॥'}</span>
          </div>

          {/* MANDAL TITLE */}
          <div className="pt-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-orange-700 font-devanagari tracking-tight drop-shadow-sm">
              {settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ'}
            </h1>
            {settings?.mandalNameEnglish && (
              <h2 className="text-xs sm:text-sm font-semibold text-stone-600 tracking-wide uppercase mt-0.5">
                {settings.mandalNameEnglish}
              </h2>
            )}
          </div>

          {/* LOCATION & REG DETAILS */}
          <div className="text-xs text-stone-600 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 pt-0.5">
            {settings?.locationMarathi && <span>📍 {settings.locationMarathi}</span>}
            {settings?.regNumber && <span>| नोंदणी क्र. {settings.regNumber}</span>}
            {settings?.contactNumber && <span>| 📞 {settings.contactNumber}</span>}
          </div>
        </div>

        {/* RECEIPT NUMBER & DATE HEADER */}
        <div className="relative z-10 flex items-center justify-between py-3 border-b border-amber-200/80 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900 font-devanagari">पावती क्र. :</span>
            <span className="font-mono font-bold text-base px-2.5 py-0.5 bg-amber-50 text-orange-800 border border-amber-300 rounded shadow-inner">
              {pavti.receiptNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900 font-devanagari">दिनांक :</span>
            <span className="font-medium text-stone-800">
              {pavti.date}
            </span>
          </div>
        </div>

        {/* MAIN BODY - DONOR & CONTRIBUTION DETAILS */}
        <div className="relative z-10 py-4 space-y-3.5">
          {/* DONOR NAME */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap font-devanagari">
              श्री. / सौ. (Donor Name) :
            </span>
            <div className="flex-1 font-bold text-base sm:text-lg text-stone-900 border-b border-dotted border-amber-600/70 pb-0.5 px-1 font-devanagari">
              {pavti.donorName}
            </div>
          </div>

          {/* MOBILE NUMBER */}
          {pavti.donorMobile && (
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap font-devanagari">
                मोबाईल क्र. (Mobile) :
              </span>
              <div className="flex-1 text-sm font-medium text-stone-800 border-b border-dotted border-amber-600/70 pb-0.5 px-1 font-mono">
                {pavti.donorMobile}
              </div>
            </div>
          )}

          {/* AMOUNT IN WORDS (MARATHI & ENGLISH) */}
          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm font-bold text-amber-900 whitespace-nowrap font-devanagari">
                अक्षरी रुपये (In Words) :
              </span>
              <div className="flex-1 font-semibold text-sm sm:text-base text-stone-900 border-b border-dotted border-amber-600/70 pb-0.5 px-1 font-devanagari text-orange-950">
                {pavti.amountInWordsMarathi}
              </div>
            </div>
            {pavti.amountInWordsEnglish && (
              <div className="text-xs text-stone-500 italic pl-1">
                ({pavti.amountInWordsEnglish})
              </div>
            )}
          </div>

          {/* AMOUNT BOX & PAYMENT MODE */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-50/80 p-3.5 rounded-lg border border-amber-300">
            {/* Amount Box */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="font-bold text-base text-amber-950 font-devanagari">रक्कम :</span>
              <div className="px-4 py-1.5 bg-orange-600 text-white font-extrabold text-xl sm:text-2xl rounded-lg shadow font-mono tracking-tight">
                {formatIndianCurrency(pavti.amount)}
              </div>
            </div>

            {/* Payment Method & Ref */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-stone-700 w-full sm:w-auto justify-start sm:justify-end">
              <span className="font-semibold text-amber-900">प्रकार :</span>
              <span className="px-2.5 py-0.5 bg-white border border-amber-300 rounded font-semibold text-orange-800">
                {pavti.paymentMethod === 'CASH'
                  ? 'रोख (Cash)'
                  : pavti.paymentMethod === 'UPI'
                  ? 'UPI / Online'
                  : 'इतर (Other)'}
              </span>
              {pavti.transactionReference && (
                <span className="text-xs text-stone-500 font-mono">
                  (UTR/Ref: {pavti.transactionReference})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER SECTION: MANDAL OFFICIALS & DIGITAL STAMP */}
        <div className="relative z-10 pt-4 border-t-2 border-amber-600/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Enabled Committee Designations */}
          {enabledDesignations.length > 0 ? (
            <div className="flex flex-wrap items-center gap-4 text-center sm:text-left">
              {enabledDesignations.map((desig) => (
                <div key={desig.id} className="space-y-0.5">
                  <div className="text-[11px] font-bold text-amber-900 font-devanagari">
                    {desig.titleMarathi}
                  </div>
                  <div className="text-xs font-semibold text-stone-800">
                    {desig.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-stone-500 font-devanagari">
              श्रींच्या चरणी सादर केलेली सेवा व देणगी बद्दल धन्यवाद!
            </div>
          )}

          {/* DIGITAL STAMP (NO FAKE PHYSICAL SIGNATURES) */}
          <div className="flex flex-col items-center">
            <div className="stamp-paid">
              <span className="text-xs tracking-wider">अधिकृत पावती</span>
              <span className="text-sm font-black tracking-widest font-mono">PAID / जमा</span>
            </div>
            {pavti.hostName && (
              <span className="text-[10px] text-stone-500 mt-1">
                संकलक : {pavti.hostName}
              </span>
            )}
          </div>
        </div>

        {/* TEST MODE WATERMARK BANNER IF APPLICABLE */}
        {pavti.mode === 'TEST' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-red-500/30 text-red-600/30 font-black text-4xl sm:text-5xl px-8 py-2 rounded-xl pointer-events-none uppercase tracking-widest select-none">
            TEST MODE - नमुना
          </div>
        )}
      </div>
    );
  }
);

PavtiCard.displayName = 'PavtiCard';
