'use client';

import React, { useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, Share2, Copy, Check, MessageSquare, Printer } from 'lucide-react';
import { Pavti, MandalSettings } from '@/types';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';

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
  elementId = 'pavti-card-element',
}: PavtiShareModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [includeGroupLink, setIncludeGroupLink] = useState(true);

  // Generate WhatsApp Message text
  const generateWhatsAppMessage = () => {
    let msg = `🙏 *गणपती बाप्पा मोरया* 🙏\n\n`;
    msg += `आदरणीय *${pavti.donorName}*,\n`;
    msg += `*${settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ'}* कडून आपले मनःपूर्वक धन्यवाद!\n\n`;
    msg += `आपली देणगी/वर्गणी रक्कम यशस्वीरीत्या जमा झाली असून आपली अधिकृत डिजिटल पावती खालीलप्रमाणे आहे:\n\n`;
    msg += `📄 *पावती क्र.*: ${pavti.receiptNumber}\n`;
    msg += `💰 *रक्कम*: ${formatIndianCurrency(pavti.amount)}\n`;
    msg += `📅 *दिनांक*: ${pavti.date}\n`;
    msg += `🏷️ *प्रकार*: ${pavti.paymentMethod === 'CASH' ? 'रोख (Cash)' : 'UPI / Online'}\n`;

    if (includeGroupLink && settings?.whatsappGroupLink) {
      msg += `\n📢 *मंडळाच्या अधिकृत WhatsApp ग्रुपमध्ये सामील होण्यासाठी खालील लिंकवर क्लिक करा:*\n${settings.whatsappGroupLink}\n`;
    }

    msg += `\n॥ बाप्पा आपल्या सर्व मनोकामना पूर्ण करोत हीच सदिच्छा ॥\n`;
    msg += `*- ${settings?.mandalNameMarathi || 'मंडळ परिवार'}*`;

    return msg;
  };

  // Download High-Resolution PNG Image
  const handleDownloadImage = async () => {
    try {
      setIsGenerating(true);
      const node = document.getElementById(elementId);
      if (!node) {
        alert('Pavti element not found on page.');
        return;
      }

      const dataUrl = await toPng(node, {
        quality: 1.0,
        pixelRatio: 2.5, // Crisp high-res rendering
        backgroundColor: '#FFFDF7',
      });

      const link = document.createElement('a');
      link.download = `Pavti_${pavti.receiptNumber}_${pavti.donorName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate Pavti image:', err);
      alert('पावती इमेज डाऊनलोड करण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Web Share API with image and text
  const handleNativeShare = async () => {
    try {
      setIsGenerating(true);
      const node = document.getElementById(elementId);
      if (!node) return;

      const dataUrl = await toPng(node, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#FFFDF7',
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File(
        [blob],
        `Pavti_${pavti.receiptNumber}.png`,
        { type: 'image/png' }
      );

      const messageText = generateWhatsAppMessage();

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `डिजिटल पावती - ${pavti.receiptNumber}`,
          text: messageText,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `डिजिटल पावती - ${pavti.receiptNumber}`,
          text: messageText,
        });
      } else {
        // Fallback to WhatsApp URL
        handleOpenWhatsApp();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
        handleOpenWhatsApp();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Direct WhatsApp Link
  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent(generateWhatsAppMessage());
    let url = `https://wa.me/?text=${text}`;
    if (pavti.donorMobile) {
      const cleanPhone = pavti.donorMobile.replace(/\D/g, '');
      const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      url = `https://wa.me/${phoneWithCountry}?text=${text}`;
    }
    window.open(url, '_blank');
  };

  // Copy WhatsApp Text to Clipboard
  const handleCopyMessage = async () => {
    const text = generateWhatsAppMessage();
    await navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
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
          <Share2 className="w-5 h-5 text-orange-600" />
          <span>पावती शेअर करा (Share Pavti)</span>
        </div>
      }
      description={`पावती क्र. #${pavti.receiptNumber} - ${pavti.donorName} (${formatIndianCurrency(pavti.amount)})`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Toggle WhatsApp Group Link */}
        {settings?.whatsappGroupLink && (
          <label className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition-colors">
            <input
              type="checkbox"
              checked={includeGroupLink}
              onChange={(e) => setIncludeGroupLink(e.target.checked)}
              className="w-4 h-4 text-orange-600 rounded border-amber-300 focus:ring-orange-500"
            />
            <div className="text-xs">
              <span className="font-bold text-amber-900 font-devanagari">
                मंडळ WhatsApp ग्रुप लिंक संदेशात जोडा
              </span>
              <p className="text-stone-600 text-[11px]">
                देणगीदाराला मंडळाच्या ग्रुपमध्ये सामील होण्यासाठी आमंत्रण लिंक जाईल.
              </p>
            </div>
          </label>
        )}

        {/* Primary Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Download Image Button */}
          <Button
            variant="gold"
            onClick={handleDownloadImage}
            isLoading={isGenerating}
            className="flex items-center justify-center gap-2 py-3"
          >
            <Download className="w-4 h-4" />
            <span>पावती इमेज डाऊनलोड (PNG)</span>
          </Button>

          {/* Native Web Share */}
          <Button
            variant="primary"
            onClick={handleNativeShare}
            isLoading={isGenerating}
            className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
          >
            <Share2 className="w-4 h-4" />
            <span>थेट शेअर करा (Mobile Share)</span>
          </Button>
        </div>

        {/* WhatsApp Message Preview & Copy */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp मेसेज पूर्वावलोकन:
            </span>
            <button
              onClick={handleCopyMessage}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-md border border-orange-200 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">कॉपी झाले!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>मेसेज कॉपी करा</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-700 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
            {generateWhatsAppMessage()}
          </div>
        </div>

        {/* Secondary Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs text-stone-600"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट करा (Print)</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenWhatsApp}
            className="flex items-center gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp वर उघडा</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
