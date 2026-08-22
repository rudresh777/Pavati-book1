'use client';

import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import {
  Download,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Users,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Send,
} from 'lucide-react';
import { Pavti, MandalSettings } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useLanguage } from '@/lib/context/language-context';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';
import { PavtiCard } from '@/components/pavti/PavtiCard';

interface PavtiShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  pavti: Pavti;
  settings: MandalSettings;
  elementId?: string;
}

export function PavtiShareModal({
  isOpen,
  onClose,
  pavti,
  settings,
  elementId = 'modal-pavti-preview-element',
}: PavtiShareModalProps) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'IDLE' | 'SUCCESS' | 'UNSUPPORTED' | 'ERROR'>('IDLE');
  const [isTextCopied, setIsTextCopied] = useState(false);

  // Determine if this is a Due / बाकी receipt
  const isDue =
    pavti.status === 'DUE' ||
    !pavti.paymentMethod ||
    pavti.paymentMethod === 'DUE';

  const amountDisplay = pavti.amount;
  const receiptNoFormatted = pavti.receiptNumber?.startsWith('#')
    ? pavti.receiptNumber
    : `#${pavti.receiptNumber || '000001'}`;

  // ============================================================================
  // DYNAMIC WHATSAPP MESSAGE GENERATION
  // ============================================================================
  const generateWhatsAppMessage = () => {
    const mandalName = settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ';
    const groupLink = settings?.whatsappGroupLink ? settings.whatsappGroupLink.trim() : '';

    if (isEn) {
      let msg = `Namaskar 🙏\n\n`;
      msg += `Your digital receipt has been generated on behalf of ${mandalName}.\n\n`;
      msg += `Receipt Number: ${receiptNoFormatted}\n\n`;
      msg += isDue
        ? `Due Amount: ₹${amountDisplay}\n\n`
        : `Donation Amount: ₹${amountDisplay}\n\n`;

      if (groupLink) {
        msg += `Click the link below to join Mandal WhatsApp Group:\n\n${groupLink}\n\n`;
      }

      msg += `॥ गणपती बाप्पा मोरया ॥`;
      return msg;
    } else {
      // Marathi original required format
      let msg = `नमस्कार 🙏\n\n`;
      msg += `${mandalName}तर्फे आपली डिजिटल पावती तयार करण्यात आली आहे.\n\n`;
      msg += `पावती क्रमांक: ${receiptNoFormatted}\n\n`;
      msg += isDue
        ? `बाकी रक्कम: ₹${amountDisplay}\n\n`
        : `देणगी रक्कम: ₹${amountDisplay}\n\n`;

      if (groupLink) {
        msg += `मंडळाच्या WhatsApp ग्रुपमध्ये सहभागी होण्यासाठी खालील लिंकवर क्लिक करा:\n\n${groupLink}\n\n`;
      }

      msg += `॥ गणपती बाप्पा मोरया ॥`;
      return msg;
    }
  };

  // ============================================================================
  // GENERATE PAVTI IMAGE (PNG BLOB)
  // ============================================================================
  const generatePavtiImageBlob = async (): Promise<{ blob: Blob; dataUrl: string; fileName: string } | null> => {
    const node = document.getElementById(elementId) || document.getElementById('modal-pavti-preview-element');
    if (!node) {
      console.error('Pavti preview element not found in DOM');
      return null;
    }

    const dataUrl = await toPng(node, {
      quality: 1.0,
      pixelRatio: 3,
      backgroundColor: '#FFFDF7',
      cacheBust: true,
      style: {
        transform: 'none',
        margin: '0 auto',
      },
    });

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const fileName = `Pavti_${pavti.receiptNumber || '000001'}_${(pavti.donorName || 'Donor').replace(/\s+/g, '_')}.png`;

    return { blob, dataUrl, fileName };
  };

  // ============================================================================
  // 1. STEP 1: COPY PAVTI IMAGE TO CLIPBOARD
  // ============================================================================
  const handleCopyPavtiImage = async () => {
    setIsGenerating(true);
    setCopyStatus('IDLE');

    try {
      // Check browser clipboard support for image/png
      if (
        typeof navigator === 'undefined' ||
        !navigator.clipboard ||
        !navigator.clipboard.write ||
        typeof ClipboardItem === 'undefined'
      ) {
        setCopyStatus('UNSUPPORTED');
        return;
      }

      const imgData = await generatePavtiImageBlob();
      if (!imgData) {
        setCopyStatus('ERROR');
        return;
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': imgData.blob }),
      ]);

      setCopyStatus('SUCCESS');
    } catch (err: any) {
      console.warn('Clipboard image copy error:', err);
      setCopyStatus('UNSUPPORTED');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================================
  // 2. STEP 2: OPEN WHATSAPP WITH PRE-FILLED MESSAGE
  // ============================================================================
  const handleOpenWhatsApp = () => {
    const messageText = generateWhatsAppMessage();
    const encodedMsg = encodeURIComponent(messageText);

    // Format clean donor phone with 91 country prefix
    const rawMobile = pavti.donorMobile || '';
    const cleanPhone = rawMobile.replace(/\D/g, '');
    let phoneWithCountry = '';

    if (cleanPhone.length === 10) {
      phoneWithCountry = `91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      phoneWithCountry = cleanPhone;
    } else if (cleanPhone.length > 0) {
      phoneWithCountry = cleanPhone;
    }

    // Direct deep-link URL (works universally on Vercel HTTPS, mobile & desktop)
    const targetUrl = phoneWithCountry
      ? `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // ============================================================================
  // DOWNLOAD PAVTI IMAGE (FALLBACK / MANUAL ATTACH)
  // ============================================================================
  const handleDownloadImage = async () => {
    try {
      setIsGenerating(true);
      const imgData = await generatePavtiImageBlob();
      if (!imgData) {
        alert(isEn ? 'Could not generate receipt image.' : 'पावती फोटो तयार करता आला नाही.');
        return;
      }

      const link = document.createElement('a');
      link.download = imgData.fileName;
      link.href = imgData.dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download Pavti image:', err);
      alert(isEn ? 'Failed to download receipt image.' : 'पावती इमेज डाऊनलोड करण्यात अडचण आली.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================================
  // COPY TEXT MESSAGE ONLY
  // ============================================================================
  const handleCopyTextMessage = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setIsTextCopied(true);
      setTimeout(() => setIsTextCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <span className="font-devanagari text-base sm:text-lg">
            {isEn ? 'Share Receipt on WhatsApp' : 'पावती WhatsApp वर शेअर करा'}
          </span>
        </div>
      }
      description={`${isDue ? (isEn ? 'Due Receipt #' : 'बाकी पावती क्र.') : (isEn ? 'Receipt #' : 'पावती क्र.')} ${receiptNoFormatted} - ${pavti.donorName} (${formatIndianCurrency(amountDisplay)})`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* =======================================================
            WORKFLOW STEP INDICATOR BANNER
            ======================================================= */}
        <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl">
          <div className="text-[11px] font-bold text-amber-950 font-devanagari flex items-center justify-between gap-1 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-mono">1</span>
              <span>{isEn ? 'Copy Image' : 'फोटो कॉपी करा'}</span>
            </span>
            <span className="text-stone-400">➔</span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-mono">2</span>
              <span>{isEn ? 'Open WhatsApp' : 'WhatsApp उघडा'}</span>
            </span>
            <span className="text-stone-400">➔</span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-stone-700 text-white flex items-center justify-center text-[10px] font-mono">3</span>
              <span>{isEn ? 'Paste (Ctrl+V)' : 'Paste करा'}</span>
            </span>
            <span className="text-stone-400">➔</span>
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 rounded-full bg-stone-700 text-white flex items-center justify-center text-[10px] font-mono">4</span>
              <span>{isEn ? 'Send' : 'Send दाबा'}</span>
            </span>
          </div>
        </div>

        {/* =======================================================
            PRIMARY 2-STEP ACTION BUTTONS
            ======================================================= */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* STEP 1 BUTTON: COPY PAVTI IMAGE */}
            <button
              type="button"
              onClick={handleCopyPavtiImage}
              disabled={isGenerating}
              className={`flex items-center justify-center gap-2 p-3.5 rounded-xl font-devanagari font-bold text-sm shadow transition-all active:scale-[0.98] cursor-pointer border ${
                copyStatus === 'SUCCESS'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-400'
                  : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-700'
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>{isEn ? 'Generating Image...' : 'फोटो तयार होत आहे...'}</span>
                </span>
              ) : copyStatus === 'SUCCESS' ? (
                <>
                  <Check className="w-5 h-5 text-white" />
                  <span>{isEn ? '✓ Pavti Image Copied' : '✓ पावती फोटो कॉपी झाला'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-white" />
                  <span>{isEn ? '1. Copy Pavti Image' : '१. पावती फोटो कॉपी करा'}</span>
                </>
              )}
            </button>

            {/* STEP 2 BUTTON: OPEN WHATSAPP */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex items-center justify-center gap-2 p-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl shadow font-devanagari font-bold text-sm transition-all border border-emerald-700 cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 text-white flex-shrink-0" />
              <span>{isEn ? '2. Open WhatsApp' : '२. WhatsApp उघडा'}</span>
              {pavti.donorMobile && (
                <span className="text-[11px] font-mono bg-emerald-800/60 px-2 py-0.5 rounded ml-1">
                  {pavti.donorMobile}
                </span>
              )}
            </button>
          </div>

          {/* SUCCESS STATUS FEEDBACK */}
          {copyStatus === 'SUCCESS' && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-devanagari flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">
                  {isEn ? '✓ Pavti image copied to clipboard!' : '✓ पावती फोटो क्लिपबोर्डवर कॉपी झाला आहे!'}
                </span>
                <p className="text-[11px] text-emerald-800 pt-0.5">
                  {isEn
                    ? 'Now click "Open WhatsApp" and press Ctrl+V (or Paste) in the chat to send the receipt.'
                    : 'आता "WhatsApp उघडा" वर क्लिक करा आणि चॅटमध्ये Paste (Ctrl+V) करून पावती पाठवा.'}
                </p>
              </div>
            </div>
          )}

          {/* UNSUPPORTED STATUS FEEDBACK (CLEAR, HONEST FALLBACK) */}
          {copyStatus === 'UNSUPPORTED' && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-devanagari space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isEn
                    ? 'Image copying is not supported on this device/browser. Please download the Pavti image and attach it manually in WhatsApp.'
                    : 'या डिव्हाइसवर थेट फोटो कॉपी समर्थित नाही. कृपया पावती डाऊनलोड करा आणि WhatsApp वर जोडा.'}
                </p>
              </div>
              <div className="pl-6">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold font-devanagari shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Download Pavti Image' : 'पावती फोटो डाऊनलोड करा'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =======================================================
            SECTION 3: VISUAL RECEIPT PHOTO PREVIEW
            ======================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-devanagari">
              <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
              {isEn ? 'Pavti Render Preview:' : 'पावती पूर्वावलोकन:'}
            </span>
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="text-xs font-semibold text-stone-700 hover:text-stone-900 flex items-center gap-1 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-md border border-stone-300 transition-colors font-devanagari cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isEn ? 'Download Image' : 'फोटो डाऊनलोड करा'}</span>
            </button>
          </div>

          <div className="bg-stone-100/70 p-2 sm:p-3 rounded-2xl border border-stone-200/80 max-h-60 sm:max-h-64 overflow-y-auto shadow-inner">
            <div className="transform scale-[0.80] sm:scale-90 origin-top -mb-14 sm:-mb-6">
              <PavtiCard
                id="modal-pavti-preview-element"
                pavti={pavti}
                settings={settings}
              />
            </div>
          </div>
        </div>

        {/* =======================================================
            SECTION 4: PRE-FILLED MESSAGE PREVIEW
            ======================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-devanagari">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              {isEn ? 'Prepared WhatsApp Message Text:' : 'तयार झालेला WhatsApp मेसेज मजकूर:'}
            </span>
            <button
              type="button"
              onClick={handleCopyTextMessage}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors font-devanagari cursor-pointer active:scale-95"
            >
              {isTextCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">{isEn ? 'Copied!' : 'कॉपी झाले!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Copy Text' : 'मजकूर कॉपी करा'}</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-devanagari text-stone-800 whitespace-pre-wrap font-medium leading-relaxed max-h-40 overflow-y-auto">
            {generateWhatsAppMessage()}
          </div>
        </div>
      </div>
    </Modal>
  );
}
