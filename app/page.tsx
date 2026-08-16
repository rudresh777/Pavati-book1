import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Calendar,
  MessageCircle,
  Phone,
  MapPin,
  LogIn,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Bell,
} from 'lucide-react';
import { getStorageProvider } from '@/lib/storage';
import { Card, CardContent } from '@/components/ui/Card';

export const revalidate = 0;

export default async function HomePage() {
  const storage = getStorageProvider();
  await storage.init();

  const settings = await storage.getSettings();
  const announcements = await storage.getAnnouncements(true);
  const latestAnnouncement = announcements[0] || null;

  return (
    <div className="space-y-12 pb-8">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-orange-800 text-white shadow-xl p-8 sm:p-12 text-center border-4 border-amber-300/40">
        {/* Subtle Ganesha background watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none select-none text-[18rem] font-black font-devanagari">
          ॐ
        </div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-4">
          {/* Top Marathi Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/25 backdrop-blur-sm border border-amber-300/40 text-amber-200 text-xs sm:text-sm font-semibold tracking-wide font-devanagari">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{settings?.taglineMarathi || '॥ श्री गणेशाय नमः ॥'}</span>
            <span>•</span>
            <span>सन {settings?.year || '२०२६'}</span>
          </div>

          {/* Main Mandal Name */}
          <h1 className="text-3xl sm:text-5xl font-black font-devanagari tracking-tight text-amber-50 drop-shadow-md leading-tight">
            {settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ'}
          </h1>
          {settings?.mandalNameEnglish && (
            <p className="text-sm sm:text-base font-medium text-amber-100/90 tracking-wide uppercase">
              {settings.mandalNameEnglish}
            </p>
          )}

          {/* Slogan & Blessing */}
          <div className="text-lg sm:text-xl font-bold font-devanagari text-amber-200 pt-1">
            {settings?.sloganMarathi || '॥ गणपती बाप्पा मोरया ॥'}
          </div>

          <p className="text-xs sm:text-sm text-amber-100/90 max-w-2xl mx-auto leading-relaxed pt-2">
            यंदाच्या गणेशोत्सवासाठी मंडळातर्फे सर्व भाविक भक्तांचे सहर्ष स्वागत! आपली देणगी / वर्गणी अधिकृत डिजिटल पावतीद्वारे जमा करा.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-white text-orange-800 hover:bg-amber-50 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 font-devanagari hover:scale-105"
            >
              <LogIn className="w-4 h-4 text-orange-600" />
              <span>थेट डॅशबोर्डवर जा (Open Dashboard)</span>
              <ArrowRight className="w-4 h-4 text-orange-600" />
            </Link>

            {settings?.whatsappGroupLink && (
              <a
                href={settings.whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 font-devanagari hover:scale-105"
              >
                <MessageCircle className="w-4 h-4" />
                <span>मंडळ WhatsApp ग्रुप जॉईन करा</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* LATEST ANNOUNCEMENT BANNER IF AVAILABLE */}
      {latestAnnouncement && (
        <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-600 text-white rounded-xl shadow flex-shrink-0">
              <Bell className="w-6 h-6 animate-wiggle" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-orange-800 uppercase tracking-wider bg-orange-100 px-2.5 py-0.5 rounded-full">
                  महत्त्वाची सूचना (Latest Announcement)
                </span>
                <span className="text-xs text-stone-500 font-medium">
                  दिनांक: {latestAnnouncement.date}
                </span>
              </div>
              <h3 className="text-lg font-bold text-stone-900 font-devanagari">
                {latestAnnouncement.titleMarathi}
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 font-devanagari leading-relaxed">
                {latestAnnouncement.contentMarathi}
              </p>
              {latestAnnouncement.venue && (
                <div className="text-xs text-amber-900 font-semibold pt-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-600" />
                  <span>स्थान: {latestAnnouncement.venue}</span>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* MANDAL FEATURES & TRANSPARENCY CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-amber-200/80 hover:border-orange-300">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 font-devanagari">
              अधिकृत डिजिटल पावती (Digital Receipt)
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-devanagari">
              देणगी स्वीकारल्यानंतर तत्काळ अधिकृत अनुक्रमांकासह डिजिटल पावती तयार होते व WhatsApp वर थेट शेअर केली जाते.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 hover:border-orange-300">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 font-devanagari">
              १००% पारदर्शक व सुरक्षित (Secure & Safe)
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-devanagari">
              प्रत्येक पावतीची नोंद सुरक्षित खाजगी सर्व्हरवर होते. रोख किंवा UPI दोन्ही माध्यमातून पारदर्शक पावती दिली जाते.
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-200/80 hover:border-orange-300">
          <CardContent className="p-6 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 font-devanagari">
              मंडळ WhatsApp ग्रुप (Community Group)
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed font-devanagari">
              उत्सवाचे सर्व कार्यक्रम, आरती, महाप्रसाद व अपडेट्स मिळवण्यासाठी सर्व भाविक मंडळाच्या ग्रुपमध्ये सामील होऊ शकतात.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* MANDAL CONTACT & LOCATION INFO */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-stone-900 font-devanagari pb-4 border-b border-stone-100 mb-6 flex items-center gap-2">
          <span className="text-orange-600 font-black">॥</span>
          <span>मंडळ संपर्क व स्थान माहिती</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg flex-shrink-0">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                पत्ता व स्थान
              </span>
              <p className="text-sm font-semibold text-stone-900 font-devanagari mt-0.5">
                {settings?.addressMarathi || settings?.locationMarathi || 'पुणे, महाराष्ट्र'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg flex-shrink-0">
              <Phone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                संपर्क क्रमांक
              </span>
              <p className="text-sm font-semibold text-stone-900 mt-0.5">
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
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                उत्सव वर्ष व नोंदणी
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
