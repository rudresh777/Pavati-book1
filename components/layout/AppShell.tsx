'use client';

import React, { useEffect, useState } from 'react';
import { ModeProvider } from '@/lib/context/mode-context';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { TestModeBanner } from './TestModeBanner';
import { AuthSession, MandalSettings } from '@/types';

interface AppShellProps {
  children: React.ReactNode;
  initialUser?: AuthSession | null;
  initialSettings?: MandalSettings | null;
}

export function AppShell({ children, initialUser = null, initialSettings = null }: AppShellProps) {
  const [settings, setSettings] = useState<MandalSettings | null>(initialSettings);
  const [user, setUser] = useState<AuthSession | null>(initialUser);

  useEffect(() => {
    // If settings not loaded from server, fetch client-side
    if (!settings) {
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings) setSettings(data.settings);
        })
        .catch(() => {});
    }

    // If user not passed, check auth status
    if (!user) {
      fetch('/api/auth/me')
        .then((res) => res.json())
        .then((data) => {
          if (data.user) setUser(data.user);
        })
        .catch(() => {});
    }
  }, [settings, user]);

  return (
    <ModeProvider initialUser={user}>
      <div className="min-h-screen flex flex-col bg-[#FFFDF9]">
        <TestModeBanner />
        <Navbar mandalName={settings?.mandalNameMarathi} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <Footer mandalName={settings?.mandalNameMarathi} />
      </div>
    </ModeProvider>
  );
}
