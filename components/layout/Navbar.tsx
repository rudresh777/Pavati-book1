'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  FileText,
  PlusCircle,
  Clock,
  Users,
  CreditCard,
  Settings,
  ShieldAlert,
  LogOut,
  Sparkles,
  Home,
  Bell,
  Sliders,
  Database,
  History,
} from 'lucide-react';
import { useAppMode } from '@/lib/context/mode-context';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils/cn';

interface NavbarProps {
  mandalName?: string;
  mandalLogo?: string;
}

export function Navbar({ mandalName = 'मोरया गणेशोत्सव मंडळ' }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, toggleMode, user } = useAppMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    { href: '/dashboard', label: 'डॅशबोर्ड', icon: Home },
    { href: '/pavti/new', label: 'नवीन पावती', icon: PlusCircle, highlight: true },
    { href: '/pending', label: 'बाकी यादी', icon: Clock },
    { href: '/donors', label: 'देणगीदार', icon: Users },
    { href: '/payments', label: 'जमा नोंदी', icon: CreditCard },
  ];

  const adminNavItems = [
    { href: '/settings/mandal', label: 'मंडळ माहिती', icon: Sliders },
    { href: '/settings/users', label: 'होस्ट व्यवस्थापन', icon: Users },
    { href: '/settings/backup', label: 'डेटा बॅकअप / चाचणी', icon: Database },
    { href: '/announcements/manage', label: 'सूचना व्यवस्थापन', icon: Bell },
    { href: '/audit-log', label: 'ऑडिट लॉग', icon: History },
  ];

  return (
    <nav className="bg-white border-b border-amber-200/70 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Mandal Title */}
          <Link href={isAuth ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-devanagari font-black text-xl shadow-md border-2 border-amber-300 group-hover:scale-105 transition-transform">
              ॐ
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base sm:text-lg font-devanagari text-orange-950 tracking-tight leading-tight">
                {mandalName}
              </span>
              <span className="text-[10px] text-amber-800 font-semibold tracking-wider uppercase">
                डिजिटल पावती पुस्तक
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
                          ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
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

                {/* Super Admin Dropdown */}
                {isSuperAdmin && (
                  <div className="relative group">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:bg-amber-50 hover:text-orange-900 transition-colors font-devanagari">
                      <Settings className="w-3.5 h-3.5 text-amber-700" />
                      <span>व्यवस्थापन</span>
                    </button>
                    <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 hidden group-hover:block animate-in fade-in-50">
                      {adminNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-2 px-4 py-2 text-xs text-stone-700 hover:bg-amber-50 hover:text-orange-900 font-devanagari"
                          >
                            <Icon className="w-3.5 h-3.5 text-amber-600" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
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
                  मुखपृष्ठ
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
                  मंडळ सूचना
                </Link>
              </>
            )}
          </div>

          {/* Right Action Bar (Mode Toggle & User / Login) */}
          <div className="hidden md:flex items-center gap-3">
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
                <span>{mode === 'TEST' ? 'TEST MODE' : 'LIVE'}</span>
              </button>
            )}

            {isAuth ? (
              <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
                <div className="text-right">
                  <div className="text-xs font-bold text-stone-800 leading-tight">
                    {user?.name}
                  </div>
                  <div className="text-[10px] text-amber-700 font-semibold">
                    {user?.role === 'SUPER_ADMIN' ? 'सुपर ॲडमिन' : 'मंडळ प्रतिनिधी (Host)'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  title="लॉगआउट"
                  className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>प्रतिनिधी लॉगिन</span>
              </Link>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuth && (
              <button
                onClick={toggleMode}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-bold border',
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
                    {user?.role === 'SUPER_ADMIN' ? 'सुपर ॲडमिन' : 'मंडळ प्रतिनिधी (Host)'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-white text-red-600 rounded-lg text-xs font-semibold border border-red-200"
                >
                  लॉगआउट
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

              {isSuperAdmin && (
                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <div className="text-[11px] font-bold uppercase text-stone-400 px-3 py-1">
                    सुपर ॲडमिन व्यवस्थापन
                  </div>
                  {adminNavItems.map((item) => {
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
                मुखपृष्ठ (Home)
              </Link>
              <Link
                href="/announcements"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-stone-700 hover:bg-stone-50 font-devanagari"
              >
                मंडळ सूचना (Announcements)
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-bold text-center font-devanagari"
              >
                मंडळ प्रतिनिधी लॉगिन (Host Login)
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
