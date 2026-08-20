'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  PlusCircle,
  Clock,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Sparkles,
  Home,
  Bell,
  Sliders,
  Database,
  History,
  ChevronDown,
} from 'lucide-react';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';
import { cn } from '@/lib/utils/cn';

interface NavbarProps {
  mandalName?: string;
  mandalLogo?: string;
}

export function Navbar({ mandalName = 'मोरया गणेशोत्सव मंडळ' }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, toggleMode, user } = useAppMode();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const managementRef = useRef<HTMLDivElement>(null);

  // Close management dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        managementRef.current &&
        !managementRef.current.contains(event.target as Node)
      ) {
        setIsManagementOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isAuth = !!user;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const authNavItems = [
    { href: '/dashboard', label: t('nav.dashboard'), icon: Home },
    { href: '/pavti/new', label: t('nav.newPavti'), icon: PlusCircle, highlight: true },
    { href: '/pending', label: t('nav.pending'), icon: Clock },
    { href: '/donors', label: t('nav.donors'), icon: Users },
    { href: '/payments', label: t('nav.ledger'), icon: CreditCard },
  ];

  // Super Admin items
  const superAdminNavItems = [
    { href: '/settings/mandal', label: t('nav.mandalSettings'), icon: Sliders },
    { href: '/settings/users', label: t('nav.hostManagement'), icon: Users },
    { href: '/settings/backup', label: t('nav.backupData'), icon: Database },
    { href: '/announcements/manage', label: t('nav.announcementManage'), icon: Bell },
    { href: '/audit-log', label: t('nav.auditLog'), icon: History },
  ];

  // Host/Admin items
  const hostNavItems = [
    { href: '/announcements/manage', label: t('nav.announcementManage'), icon: Bell },
  ];

  const visibleAdminItems = isSuperAdmin ? superAdminNavItems : hostNavItems;

  return (
    <nav className="bg-white border-b border-amber-200/70 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Mandal Title (Identity name & address ALWAYS remain in Marathi) */}
          <Link href={isAuth ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-devanagari font-black text-xl shadow-md border-2 border-amber-300 group-hover:scale-105 transition-transform flex-shrink-0">
              ॐ
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm sm:text-base font-devanagari text-orange-950 tracking-tight leading-tight">
                {mandalName}
              </span>
              <span className="text-[10px] text-amber-900 font-semibold font-devanagari tracking-wide">
                तापडिया नगर अकोला 444001
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {isAuth ? (
              <>
                {authNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-devanagari transition-all',
                        item.highlight
                          ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm font-bold'
                          : isActive
                          ? 'bg-amber-100/80 text-orange-900 font-bold border border-amber-300/60'
                          : 'text-stone-600 hover:bg-amber-50/60 hover:text-orange-900'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Management Dropdown (Works for Admin & Super Admin) */}
                {visibleAdminItems.length > 0 && (
                  <div className="relative" ref={managementRef}>
                    <button
                      type="button"
                      onClick={() => setIsManagementOpen(!isManagementOpen)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-devanagari transition-colors cursor-pointer',
                        isManagementOpen || visibleAdminItems.some((i) => pathname === i.href)
                          ? 'bg-amber-100/90 text-orange-950 font-bold border border-amber-300'
                          : 'text-stone-600 hover:bg-amber-50 hover:text-orange-900'
                      )}
                    >
                      <Settings className="w-3.5 h-3.5 text-amber-700" />
                      <span>{t('nav.management')}</span>
                      <ChevronDown
                        className={cn(
                          'w-3 h-3 text-stone-500 transition-transform duration-200',
                          isManagementOpen ? 'rotate-180 text-orange-600' : ''
                        )}
                      />
                    </button>

                    {/* Interactive Dropdown Menu */}
                    {isManagementOpen && (
                      <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 z-50 animate-in fade-in-50 slide-in-from-top-1">
                        <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-b border-stone-100 mb-1">
                          {isSuperAdmin ? t('nav.superAdmin') : t('nav.management')}
                        </div>
                        {visibleAdminItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsManagementOpen(false)}
                              className={cn(
                                'flex items-center gap-2.5 px-4 py-2 text-xs font-devanagari transition-colors',
                                isActive
                                  ? 'bg-amber-100/70 text-orange-950 font-bold'
                                  : 'text-stone-700 hover:bg-amber-50 hover:text-orange-900'
                              )}
                            >
                              <Icon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold font-devanagari transition-colors',
                    pathname === '/' ? 'text-orange-800 font-bold' : 'text-stone-600 hover:text-orange-900'
                  )}
                >
                  {t('nav.home')}
                </Link>
                <Link
                  href="/announcements"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold font-devanagari transition-colors',
                    pathname === '/announcements'
                      ? 'text-orange-800 font-bold'
                      : 'text-stone-600 hover:text-orange-900'
                  )}
                >
                  {t('nav.announcements')}
                </Link>
              </>
            )}
          </div>

          {/* Right Action Bar (Language Switcher, Mode Toggle & User / Login) */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* LANGUAGE SELECTOR */}
            <div className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50/70 p-0.5 text-xs font-semibold shadow-sm">
              <button
                type="button"
                onClick={() => setLanguage('mr')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-devanagari transition-all',
                  language === 'mr'
                    ? 'bg-orange-600 text-white font-bold shadow-sm'
                    : 'text-stone-700 hover:text-orange-900'
                )}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-sans transition-all',
                  language === 'en'
                    ? 'bg-orange-600 text-white font-bold shadow-sm'
                    : 'text-stone-700 hover:text-orange-900'
                )}
              >
                English
              </button>
            </div>

            {isAuth && (
              <button
                onClick={toggleMode}
                title="चाचणी किंवा मूळ मोड बदला"
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-bold transition-all border flex items-center gap-1.5',
                  mode === 'TEST'
                    ? 'bg-purple-100 text-purple-900 border-purple-300 ring-2 ring-purple-400'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                )}
              >
                <Sparkles className="w-3 h-3" />
                <span>{mode === 'TEST' ? 'TEST' : 'LIVE'}</span>
              </button>
            )}

            {isAuth ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-800 leading-tight">
                    {user?.name}
                  </div>
                  <div className="text-[10px] text-amber-700 font-semibold">
                    {user?.role === 'SUPER_ADMIN' ? t('nav.superAdmin') : t('nav.host')}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title={t('nav.logout')}
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>{t('nav.login')}</span>
              </Link>
            )}
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Mobile Language Switcher */}
            <div className="inline-flex items-center rounded-lg border border-amber-300 bg-amber-50 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setLanguage('mr')}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[11px] font-devanagari transition-all',
                  language === 'mr' ? 'bg-orange-600 text-white font-bold' : 'text-stone-700'
                )}
              >
                मराठी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[11px] font-sans transition-all',
                  language === 'en' ? 'bg-orange-600 text-white font-bold' : 'text-stone-700'
                )}
              >
                EN
              </button>
            </div>

            {isAuth && (
              <button
                onClick={toggleMode}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-bold border',
                  mode === 'TEST'
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                )}
              >
                {mode === 'TEST' ? 'TEST' : 'LIVE'}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2">
          {isAuth ? (
            <>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-3 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-stone-900">{user?.name}</div>
                  <div className="text-xs text-amber-800 font-semibold">
                    {user?.role === 'SUPER_ADMIN' ? t('nav.superAdmin') : t('nav.host')}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-white text-red-600 rounded-lg text-xs font-semibold border border-red-200"
                >
                  {t('nav.logout')}
                </button>
              </div>

              {authNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold font-devanagari',
                      item.highlight
                        ? 'bg-orange-600 text-white font-bold'
                        : pathname === item.href
                        ? 'bg-amber-100 text-orange-950 font-bold'
                        : 'text-stone-700 hover:bg-stone-50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {visibleAdminItems.length > 0 && (
                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-stone-400 px-3 py-1">
                    {t('nav.management')}
                  </div>
                  {visibleAdminItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 font-devanagari"
                      >
                        <Icon className="w-4 h-4 text-amber-600" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50 font-devanagari"
              >
                {t('nav.home')}
              </Link>
              <Link
                href="/announcements"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50 font-devanagari"
              >
                {t('nav.announcements')}
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-bold text-center font-devanagari"
              >
                {t('nav.login')}
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
