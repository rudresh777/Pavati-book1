'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/context/language-context';

export function Footer({ mandalName = 'मोरया गणेशोत्सव मंडळ' }: { mandalName?: string }) {
  const { t } = useLanguage();

  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-amber-400 font-devanagari font-bold text-sm">
              <span>॥ गणपती बाप्पा मोरया ॥</span>
              <span>•</span>
              <span>॥ मंगलमूर्ती मोरया ॥</span>
            </div>
            <p className="text-xs text-stone-300 font-devanagari">
              {mandalName} • तापडिया नगर अकोला 444001
            </p>
            <p className="text-[11px] text-stone-500 font-mono">
              © {new Date().getFullYear()} {mandalName}. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-400 font-devanagari">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              {t('nav.home')}
            </Link>
            <span>•</span>
            <Link href="/announcements" className="hover:text-amber-400 transition-colors">
              {t('nav.announcements')}
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-amber-400 transition-colors">
              {t('nav.login')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
