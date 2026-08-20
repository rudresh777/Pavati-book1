'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, Clock, Users, CreditCard } from 'lucide-react';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';
import { cn } from '@/lib/utils/cn';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAppMode();
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  if (!user) return null;

  const navItems = [
    {
      href: '/dashboard',
      label: isEn ? 'Dashboard' : 'डॅशबोर्ड',
      icon: Home,
    },
    {
      href: '/pending',
      label: isEn ? 'Pending' : 'बाकी',
      icon: Clock,
    },
    {
      href: '/pavti/new',
      label: isEn ? 'New Pavti' : 'नवीन पावती',
      icon: Plus,
      isPrimary: true,
    },
    {
      href: '/donors',
      label: isEn ? 'Donors' : 'देणगीदार',
      icon: Users,
    },
    {
      href: '/payments',
      label: isEn ? 'Ledger' : 'जमा-खर्च',
      icon: CreditCard,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <div
                  className={cn(
                    'w-13 h-13 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 border-2 border-white',
                    isActive
                      ? 'bg-gradient-to-tr from-amber-600 to-orange-600 ring-2 ring-orange-400'
                      : 'bg-gradient-to-tr from-orange-500 to-amber-600 hover:brightness-105'
                  )}
                >
                  <Icon className="w-6 h-6 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-bold font-devanagari text-orange-950 mt-0.5">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 active:scale-90',
                isActive
                  ? 'text-orange-700 font-bold'
                  : 'text-stone-500 hover:text-orange-900 font-medium'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-lg transition-colors',
                  isActive ? 'bg-amber-100/80' : 'bg-transparent'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'stroke-[2.2]' : 'stroke-[1.8]')} />
              </div>
              <span className="text-[10px] font-devanagari tracking-tight leading-tight mt-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
