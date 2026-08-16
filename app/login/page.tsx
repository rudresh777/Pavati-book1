'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Lock, Mail, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'लॉगिन अयशस्वी झाले.');
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'काहीतरी त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-devanagari font-black text-3xl shadow-xl mx-auto border-2 border-amber-300">
            ॐ
          </div>
          <h1 className="text-2xl font-black font-devanagari text-stone-900 tracking-tight">
            डिजिटल पावती पुस्तक
          </h1>
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
            मंडळ प्रतिनिधी / ॲडमिन सुरक्षित लॉगिन
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-amber-300/80 shadow-pavti">
          <CardHeader className="bg-amber-50/50 pb-4">
            <CardTitle className="text-base font-bold font-devanagari text-stone-900 flex items-center gap-2">
              <LogIn className="w-4 h-4 text-orange-600" />
              <span>खात्यात प्रवेश करा (Sign In)</span>
            </CardTitle>
            <CardDescription className="text-stone-500 text-xs">
              कृपया आपला नोंदणीकृत ईमेल आणि पासवर्ड प्रविष्ट करा.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  ईमेल आयडी (Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mandal.org"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  पासवर्ड (Password)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full py-2.5 font-bold font-devanagari shadow-md"
                >
                  <span>लॉगिन करा (Sign In)</span>
                </Button>

                <button
                  type="button"
                  onClick={() => router.push(redirectUrl)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 font-devanagari"
                >
                  <span>🔓 थेट डॅशबोर्डवर जा (Bypass Login)</span>
                </button>
              </div>
            </form>

            {/* Quick Demo Credentials Box for Testing */}
            <div className="mt-6 pt-5 border-t border-stone-200 space-y-2.5">
              <div className="text-[11px] font-bold uppercase text-stone-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>चाचणी लॉगिन माहिती (1-Click Auto Fill):</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo('admin@mandal.org', 'admin123')}
                  className="p-2.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-lg text-left transition-colors"
                >
                  <div className="text-[11px] font-bold text-amber-900 font-devanagari">
                    👑 सुपर ॲडमिन
                  </div>
                  <div className="text-[10px] text-stone-600 truncate">admin@mandal.org</div>
                  <div className="text-[10px] text-stone-400">Pass: admin123</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillDemo('host@mandal.org', 'host123')}
                  className="p-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg text-left transition-colors"
                >
                  <div className="text-[11px] font-bold text-stone-900 font-devanagari">
                    🚩 मंडळ प्रतिनिधी
                  </div>
                  <div className="text-[10px] text-stone-600 truncate">host@mandal.org</div>
                  <div className="text-[10px] text-stone-400">Pass: host123</div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">लोड होत आहे...</div>}>
      <LoginForm />
    </Suspense>
  );
}
