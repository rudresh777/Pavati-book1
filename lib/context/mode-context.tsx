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
  refreshUser: () => Promise<AuthSession | null>;
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
  const [user, setUserState] = useState<AuthSession | null>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  const setUser = (newUser: AuthSession | null) => {
    setUserState(newUser);
    if (typeof window !== 'undefined') {
      if (newUser) {
        localStorage.setItem('mandal_auth_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('mandal_auth_user');
      }
    }
  };

  const refreshUser = async (): Promise<AuthSession | null> => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUserState(data.user);
          if (typeof window !== 'undefined') {
            localStorage.setItem('mandal_auth_user', JSON.stringify(data.user));
          }
          return data.user;
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  useEffect(() => {
    // 1. Load persisted mode preference from localStorage
    const savedMode = localStorage.getItem('mandal_app_mode') as AppMode | null;
    if (savedMode === 'TEST' || savedMode === 'LIVE') {
      setModeState(savedMode);
    }

    // 2. Load cached user for instant synchronous render
    const savedUserStr = localStorage.getItem('mandal_auth_user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed?.userId && parsed?.role) {
          setUserState(parsed);
        }
      } catch {
        localStorage.removeItem('mandal_auth_user');
      }
    }

    // 3. Verify and sync with active backend session cookie
    refreshUser().finally(() => {
      setIsLoading(false);
    });
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
        refreshUser,
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
