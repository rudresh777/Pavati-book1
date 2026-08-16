'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppMode, AuthSession } from '@/types';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  user: AuthSession | null;
  setUser: (user: AuthSession | null) => void;
  isLoading: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: AuthSession | null;
}) {
  const [mode, setModeState] = useState<AppMode>('LIVE');
  const [user, setUser] = useState<AuthSession | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load persisted mode preference from localStorage
    const savedMode = localStorage.getItem('mandal_app_mode') as AppMode | null;
    if (savedMode === 'TEST' || savedMode === 'LIVE') {
      setModeState(savedMode);
    }
    setIsLoading(false);
  }, []);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    localStorage.setItem('mandal_app_mode', newMode);
  };

  const toggleMode = () => {
    const nextMode = mode === 'LIVE' ? 'TEST' : 'LIVE';
    setMode(nextMode);
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        toggleMode,
        user,
        setUser,
        isLoading,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within a ModeProvider');
  }
  return context;
}
