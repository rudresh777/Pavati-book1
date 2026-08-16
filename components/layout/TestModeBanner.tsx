'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppMode } from '@/lib/context/mode-context';

export function TestModeBanner() {
  const { mode, toggleMode, user } = useAppMode();

  if (mode !== 'TEST') return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-semibold shadow-md sticky top-0 z-50 flex items-center justify-between">
      <div className="flex items-center gap-2 max-w-4xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-200 animate-bounce flex-shrink-0" />
          <span>
            <strong className="font-extrabold uppercase tracking-wide bg-black/20 px-2 py-0.5 rounded mr-1">
              TEST MODE चालू आहे
            </strong>
            — येथे तयार केलेले सर्व रेकॉर्ड्स चाचणीसाठी आहेत. मूळ (Live) जमा रकमेत हे जोडले जाणार नाहीत.
          </span>
        </div>

        <button
          onClick={toggleMode}
          className="ml-3 px-3 py-1 bg-white text-orange-800 hover:bg-amber-50 rounded-md font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all whitespace-nowrap"
        >
          <RefreshCw className="w-3 h-3" />
          <span>LIVE MODE वर जा</span>
        </button>
      </div>
    </div>
  );
}
