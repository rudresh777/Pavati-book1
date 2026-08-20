'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  MessageCircle,
  Phone,
  MapPin,
  FileCheck,
  ShieldCheck,
  Bell,
  Clock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { MandalSettings, Announcement } from '@/types';
import { useLanguage } from '@/lib/context/language-context';
import { Card, CardContent } from '@/components/ui/Card';

interface HomeContentProps {
  settings: MandalSettings | null;
  latestAnnouncement: Announcement | null;
}

export function HomeContent({ settings, latestAnnouncement }: HomeContentProps) {
  const { language, t } = useLanguage();

  return (
    <div className="space-y-10 pb-8">
      {/* =======================================================
          1. HERO SECTION (WITH FIXED MANDAL BRANDING)
          ======================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-orange-800 text-white shadow-2xl p-8 sm:p-12 text-center border-4 border-amber-300/40">
        {/* Sacred Ganesha Watermark Symbol */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none text-[18rem] font-black font-devanagari">
          ॐ
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          {/* Top Auspicious Slogan / Fixed Identity Header */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/25 backdrop-blur-sm border border-amber-300/40 text-amber-200 text-xs sm:text-sm font-semibold tracking-wide font-devanagari">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>॥ श्री गणेशाय नमः ॥ • सन २०२६ • ॥ गणपती बाप्पा मोरया ॥</span>
          </div>

          {/* Mandal Name (Fixed Marathi Identity) */}
          <h1 className="text-3xl sm:text-5xl font-black font-devanagari tracking-tight text-amber-50 drop-shadow-md leading-tight">
            {settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ'}
          </h1>

          {/* Mandal Address & Location (Fixed Marathi Identity) */}
          <div className="space-y-1">
            <div className="text-sm sm:text-base font-semibold font-devanagari text-amber-200/95 tracking-wide">
              {settings?.addressMarathi || 'तापडिया नगर अकोला 444001'}
            </div>
            <div className="text-xs sm:text-sm font-medium font-devanagari text-amber-300/90">
              📍 {settings?.locationMarathi || 'अकोला, महाराष्ट्र'}
            </div>
          </div>

          {/* Welcome Text */}
          <p className="text-xs sm:text-sm text-amber-100/95 max-w-2xl mx-auto leading-relaxed pt-2 font-devanagari">
            {language === 'mr'
              ? 'यंदाच्या गणेशोत्सवासाठी मंडळातर्फे सर्व भाविक भक्तांचे सहर्ष स्वागत! आपली देणगी / वर्गणी अधिकृत डिजिटल पावतीद्वारे जमा करा.'
              : 'Warm welcome to all devotees for this year’s Ganeshotsav! Contribute your donations and obtain official instant digital receipts.'}
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {settings?.whatsappGroupLink && (
              <a
                href={settings.whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 font-devanagari"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  {language === 'mr'
                    ? 'मंडळ WhatsApp ग्रुप जॉईन करा'
                    : 'Join Mandal WhatsApp Group'}
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}

            <Link
              href="/login"
              className="px-6 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/30 rounded-xl text-sm font-bold shadow transition-all flex items-center gap-1.5 font-devanagari backdrop-blur-sm"
            >
              <span>{t('login.signInBtn')}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =======================================================
          2. LATEST PUBLISHED ANNOUNCEMENT BANNER
          ======================================================= */}
      {latestAnnouncement && (
        <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-600 text-white rounded-xl shadow flex-shrink-0">
              <Bell className="w-6 h-6 animate-wiggle" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wider bg-orange-100 px-2.5 py-0.5 rounded-full font-devanagari">
                  {t('hero.latestAnnouncement')}
                </span>
                <span className="text-xs text-stone-500 font-medium font-mono">
                  {t('hero.date')} {latestAnnouncement.date}
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-devanagari">
                {language === 'en' && latestAnnouncement.titleEnglish
                  ? latestAnnouncement.titleEnglish
                  : latestAnnouncement.titleMarathi}
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 font-devanagari leading-relaxed">
                {language === 'en' && latestAnnouncement.contentEnglish
                  ? latestAnnouncement.contentEnglish
                  : latestAnnouncement.contentMarathi}
              </p>
              {latestAnnouncement.venue && (
                <div className="text-xs text-amber-900 font-semibold pt-1 flex items-center gap-1.5 font-devanagari">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>{t('hero.venue')} {latestAnnouncement.venue}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =======================================================
          3. MANDAL FEATURES & TRANSPARENCY CARDS
          ======================================================= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-amber-200/80 hover:border-orange-300 transition-colors shadow-sm">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 font-devanagari">
              {t('hero.features.digitalReceipt')}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-devanagari">
              {t('hero.features.digitalReceiptDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 hover:border-orange-300 transition-colors shadow-sm">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 font-devanagari">
              {t('hero.features.secure')}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-devanagari">
              {t('hero.features.secureDesc')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 hover:border-orange-300 transition-colors shadow-sm">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 font-devanagari">
              {t('hero.features.group')}
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-devanagari">
              {t('hero.features.groupDesc')}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* =======================================================
          4. MANDAL CONTACT & LOCATION INFO
          ======================================================= */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900 font-devanagari pb-4 border-b border-stone-100 mb-6 flex items-center gap-2">
          <span className="text-orange-600 font-black">॥</span>
          <span>{t('hero.contactHeading')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg flex-shrink-0">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block font-devanagari">
                {t('hero.addressLabel')}
              </span>
              <p className="text-sm font-semibold text-stone-900 font-devanagari mt-0.5">
                {settings?.addressMarathi || 'तापडिया नगर अकोला 444001'}
              </p>
              <p className="text-xs text-stone-500 font-devanagari">
                📍 {settings?.locationMarathi || 'अकोला, महाराष्ट्र'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg flex-shrink-0">
              <Phone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block font-devanagari">
                {t('hero.contactLabel')}
              </span>
              <p className="text-sm font-semibold text-stone-900 font-mono mt-0.5">
                +91 {settings?.contactNumber || '9876543210'}
                {settings?.alternateContact && <span> / +91 {settings.alternateContact}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg flex-shrink-0">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block font-devanagari">
                {t('hero.yearLabel')}
              </span>
              <p className="text-sm font-semibold text-stone-900 font-devanagari mt-0.5">
                सन {settings?.year || '२०२६'} {settings?.regNumber && `(${settings.regNumber})`}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
