'use client';

import React from 'react';
import { ModeProvider } from '@/lib/context/mode-context';
import { TestModeBanner } from '@/components/layout/TestModeBanner';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ModeProvider>
      <div className="min-h-screen flex flex-col bg-[#FFFDF9]">
        <TestModeBanner />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
        <Footer />
      </div>
    </ModeProvider>
  );
}
