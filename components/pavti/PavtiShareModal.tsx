'use client';

import React, { useState, useEffect } from 'react';
import { toJpeg } from 'html-to-image';
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
  Sparkles,
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

interface GeneratedImageData {
  blob: Blob;
  dataUrl: string;
  fileName: string;
  file: File;
}

export function PavtiShareModal({
  isOpen,
  onClose,
  pavti,
  settings,
  elementId = 'modal-pavti-preview-element',
}: PavtiShareModalProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [isGenerating, setIsGenerating] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'IDLE' | 'SUCCESS' | 'UNSUPPORTED' | 'ERROR'>('IDLE');
  const [isTextCopied, setIsTextCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareFeedback, setShareFeedback] = useState('');
  const [cachedImage, setCachedImage] = useState<GeneratedImageData | null>(null);

  // Reset or pre-warm cached image when receipt changes or modal reopens
  useEffect(() => {
    setCachedImage(null);
    setCopyStatus('IDLE');
    setDownloadSuccess(false);
    setShareFeedback('');

    if (isOpen) {
      // Pre-warm the JPEG receipt generation in the background so that user gesture
      // on mobile Safari has the blob instantly ready when user clicks "Copy Receipt Image"
      const timer = setTimeout(() => {
        getOrCreateReceiptImage().catch(() => {});
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pavti.id, pavti.receiptNumber, isOpen]);

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
  // Uses the official Mandal WhatsApp Group Invite Link:
  // https://chat.whatsapp.com/EOO3qPs2WJXF3vcvHtmCaL
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
      // Marathi standard format
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
  // SINGLE SOURCE RECEIPT IMAGE GENERATION & CACHING (REAL JPEG / JPG PHOTO)
  // Reused across Clipboard Copy, Mobile Download, and Native WhatsApp Share
  // ============================================================================
  const getOrCreateReceiptImage = async (): Promise<GeneratedImageData | null> => {
    if (cachedImage) {
      return cachedImage;
    }

    const node =
      document.getElementById(elementId) ||
      document.getElementById('modal-pavti-preview-element') ||
      document.getElementById('view-pavti-element') ||
      document.getElementById('new-pavti-preview-element');

    if (!node) {
      console.error('Pavti preview element not found in DOM');
      return null;
    }

    // High quality single-source JPEG render (0.95 quality for crystal clear Marathi typography)
    const dataUrl = await toJpeg(node, {
      quality: 0.95,
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

    // Meaningful dynamic filename: Pavti_000005.jpg
    const cleanReceiptNo = (pavti.receiptNumber || '000001')
      .replace(/^#/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Pavti_${cleanReceiptNo}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });

    const result: GeneratedImageData = { blob, dataUrl, fileName, file };
    setCachedImage(result);
    return result;
  };

  // Helper to trigger browser image file download into phone gallery/downloads as real JPEG
  const triggerDownload = (blob: Blob, fileName: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = blobUrl;
    link.dataset.downloadurl = ['image/jpeg', fileName, blobUrl].join(':');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  };

  // ============================================================================
  // 1. SAVE TO PHONE GALLERY / PHOTOS (Real JPEG photo via Native Share / Download)
  // On iOS Safari: Opens native sheet with "Save Image" to save directly to Camera Roll/Photos
  // On Android/Desktop: Saves/downloads Pavti_000005.jpg directly
  // ============================================================================
  const handleSaveToGallery = async () => {
    try {
      setIsGenerating(true);
      setShareFeedback('');

      const imgData = await getOrCreateReceiptImage();
      if (!imgData) {
        alert(isEn ? 'Could not generate receipt image.' : 'पावती फोटो तयार करता आला नाही.');
        return;
      }

      // Check if native file sharing is supported on this browser (Mobile Safari, Chrome Android, etc.)
      const canShareFiles =
        typeof navigator !== 'undefined' &&
        'share' in navigator &&
        'canShare' in navigator &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [imgData.file] });

      if (canShareFiles) {
        try {
          await navigator.share({
            files: [imgData.file],
            title: `${settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ'} - ${receiptNoFormatted}`,
          });
          setShareFeedback(
            isEn
              ? '✓ Receipt photo saved / shared successfully!'
              : '✓ पावती फोटो गॅलरीत सेव्ह / शेअर झाला!'
          );
          setTimeout(() => setShareFeedback(''), 4000);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            return;
          }
          console.warn('Native share error, falling back to direct download:', shareErr);
        }
      }

      // Fallback: direct download as real JPEG (.jpg) photo
      triggerDownload(imgData.blob, imgData.fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to save Pavti image:', err);
      alert(isEn ? 'Failed to save receipt image.' : 'पावती फोटो सेव्ह करण्यात अडचण आली.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================================
  // 2. DOWNLOAD RECEIPT IMAGE (.JPG photo file)
  // ============================================================================
  const handleDownloadImage = async () => {
    try {
      setIsGenerating(true);
      const imgData = await getOrCreateReceiptImage();
      if (!imgData) {
        alert(isEn ? 'Could not generate receipt image.' : 'पावती फोटो तयार करता आला नाही.');
        return;
      }

      triggerDownload(imgData.blob, imgData.fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to download Pavti image:', err);
      alert(isEn ? 'Failed to download receipt image.' : 'पावती फोटो डाउनलोड करण्यात अडचण आली.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================================
  // 3. COPY RECEIPT IMAGE TO CLIPBOARD (iPhone Safari / Desktop / WhatsApp Web)
  // Real JPEG photo copied as image/jpeg ClipboardItem
  // ============================================================================
  const handleCopyPavtiImage = async () => {
    setIsGenerating(true);
    setCopyStatus('IDLE');

    try {
      if (
        typeof navigator === 'undefined' ||
        !navigator.clipboard ||
        !navigator.clipboard.write ||
        typeof ClipboardItem === 'undefined'
      ) {
        setCopyStatus('UNSUPPORTED');
        return;
      }

      const imgData = await getOrCreateReceiptImage();
      if (!imgData) {
        setCopyStatus('ERROR');
        return;
      }

      // Ensure genuine image/jpeg blob is passed to ClipboardItem
      const jpegBlob =
        imgData.blob.type === 'image/jpeg'
          ? imgData.blob
          : new Blob([await imgData.blob.arrayBuffer()], { type: 'image/jpeg' });

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/jpeg': jpegBlob }),
      ]);

      setCopyStatus('SUCCESS');
      setTimeout(() => setCopyStatus('IDLE'), 4000);
    } catch (err: any) {
      console.warn('Clipboard image copy error:', err);
      setCopyStatus('UNSUPPORTED');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================================
  // 4. DIRECT WHATSAPP CHAT URL GENERATOR
  // Uses donor's mobile number and pre-filled message + group link
  // ============================================================================
  const getWhatsAppDirectUrl = () => {
    const messageText = generateWhatsAppMessage();
    const encodedMsg = encodeURIComponent(messageText);

    // Format donor mobile number
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

    return phoneWithCountry
      ? `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;
  };

  const handleOpenWhatsApp = () => {
    const targetUrl = getWhatsAppDirectUrl();
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // ============================================================================
  // 5. COPY MESSAGE TEXT
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
          <span className="font-devanagari text-base sm:text-lg font-bold text-stone-900">
            {isEn ? 'Share & Download Receipt' : 'पावती शेअर व डाउनलोड करा'}
          </span>
        </div>
      }
      description={`${isDue ? (isEn ? 'Due Receipt #' : 'बाकी पावती क्र.') : (isEn ? 'Receipt #' : 'पावती क्र.')} ${receiptNoFormatted} - ${pavti.donorName} (${formatIndianCurrency(amountDisplay)})`}
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* =======================================================
            FEEDBACK STATUS MESSAGES
            ======================================================= */}
        {shareFeedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-devanagari flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold">{shareFeedback}</span>
          </div>
        )}

        {downloadSuccess && (
          <div className="p-3 bg-teal-50 border border-teal-300 rounded-xl text-xs text-teal-950 font-devanagari flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span className="font-bold">
              {isEn
                ? `✓ Receipt photo saved/downloaded successfully (Pavti_${(pavti.receiptNumber || '000001').replace(/^#/, '')}.jpg)`
                : `✓ पावती फोटो यशस्वीरित्या सेव्ह/डाउनलोड झाला (Pavti_${(pavti.receiptNumber || '000001').replace(/^#/, '')}.jpg)`}
            </span>
          </div>
        )}

        {copyStatus === 'SUCCESS' && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-devanagari flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {isEn ? '✓ Pavti photo copied to clipboard!' : '✓ पावती फोटो क्लिपबोर्डवर कॉपी झाला!'}
              </span>
              <p className="text-[11px] text-emerald-800 pt-0.5 font-medium">
                {isEn
                  ? 'Now tap "Open Donor WhatsApp Chat" below and paste (Ctrl+V / Long-press Paste) to send.'
                  : 'आता खालील "WhatsApp चॅट उघडा" बटणावर क्लिक करून चॅटमध्ये पेस्ट (Ctrl+V / दाबून Paste) करून पावती पाठवा.'}
              </p>
            </div>
          </div>
        )}

        {copyStatus === 'UNSUPPORTED' && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 font-devanagari space-y-1.5 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {isEn
                  ? 'Direct clipboard copying is not supported on this browser. Please use "Save Photo to Gallery" or "Open Donor WhatsApp Chat" below.'
                  : 'या ब्राऊझरवर थेट क्लिपबोर्ड कॉपी उपलब्ध नाही. कृपया खालील "पावती फोटो गॅलरीत सेव्ह करा" किंवा "WhatsApp चॅट उघडा" वापरा.'}
              </p>
            </div>
          </div>
        )}

        {/* =======================================================
            PRIMARY ACTIONS (MOBILE & DESKTOP SUITE)
            ======================================================= */}
        <div className="space-y-2.5">
          {/* Main Direct WhatsApp Chat Button - Directly opens WhatsApp to send text message */}
          <a
            href={getWhatsAppDirectUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 p-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl shadow-md font-devanagari font-bold text-sm sm:text-base transition-all border border-emerald-700 cursor-pointer no-underline"
          >
            <Send className="w-5 h-5 text-white flex-shrink-0" />
            <span>
              {isEn ? 'Open WhatsApp & Send Message' : 'WhatsApp वर मेसेज पाठवा'}
            </span>
            {pavti.donorMobile && (
              <span className="text-[11px] font-mono bg-emerald-800/80 px-2.5 py-0.5 rounded-md ml-1 border border-emerald-500/30">
                {pavti.donorMobile}
              </span>
            )}
            <ExternalLink className="w-4 h-4 ml-0.5 opacity-90" />
          </a>

          {/* Secondary 2-Column Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Download Photo to Gallery (.JPG) */}
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 active:scale-[0.98] text-white rounded-xl shadow font-devanagari font-bold text-xs sm:text-sm transition-all border border-amber-800 cursor-pointer"
            >
              <Download className="w-4 h-4 text-white flex-shrink-0" />
              <span>{isEn ? 'Download Photo (.JPG)' : 'पावती फोटो डाउनलोड करा (.JPG)'}</span>
            </button>

            {/* Copy Receipt Image (Desktop / WhatsApp Web / iPhone) */}
            <button
              type="button"
              onClick={handleCopyPavtiImage}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 p-3 bg-stone-800 hover:bg-stone-900 active:scale-[0.98] text-white rounded-xl shadow font-devanagari font-bold text-xs sm:text-sm transition-all border border-stone-950 cursor-pointer"
            >
              <Copy className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>{isEn ? 'Copy Photo (Clipboard)' : 'पावती फोटो कॉपी करा'}</span>
            </button>
          </div>
        </div>

        {/* =======================================================
            WORKFLOW HELPER STRIP
            ======================================================= */}
        <div className="p-2.5 bg-amber-50/90 border border-amber-200/90 rounded-xl text-[11px] font-devanagari text-amber-950 flex items-center justify-between gap-1 flex-wrap">
          <span className="font-semibold">
            {isEn ? '📱 2-Step Flow:' : '📱 २ सोप्या पायऱ्या:'}
          </span>
          <span className="text-stone-700">
            {isEn
              ? '1. Download photo (.JPG) ➔ 2. Open WhatsApp & Send text ➔ 3. Send photo from gallery'
              : '१. फोटो डाउनलोड करा (.JPG) ➔ २. WhatsApp वर मेसेज पाठवा ➔ ३. गॅलरीतून फोटो जोडून पाठवा'}
          </span>
        </div>

        {/* =======================================================
            SECTION 3: VISUAL RECEIPT PHOTO PREVIEW (REAL JPEG IMAGE)
            Exact single-source image that is copied, downloaded & shared
            ======================================================= */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-devanagari">
              <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
              <span>{isEn ? 'Receipt Photo (Tap & Hold to Save):' : 'पावती मूळ फोटो (दाबून धरून सेव्ह करा):'}</span>
            </span>
            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-100/70 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors font-devanagari cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isEn ? 'Download JPG' : 'JPG डाउनलोड'}</span>
            </button>
          </div>

          <div className="bg-stone-100/80 p-2 sm:p-3 rounded-2xl border border-stone-200/80 max-h-72 sm:max-h-80 overflow-y-auto shadow-inner text-center">
            {cachedImage?.dataUrl ? (
              <div className="space-y-1.5">
                {/* Real interactive JPEG photo for iPhone / Android native long-press save */}
                <img
                  src={cachedImage.dataUrl}
                  alt={`Pavti #${pavti.receiptNumber}`}
                  className="w-full max-w-[420px] mx-auto rounded-xl shadow-md border border-amber-300/60 select-auto touch-auto"
                />
                <p className="text-[10px] text-stone-500 font-devanagari">
                  {isEn
                    ? '💡 Tip: You can also touch & hold (long-press) the photo above to "Save to Photos" / "Add to Photos".'
                    : '💡 टीप: वरील फोटोवर बोट दाबून धरून (Long-Press) थेट iPhone Photos किंवा Gallery मध्ये सेव्ह करू शकता.'}
                </p>
              </div>
            ) : (
              <div className="transform scale-[0.80] sm:scale-90 origin-top -mb-14 sm:-mb-6">
                <PavtiCard
                  id="modal-pavti-preview-element"
                  pavti={pavti}
                  settings={settings}
                />
              </div>
            )}
          </div>
        </div>

        {/* =======================================================
            SECTION 4: PREPARED WHATSAPP MESSAGE TEXT PREVIEW
            ======================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-devanagari">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEn ? 'Prepared WhatsApp Message Text:' : 'तयार झालेला WhatsApp मेसेज मजकूर:'}</span>
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

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs font-devanagari text-stone-800 whitespace-pre-wrap font-medium leading-relaxed max-h-36 overflow-y-auto">
            {generateWhatsAppMessage()}
          </div>
        </div>
      </div>
    </Modal>
  );
}
