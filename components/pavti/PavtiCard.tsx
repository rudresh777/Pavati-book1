'use client';

import React from 'react';
import { MandalSettings, Pavti } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';
import { useLanguage } from '@/lib/context/language-context';

interface PavtiCardProps {
  pavti: Pavti;
  settings: MandalSettings;
  id?: string;
}

export function PavtiCard({ pavti, settings, id = 'digital-pavti-receipt' }: PavtiCardProps) {
  const { language } = useLanguage();
  const enabledDesignations = (settings?.designations || []).filter((d) => d.enabled && d.name);
  const isDue = pavti.status === 'DUE' || !pavti.receiptNumber;

  return (
    <div className="w-full max-w-xl mx-auto p-2 sm:p-4">
      {/* 
        Official Traditional Indian Mandal Receipt Book Layout
        Theme: Saffron / Gold / Warm White with decorative ethnic borders
      */}
      <div
        id={id}
        className="relative bg-[#fffdfa] text-stone-900 border-[3px] border-amber-600 rounded-2xl shadow-pavti overflow-hidden p-6 sm:p-8 space-y-4"
        style={{
          boxShadow: '0 10px 30px -5px rgba(234, 88, 12, 0.15), 0 0 0 1px rgba(217, 119, 6, 0.2)',
        }}
      >
        {/* Subtle Watermark in Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none text-[16rem] font-black font-devanagari text-orange-950">
          ॐ
        </div>

        {/* TOP HEADER SECTION: MANDAL IDENTITY */}
        <div className="relative z-10 text-center space-y-1 pb-3 border-b-2 border-amber-600/60">
          {/* TOP AUSPICIOUS SLOGAN (Mandal identity remains Marathi) */}
          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-amber-900 font-devanagari">
            <span>{settings?.taglineMarathi || '॥ श्री गणेशाय नमः ॥'}</span>
            <span>•</span>
            <span>सन {settings?.year || '२०२६'}</span>
            {settings?.sloganMarathi && (
              <>
                <span>•</span>
                <span>{settings.sloganMarathi}</span>
              </>
            )}
          </div>

          {/* MANDAL TITLE (Mandal identity name always in Marathi) */}
          <div className="pt-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-orange-700 font-devanagari tracking-tight drop-shadow-sm">
              {settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ'}
            </h1>
            {settings?.addressMarathi && (
              <div className="text-xs sm:text-sm font-semibold text-amber-900 font-devanagari mt-0.5">
                {settings.addressMarathi}
              </div>
            )}
          </div>

          {/* LOCATION & REG DETAILS */}
          <div className="text-xs text-stone-600 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 pt-0.5 font-devanagari">
            {settings?.locationMarathi && <span>📍 {settings.locationMarathi}</span>}
            {settings?.regNumber && <span>| नोंदणी क्र. {settings.regNumber}</span>}
            {settings?.contactNumber && <span>| 📞 {settings.contactNumber}</span>}
          </div>
        </div>

        {/* RECEIPT NUMBER & DATE HEADER */}
        <div className="relative z-10 flex items-center justify-between py-3 border-b border-amber-200/80 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900 font-devanagari">
              {language === 'mr' ? 'पावती क्र. :' : 'Receipt No :'}
            </span>
            {isDue ? (
              <span className="font-bold text-xs sm:text-sm px-3 py-1 bg-amber-100 text-amber-900 border-2 border-amber-400 rounded-lg shadow-sm font-devanagari">
                {language === 'mr' ? 'बाकी (DUE)' : 'DUE (बाकी)'}
              </span>
            ) : (
              <span className="font-mono font-bold text-base px-2.5 py-0.5 bg-amber-50 text-orange-800 border border-amber-300 rounded shadow-inner">
                #{pavti.receiptNumber}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-900 font-devanagari">
              {language === 'mr' ? 'दिनांक :' : 'Date :'}
            </span>
            <span className="font-medium text-stone-800 font-mono">
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

          {/* MOBILE NUMBER & ADDRESS */}
          {(pavti.donorMobile || pavti.donorAddress) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {pavti.donorMobile && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-amber-900 whitespace-nowrap font-devanagari">
                    मोबाईल (Mobile) :
                  </span>
                  <div className="flex-1 text-xs sm:text-sm font-medium text-stone-800 border-b border-dotted border-amber-600/70 pb-0.5 px-1 font-mono">
                    {pavti.donorMobile}
                  </div>
                </div>
              )}
              {pavti.donorAddress && (
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold text-amber-900 whitespace-nowrap font-devanagari">
                    पत्ता (Address) :
                  </span>
                  <div className="flex-1 text-xs sm:text-sm font-medium text-stone-800 border-b border-dotted border-amber-600/70 pb-0.5 px-1 truncate font-devanagari">
                    {pavti.donorAddress}
                  </div>
                </div>
              )}
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

          {/* AMOUNT BOX & PAYMENT STATUS */}
          <div className={`pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl border ${
            isDue ? 'bg-amber-50/90 border-amber-400' : 'bg-amber-50/80 border-amber-300'
          }`}>
            {/* Amount Box */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="font-bold text-base text-amber-950 font-devanagari">
                {isDue ? (language === 'mr' ? 'बाकी रक्कम :' : 'Due Amount :') : (language === 'mr' ? 'जमा रक्कम :' : 'Amount Paid :')}
              </span>
              <div className={`px-4 py-1.5 text-white font-extrabold text-xl sm:text-2xl rounded-lg shadow font-mono tracking-tight ${
                isDue ? 'bg-amber-600' : 'bg-orange-600'
              }`}>
                {formatIndianCurrency(pavti.amount)}
              </div>
            </div>

            {/* Payment Status & Ref */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-stone-700 w-full sm:w-auto justify-start sm:justify-end font-devanagari">
              <span className="font-semibold text-amber-900">
                {isDue ? 'स्थिती :' : 'प्रकार :'}
              </span>
              {isDue ? (
                <span className="px-3 py-1 bg-amber-200 border border-amber-400 rounded-md font-bold text-amber-950">
                  {language === 'mr' ? 'बाकी (DUE)' : 'DUE (बाकी)'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-white border border-amber-300 rounded font-semibold text-orange-800">
                  {pavti.paymentMethod === 'UPI' ? 'UPI / Online' : 'रोख (Cash)'}
                </span>
              )}
              {pavti.transactionReference && (
                <span className="text-xs text-stone-500 font-mono">
                  (Ref: {pavti.transactionReference})
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

          {/* DIGITAL STAMP */}
          <div className="flex flex-col items-center">
            {isDue ? (
              <div className="px-4 py-2 rounded-xl border-2 border-dashed border-amber-500 bg-amber-50 text-center shadow-inner">
                <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block font-devanagari">
                  अधिकृत डिजिटल नोंद
                </span>
                <span className="text-sm font-black text-amber-900 font-devanagari tracking-wider">
                  बाकी / DUE
                </span>
              </div>
            ) : (
              <div className="stamp-paid">
                <span className="text-xs tracking-wider">अधिकृत पावती</span>
                <span className="text-sm font-black tracking-widest font-mono">PAID / जमा</span>
              </div>
            )}
            <span className="text-[9px] text-stone-400 font-mono pt-1">
              Auth ID: {pavti.id.substring(0, 10)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
