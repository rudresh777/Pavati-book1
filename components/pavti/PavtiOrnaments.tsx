import React from 'react';

/**
 * Traditional Indian Ornate Corner Filigree SVG
 */
export function CornerOrnament({
  className = '',
  position = 'top-left',
}: {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) {
  const transforms: Record<string, string> = {
    'top-left': '',
    'top-right': 'scale(-1, 1)',
    'bottom-left': 'scale(1, -1)',
    'bottom-right': 'scale(-1, -1)',
  };

  return (
    <svg
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-10 h-10 sm:w-12 sm:h-12 pointer-events-none select-none ${className}`}
      style={{ transform: transforms[position] }}
    >
      {/* Outer corner L-bracket */}
      <path
        d="M3 45V15C3 8.37258 8.37258 3 15 3H45"
        stroke="#b45309"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 40V18C8 12.4772 12.4772 8 18 8H40"
        stroke="#d97706"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeDasharray="2 3"
      />
      {/* Inner floral swirl */}
      <path
        d="M6 6C16 16 16 30 16 30C16 30 30 16 6 6Z"
        fill="url(#gold-corner-grad)"
        opacity="0.85"
      />
      <circle cx="12" cy="12" r="3.5" fill="#92400e" />
      <circle cx="12" cy="12" r="2" fill="#fbbf24" />
      <circle cx="28" cy="6" r="2" fill="#b45309" />
      <circle cx="6" cy="28" r="2" fill="#b45309" />
      <defs>
        <linearGradient id="gold-corner-grad" x1="6" y1="6" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" />
          <stop offset="0.5" stopColor="#d97706" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Traditional Gold Floral / Swirl Horizontal Divider
 */
export function FloralDivider({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-[280px] sm:max-w-[340px] h-4 mx-auto my-1 pointer-events-none select-none ${className}`}
    >
      <defs>
        <linearGradient id="divider-grad-left" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" stopOpacity="0" />
          <stop offset="60%" stopColor="#d97706" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="divider-grad-right" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" stopOpacity="1" />
          <stop offset="40%" stopColor="#d97706" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Left tapered line */}
      <path d="M10 12H170" stroke="url(#divider-grad-left)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Right tapered line */}
      <path d="M230 12H390" stroke="url(#divider-grad-right)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Center Floral Rosette */}
      <circle cx="200" cy="12" r="4.5" fill="#b45309" />
      <circle cx="200" cy="12" r="2.5" fill="#fde68a" />
      {/* Left swirls */}
      <path
        d="M185 12C188 9 192 9 195 12C192 15 188 15 185 12Z"
        fill="#d97706"
      />
      <circle cx="178" cy="12" r="2" fill="#b45309" />
      {/* Right swirls */}
      <path
        d="M215 12C212 9 208 9 205 12C208 15 212 15 215 12Z"
        fill="#d97706"
      />
      <circle cx="222" cy="12" r="2" fill="#b45309" />
    </svg>
  );
}

/**
 * Gold Rupee Coin / Medallion Badge
 */
export function RupeeMedallion({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-md flex-shrink-0 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #92400e 100%)',
        boxShadow: '0 2px 8px rgba(180, 83, 9, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
        border: '2px solid #fef3c7',
      }}
    >
      {/* Outer scalloped ring */}
      <div className="absolute inset-0.5 rounded-full border border-dashed border-amber-900/40 pointer-events-none" />
      <span className="text-white font-extrabold text-xl sm:text-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        ₹
      </span>
    </div>
  );
}

/**
 * Temple Skyline / Shikhar Silhouette Motif along bottom footer
 */
