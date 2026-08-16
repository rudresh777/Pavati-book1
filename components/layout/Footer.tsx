import React from 'react';
import Link from 'next/link';

export function Footer({ mandalName = 'मोरया गणेशोत्सव मंडळ' }: { mandalName?: string }) {
  return (
    <footer className="bg-stone-900 text-stone-300 mt-auto border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-2 text-amber-500 font-devanagari font-bold text-sm">
              <span>॥ गणपती बाप्पा मोरया ॥</span>
              <span>•</span>
              <span>॥ मंगलमूर्ती मोरया ॥</span>
            </div>
            <p className="text-xs text-stone-400">
              © {new Date().getFullYear()} {mandalName}. सर्व हक्क सुरक्षित.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-stone-400 font-devanagari">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              मुखपृष्ठ
            </Link>
            <span>•</span>
            <Link href="/announcements" className="hover:text-amber-400 transition-colors">
              सूचना फलक
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-amber-400 transition-colors">
              प्रतिनिधी लॉगिन
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
