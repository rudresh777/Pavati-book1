'use client';

import React, { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import {
  Download,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Users,
  Printer,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle2,
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPhotoCopied, setIsPhotoCopied] = useState(false);
  const [includeGroupLink, setIncludeGroupLink] = useState(true);
  const [includeReceiptLink, setIncludeReceiptLink] = useState(true);
  const [desktopPhotoNotice, setDesktopPhotoNotice] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  // Check if Web Share API with files is supported
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!navigator.share) {
      setCanNativeShare(true);
    }
  }, []);

  // Determine if this is a Due / बाकी receipt
  const isDue =
    pavti.status === 'DUE' ||
    !pavti.paymentMethod ||
    pavti.paymentMethod === 'DUE';

  const amountDisplay = pavti.amount;
  const receiptNoFormatted = pavti.receiptNumber.startsWith('#')
    ? pavti.receiptNumber
    : `#${pavti.receiptNumber}`;

  // Generate WhatsApp Message text strictly adhering to requirements
  const generateWhatsAppMessage = () => {
    const mandalName = settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ';
    const groupLink =
      includeGroupLink && settings?.whatsappGroupLink
        ? settings.whatsappGroupLink.trim()
        : '';

    const webReceiptUrl =
      includeReceiptLink && typeof window !== 'undefined' && pavti.id
        ? `${window.location.origin}/pavti/${pavti.id}`
        : '';

    if (language === 'en') {
      let msg = `Namaskar 🙏\n\n`;
      msg += `Your digital receipt has been generated on behalf of ${mandalName}.\n\n`;
      msg += `Receipt Number: ${receiptNoFormatted}\n\n`;
      msg += isDue
        ? `Due Amount: ₹${amountDisplay}\n`
        : `Donation Amount: ₹${amountDisplay}\n`;

      if (webReceiptUrl) {
        msg += `\nView / Download Digital Receipt:\n${webReceiptUrl}\n`;
      }

      if (groupLink) {
        msg += `\nClick the link below to join Mandal WhatsApp Group:\n${groupLink}\n`;
      }

      msg += `\n॥ गणपती बाप्पा मोरया ॥`;
      return msg;
    } else {
      // Marathi default
      let msg = `नमस्कार 🙏\n\n`;
      msg += `${mandalName}तर्फे आपली डिजिटल पावती तयार करण्यात आली आहे.\n\n`;
      msg += `पावती क्रमांक: ${receiptNoFormatted}\n\n`;
      msg += isDue
        ? `बाकी रक्कम: ₹${amountDisplay}\n`
        : `देणगी रक्कम: ₹${amountDisplay}\n`;

      if (webReceiptUrl) {
        msg += `\nडिजिटल पावती पाहण्यासाठी व डाऊनलोड करण्यासाठी लिंक:\n${webReceiptUrl}\n`;
      }

      if (groupLink) {
        msg += `\nमंडळाच्या WhatsApp ग्रुपमध्ये सहभागी होण्यासाठी खालील लिंकवर क्लिक करा:\n${groupLink}\n`;
      }

      msg += `\n॥ गणपती बाप्पा मोरया ॥`;
      return msg;
    }
  };

  // Generate Pavti Image Blob and File
  const generatePavtiImageBlob = async (): Promise<{ blob: Blob; file: File; dataUrl: string } | null> => {
    const node = document.getElementById(elementId) || document.getElementById('modal-pavti-preview-element');
    if (!node) {
      console.error('Pavti element not found in DOM');
      return null;
    }

    const dataUrl = await toPng(node, {
      quality: 1.0,
      pixelRatio: 2.5,
      backgroundColor: '#FFFDF7',
    });

    const blob = await (await fetch(dataUrl)).blob();
    const fileName = `Pavti_${pavti.receiptNumber || '000001'}_${(pavti.donorName || 'Donor').replace(/\s+/g, '_')}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    return { blob, file, dataUrl };
  };

  // PRIMARY ACTION: Direct Share with Photo (Web Share on Mobile, Auto-Copy + Direct Chat on PC)
  const handleSharePavtiWithPhoto = async () => {
    setIsGenerating(true);
    setDesktopPhotoNotice(false);

    try {
      // 1. Generate crisp high-res Pavti Photo Image
      const imgData = await generatePavtiImageBlob();
      const messageText = generateWhatsAppMessage();

      // 2. MOBILE WEB: Try Native Web Share API (Attaches photo + text directly to WhatsApp)
      if (
        imgData?.file &&
        typeof navigator !== 'undefined' &&
        navigator.canShare &&
        navigator.canShare({ files: [imgData.file] })
      ) {
        try {
          await navigator.share({
            title: `पावती क्र. ${receiptNoFormatted}`,
            text: messageText,
            files: [imgData.file],
          });
          return;
        } catch (shareErr: any) {
          // If user simply closed/cancelled the share sheet, do not trigger fallback redirect
          if (shareErr?.name === 'AbortError') {
            return;
          }
          console.warn('Native share failed or dismissed, falling back to URL scheme:', shareErr);
        }
      }

      // 3. DESKTOP / FALLBACK: Copy image to clipboard for instant 1-click paste (Ctrl+V)
      if (imgData && typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': imgData.blob }),
          ]);
          setIsPhotoCopied(true);
          setTimeout(() => setIsPhotoCopied(false), 5000);
        } catch (clipErr) {
          console.warn('Clipboard image write failed:', clipErr);
        }
      }

      // 4. Format exact donor phone number from the receipt
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

      // 5. Open DIRECT 1-on-1 WhatsApp App with the Donor's exact number
      const encodedMsg = encodeURIComponent(messageText);
      const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile && phoneWithCountry) {
        // Direct App Deep-Link for Mobile (Opens WhatsApp Mobile App directly, not web)
        window.location.href = `whatsapp://send?phone=${phoneWithCountry}&text=${encodedMsg}`;
      } else {
        const waUrl = phoneWithCountry
          ? `https://api.whatsapp.com/send/?phone=${phoneWithCountry}&text=${encodedMsg}`
          : `https://api.whatsapp.com/send/?text=${encodedMsg}`;
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }

      // 6. Show desktop helper notice
      setDesktopPhotoNotice(true);
    } catch (err: any) {
      console.error('Failed to share Pavti photo:', err);
      handleOpenWhatsAppTextOnly();
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Direct WhatsApp App (Direct Mobile App / Web fallback)
  const handleOpenWhatsAppTextOnly = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    const cleanPhone = (pavti.donorMobile || '').replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && phoneWithCountry) {
      // Launch native WhatsApp app directly on mobile phone
      window.location.href = `whatsapp://send?phone=${phoneWithCountry}&text=${text}`;
    } else {
      const url = phoneWithCountry
        ? `https://api.whatsapp.com/send/?phone=${phoneWithCountry}&text=${text}`
        : `https://api.whatsapp.com/send/?text=${text}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Open Mandal WhatsApp Group Invite Link in new tab
  const handleJoinGroup = () => {
    if (settings?.whatsappGroupLink) {
      window.open(settings.whatsappGroupLink, '_blank', 'noopener,noreferrer');
    }
  };

  // Copy WhatsApp Text Message
  const handleCopyMessage = async () => {
    const text = generateWhatsAppMessage();
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {}
  };

  // Copy Pavti Image to Clipboard
  const handleCopyPhoto = async () => {
    try {
      setIsGenerating(true);
      const imgData = await generatePavtiImageBlob();
      if (imgData && typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': imgData.blob }),
        ]);
        setIsPhotoCopied(true);
        setTimeout(() => setIsPhotoCopied(false), 3000);
      } else {
        alert(
          language === 'mr'
            ? 'फोटो कॉपी करणे समर्थित नाही. कृपया फोटो डाऊनलोड करा.'
            : 'Photo copy not supported on this browser. Please download the image.'
        );
      }
    } catch (err) {
      console.error('Failed to copy photo:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Download High-Resolution PNG Image
  const handleDownloadImage = async () => {
    try {
      setIsGenerating(true);
      const imgData = await generatePavtiImageBlob();
      if (!imgData) {
        alert(language === 'mr' ? 'पावती फोटो तयार करता आला नाही.' : 'Could not generate receipt image.');
        return;
      }

      const link = document.createElement('a');
      link.download = imgData.file.name;
      link.href = imgData.dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate Pavti image:', err);
      alert(language === 'mr' ? 'पावती इमेज डाऊनलोड करण्यात अडचण आली.' : 'Failed to download receipt image.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <span className="font-devanagari text-base sm:text-lg">
            {language === 'mr' ? 'पावती शेअर करा' : 'Share Receipt'}
          </span>
        </div>
      }
      description={`${isDue ? (language === 'mr' ? 'बाकी पावती क्र.' : 'Due Receipt #') : (language === 'mr' ? 'पावती क्र.' : 'Receipt #')} ${receiptNoFormatted} - ${pavti.donorName} (${formatIndianCurrency(amountDisplay)})`}
      maxWidth="lg"
    >
      <div className="space-y-4 sm:space-y-5">
        {/* =======================================================
            SECTION 1: PRIMARY WHATSAPP ACTIONS
            ======================================================= */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-500 font-devanagari flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              {language === 'mr' ? 'WhatsApp शेअर पर्याय' : 'WhatsApp Share Options'}
            </span>
            {pavti.donorMobile && (
              <span className="text-emerald-800 font-mono font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                📲 {pavti.donorMobile}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 1. PRIMARY: SEND PAVTI PHOTO & MESSAGE */}
            <button
              type="button"
              onClick={handleSharePavtiWithPhoto}
              disabled={isGenerating}
              className="flex items-center justify-center gap-2 p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.98] text-white rounded-xl shadow-md transition-all font-devanagari font-bold text-sm text-center disabled:opacity-75 cursor-pointer"
            >
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>{language === 'mr' ? 'पावती तयार होत आहे...' : 'Generating Receipt...'}</span>
                </span>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5 flex-shrink-0" />
                  <span>
                    {language === 'mr'
                      ? 'WhatsApp वर पावती फोटो पाठवा'
                      : 'Send Pavti Photo on WhatsApp'}
                  </span>
                </>
              )}
            </button>

            {/* 2. JOIN MANDAL WHATSAPP GROUP */}
            {settings?.whatsappGroupLink ? (
              <button
                type="button"
                onClick={handleJoinGroup}
                className="flex items-center justify-center gap-2 p-3.5 bg-stone-800 hover:bg-stone-900 active:scale-[0.98] text-white rounded-xl shadow-sm transition-all font-devanagari font-bold text-sm text-center cursor-pointer"
              >
                <Users className="w-4.5 h-4.5 flex-shrink-0 text-amber-400" />
                <span>
                  {language === 'mr'
                    ? 'मंडळ WhatsApp ग्रुप जॉईन करा'
                    : 'Join Mandal WhatsApp Group'}
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenWhatsAppTextOnly}
                className="flex items-center justify-center gap-2 p-3.5 bg-stone-100 hover:bg-stone-200 active:scale-[0.98] text-stone-800 border border-stone-300 rounded-xl transition-all font-devanagari font-semibold text-xs text-center cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'mr'
                    ? 'थेट चॅट उघडा (Text Only)'
                    : 'Open Direct Chat (Text Only)'}
                </span>
              </button>
            )}
          </div>

          {/* Desktop/PC WhatsApp Web Paste Helper Notice */}
          {desktopPhotoNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-devanagari flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">
                  {language === 'mr'
                    ? 'पावतीचा फोटो कॉपी झाला आहे!'
                    : 'Receipt photo copied to clipboard!'}
                </div>
                <div className="text-[11px] text-emerald-800 pt-0.5 leading-relaxed">
                  {language === 'mr'
                    ? 'WhatsApp उघडल्यावर चॅटमध्ये फक्त Paste (Ctrl+V) करा आणि मेसेजसह पावती फोटो पाठवा.'
                    : 'When WhatsApp opens, press Paste (Ctrl+V) to send the receipt photo in the chat.'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          {/* Toggle Online Receipt Link */}
          <label className="flex items-center gap-2.5 p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition-colors">
            <input
              type="checkbox"
              checked={includeReceiptLink}
              onChange={(e) => setIncludeReceiptLink(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded border-amber-300 focus:ring-orange-500 flex-shrink-0"
            />
            <div className="text-xs">
              <span className="font-bold text-amber-950 font-devanagari">
                {language === 'mr'
                  ? 'मेसेजमध्ये डिजिटल पावतीची व्ह्यू लिंक जोडा'
                  : 'Include Digital Receipt View Link in message'}
              </span>
              <p className="text-stone-600 text-[11px] font-devanagari">
                {language === 'mr'
                  ? 'देणगीदाराला WhatsApp वर पावतीचे थेट थंबनेल कार्ड दिसेल.'
                  : 'Allows donor to open and view their receipt directly from WhatsApp.'}
              </p>
            </div>
          </label>

          {/* Toggle WhatsApp Group Link in message */}
          {settings?.whatsappGroupLink && (
            <label className="flex items-center gap-2.5 p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/80 cursor-pointer hover:bg-amber-100/60 transition-colors">
              <input
                type="checkbox"
                checked={includeGroupLink}
                onChange={(e) => setIncludeGroupLink(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded border-amber-300 focus:ring-orange-500 flex-shrink-0"
              />
              <div className="text-xs">
                <span className="font-bold text-amber-950 font-devanagari">
                  {language === 'mr'
                    ? 'मंडळ WhatsApp ग्रुप लिंक संदेशात जोडा'
                    : 'Include Mandal WhatsApp Group Link in message'}
                </span>
                <p className="text-stone-600 text-[11px] font-devanagari">
                  {language === 'mr'
                    ? 'देणगीदाराला मंडळाच्या ग्रुपमध्ये सामील होण्यासाठी आमंत्रण लिंक संदेशात समाविष्ट होईल.'
                    : 'Adds the official group invitation link in the prepared message.'}
                </p>
              </div>
            </label>
          )}
        </div>

        {/* =======================================================
            SECTION 2: VISUAL RECEIPT PHOTO PREVIEW
            ======================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-devanagari">
              <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
              {language === 'mr' ? 'पावती फोटो पूर्वावलोकन:' : 'Receipt Photo Preview:'}
            </span>
            <button
              type="button"
              onClick={handleCopyPhoto}
              disabled={isGenerating}
              className="text-xs font-semibold text-orange-700 hover:text-orange-800 flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200 transition-colors font-devanagari cursor-pointer active:scale-95"
            >
              {isPhotoCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">
                    {language === 'mr' ? 'फोटो कॉपी झाला!' : 'Photo Copied!'}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'mr' ? 'फोटो कॉपी करा' : 'Copy Photo'}</span>
                </>
              )}
            </button>
          </div>

          {/* Scaled Render Container for Mobile Web */}
          <div className="bg-stone-100/70 p-2 sm:p-3 rounded-2xl border border-stone-200/80 max-h-64 sm:max-h-72 overflow-y-auto shadow-inner">
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
            SECTION 3: WHATSAPP MESSAGE PREVIEW & COPY
            ======================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5 font-devanagari">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              {language === 'mr' ? 'WhatsApp मेसेज मजकूर:' : 'WhatsApp Message Text:'}
            </span>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-xs font-semibold text-orange-700 hover:text-orange-800 flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200 transition-colors font-devanagari cursor-pointer active:scale-95"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">
                    {language === 'mr' ? 'मेसेज कॉपी झाला!' : 'Copied!'}
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    {language === 'mr' ? 'मेसेज मजकूर कॉपी करा' : 'Copy Message Text'}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="p-2.5 sm:p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono text-stone-800 whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed shadow-inner">
            {generateWhatsAppMessage()}
          </div>
        </div>

        {/* =======================================================
            SECTION 4: DOWNLOAD & PRINT OPTIONS
            ======================================================= */}
        <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="gold"
            onClick={handleDownloadImage}
            isLoading={isGenerating}
            className="flex items-center justify-center gap-2 py-2 font-devanagari text-xs flex-1 sm:flex-initial"
          >
            <Download className="w-4 h-4" />
            <span>
              {language === 'mr'
                ? 'पावती डाउनलोड करा'
                : 'Download Receipt PNG'}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs text-stone-600 font-devanagari"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{language === 'mr' ? 'प्रिंट करा (Print)' : 'Print Receipt'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