export function TempleSilhouette({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-auto pointer-events-none select-none ${className}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="temple-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ea580c" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#c2410c" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#9a3412" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* Repeating temple domes / shikhars and kalash flags */}
      <path
        d="
          M0 90 L0 60
          L25 60 L35 45 L40 25 L45 10 L47 5 L49 10 L54 25 L59 45 L69 60
          L90 60 L100 48 L105 32 L108 18 L110 8 L112 18 L115 32 L120 48 L130 60
          L150 60 L165 42 L175 22 L180 6 L182 2 L184 6 L189 22 L199 42 L214 60
          L235 60 L245 46 L250 30 L253 16 L255 7 L257 16 L260 30 L265 46 L275 60
          L300 60 L315 40 L325 18 L330 4 L332 0 L334 4 L339 18 L349 40 L364 60
          L385 60 L395 48 L400 32 L403 18 L405 8 L407 18 L410 32 L415 48 L425 60
          L450 60 L465 42 L475 22 L480 6 L482 2 L484 6 L489 22 L499 42 L514 60
          L535 60 L545 46 L550 30 L553 16 L555 7 L557 16 L560 30 L565 46 L575 60
          L600 60 L615 40 L625 18 L630 4 L632 0 L634 4 L639 18 L649 40 L664 60
          L685 60 L695 48 L700 32 L703 18 L705 8 L707 18 L710 32 L715 48 L725 60
          L750 60 L765 42 L775 22 L780 6 L782 2 L784 6 L789 22 L799 42 L800 45
          L800 90 Z
        "
        fill="url(#temple-grad)"
      />
      {/* Tiny temple kalash flags */}
      <polygon points="47,5 47,0 52,2" fill="#ea580c" />
      <polygon points="110,8 110,3 115,5" fill="#ea580c" />
      <polygon points="182,2 182,-3 188,0" fill="#ea580c" />
      <polygon points="255,7 255,2 260,4" fill="#ea580c" />
      <polygon points="332,0 332,-5 338,-2" fill="#ea580c" />
      <polygon points="405,8 405,3 410,5" fill="#ea580c" />
      <polygon points="482,2 482,-3 488,0" fill="#ea580c" />
      <polygon points="555,7 555,2 560,4" fill="#ea580c" />
      <polygon points="632,0 632,-5 638,-2" fill="#ea580c" />
      <polygon points="705,8 705,3 710,5" fill="#ea580c" />
      <polygon points="782,2 782,-3 788,0" fill="#ea580c" />
    </svg>
  );
}

/**
 * Official Rubber Stamp Seal
 */
export function OfficialStamp({
  status = 'PAID',
  authId,
  isEn = false,
}: {
  status?: 'PAID' | 'DUE' | 'PARTIALLY_PAID';
  authId?: string;
  isEn?: boolean;
}) {
  const isPaid = status === 'PAID';

  return (
    <div className="flex flex-col items-center select-none pointer-events-none">
      <div
        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border-2 border-dashed text-center transform -rotate-3 transition-transform ${
          isPaid
            ? 'border-emerald-700 bg-emerald-50/70 text-emerald-800 shadow-[0_2px_10px_rgba(4,120,87,0.15)]'
            : 'border-amber-700 bg-amber-50/70 text-amber-900 shadow-[0_2px_10px_rgba(180,83,9,0.15)]'
        }`}
        style={{
          boxShadow: isPaid
            ? 'inset 0 0 0 1px rgba(4, 120, 87, 0.4), 0 2px 6px rgba(4, 120, 87, 0.2)'
            : 'inset 0 0 0 1px rgba(180, 83, 9, 0.4), 0 2px 6px rgba(180, 83, 9, 0.2)',
        }}
      >
        <div
          className={`text-[9px] sm:text-[10px] uppercase font-extrabold tracking-widest ${
            isPaid ? 'text-emerald-800' : 'text-amber-900'
          }`}
          style={{ letterSpacing: '0.14em' }}
        >
          OFFICIAL RECEIPT
        </div>
        <div
          className={`text-sm sm:text-base font-black tracking-wider flex items-center justify-center gap-1.5 ${
            isPaid ? 'text-emerald-700' : 'text-amber-800'
          }`}
        >
          <span>★</span>
          <span>{isPaid ? 'PAID' : isEn ? 'DUE' : 'बाकी'}</span>
          <span>★</span>
        </div>
      </div>
      {authId && (
        <span className="text-[8px] sm:text-[9px] font-mono text-stone-500 pt-1 tracking-tight">
          Auth ID: {authId}
        </span>
      )}
    </div>
  );
}
