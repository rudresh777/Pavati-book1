'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Download,
  Share2,
  Printer,
  PlusCircle,
  ArrowLeft,
  CheckCircle,
  FileCheck,
  MessageSquare,
  Users,
  ExternalLink,
} from 'lucide-react';
import { PavtiCard } from '@/components/pavti/PavtiCard';
import { PavtiShareModal } from '@/components/pavti/PavtiShareModal';
import { Button } from '@/components/ui/Button';
import { Pavti, MandalSettings } from '@/types';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';

export default function PavtiDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { mode } = useAppMode();
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const [pavti, setPavti] = useState<Pavti | null>(null);
  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    async function loadPavti() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/pavtis/${id}?mode=${mode}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || (isEn ? 'Receipt not found' : 'पावती सापडली नाही'));

        setPavti(data.pavti);
        setSettings(data.settings);
      } catch (err: any) {
        setError(err.message || (isEn ? 'Failed to load receipt' : 'पावती लोड करण्यात त्रुटी आली'));
      } finally {
        setIsLoading(false);
      }
    }
    loadPavti();
  }, [id, mode, isEn]);

  if (isLoading) {
    return (
      <div className="text-center py-20 font-devanagari text-stone-600">
        {t('common.loading')}
      </div>
    );
  }

  if (error || !pavti || !settings) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="text-red-500 font-bold text-lg font-devanagari">
          {error || (isEn ? 'Receipt not found' : 'पावती सापडली नाही')}
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="font-devanagari">
            {isEn ? 'Return to Dashboard' : 'डॅशबोर्डवर परत जा'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold font-devanagari text-stone-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-orange-600" />
              <span>{isEn ? `Digital Receipt #${pavti.receiptNumber}` : `डिजिटल पावती क्र. #${pavti.receiptNumber}`}</span>
            </h1>
            <p className="text-xs text-stone-500 font-mono">
              {pavti.donorName} • {pavti.date}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="gold"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 font-devanagari py-2 px-3.5 shadow"
          >
            <Share2 className="w-4 h-4" />
            <span>{isEn ? 'Share / Download' : 'शेअर / डाउनलोड'}</span>
          </Button>

          <Link href="/pavti/new">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1.5 font-devanagari py-2 px-3"
            >
              <PlusCircle className="w-4 h-4 text-orange-600" />
              <span>{t('ledger.newPavti')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK WHATSAPP ACTIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-xl shadow-sm font-devanagari font-bold text-sm transition-all text-center"
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span>
            {isEn ? 'Share Receipt on WhatsApp' : 'WhatsApp वर पावती पाठवा'}
          </span>
        </button>

        {settings?.whatsappGroupLink ? (
          <a
            href={settings.whatsappGroupLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white rounded-xl shadow-sm font-devanagari font-bold text-sm transition-all text-center"
          >
            <Users className="w-4 h-4 flex-shrink-0" />
            <span>
              {isEn ? 'Join Mandal WhatsApp Group' : 'मंडळ WhatsApp ग्रुप जॉईन करा'}
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 px-4 bg-stone-100 border border-stone-200 text-stone-400 rounded-xl font-devanagari text-xs text-center">
            <Users className="w-4 h-4" />
            <span>
              {isEn ? 'No group link configured' : 'ग्रुप लिंक उपलब्ध नाही'}
            </span>
          </div>
        )}
      </div>

      {/* PRINTABLE PAVTI CARD CONTAINER */}
      <div className="py-4 flex justify-center">
        <PavtiCard
          id="view-pavti-element"
          pavti={pavti}
          settings={settings}
        />
      </div>

      {/* BOTTOM HELPFUL ACTIONS */}
      <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-devanagari">
            {isEn
              ? 'Receipt is securely stored in database. You can download or share anytime.'
              : 'पावती सुरक्षितपणे जतन करण्यात आली आहे. आपण हवी तेव्हा ही पावती पुन्हा डाउनलोड किंवा शेअर करू शकता.'}
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 font-bold text-stone-700 hover:text-stone-900 bg-white px-3 py-1.5 rounded-lg border border-stone-300 shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>{isEn ? 'Print' : 'प्रिंट करा'}</span>
        </button>
      </div>

      {/* SHARE MODAL */}
      <PavtiShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        pavti={pavti}
        settings={settings}
        elementId="view-pavti-element"
      />
    </div>
  );
}
