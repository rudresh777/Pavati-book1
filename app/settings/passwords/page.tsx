'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  KeyRound,
  Shield,
  ShieldAlert,
  UserCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
  Users,
  Building,
  Database,
  History,
  Sliders,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';
import { User, MandalSettings } from '@/types';
import { cn } from '@/lib/utils/cn';

export default function PasswordManagementPage() {
  const { user } = useAppMode();
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [superAdminUsers, setSuperAdminUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Admin Form State
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');

  // Super Admin Form State
  const [selectedSuperAdminId, setSelectedSuperAdminId] = useState('');
  const [superAdminNewPassword, setSuperAdminNewPassword] = useState('');
  const [superAdminConfirmPassword, setSuperAdminConfirmPassword] = useState('');
  const [showSuperAdminNewPassword, setShowSuperAdminNewPassword] = useState(false);
  const [showSuperAdminConfirmPassword, setShowSuperAdminConfirmPassword] = useState(false);
  const [superAdminError, setSuperAdminError] = useState('');
  const [superAdminSuccess, setSuperAdminSuccess] = useState('');

  // Confirmation Modal State
  const [confirmModalData, setConfirmModalData] = useState<{
    isOpen: boolean;
    targetUser: User | null;
    newPassword: string;
    type: 'ADMIN' | 'SUPER_ADMIN';
  }>({
    isOpen: false,
    targetUser: null,
    newPassword: '',
    type: 'ADMIN',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsersList = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const [passwordsRes, settingsRes] = await Promise.all([
        fetch('/api/settings/passwords'),
        fetch('/api/settings'),
      ]);

      const passwordsData = await passwordsRes.json();
      const settingsData = await settingsRes.json();

      if (passwordsData.error) {
        throw new Error(passwordsData.error);
      }

      if (passwordsData.adminUsers) setAdminUsers(passwordsData.adminUsers);
      if (passwordsData.superAdminUsers) setSuperAdminUsers(passwordsData.superAdminUsers);
      if (settingsData.settings) setSettings(settingsData.settings);

      // Default select first available accounts if available
      if (passwordsData.adminUsers && passwordsData.adminUsers.length > 0 && !selectedAdminId) {
        setSelectedAdminId(passwordsData.adminUsers[0].id);
      }
      if (passwordsData.superAdminUsers && passwordsData.superAdminUsers.length > 0 && !selectedSuperAdminId) {
        setSelectedSuperAdminId(passwordsData.superAdminUsers[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load password management data:', err);
      setFetchError(err.message || (isEn ? 'Failed to load user accounts.' : 'वापरकर्ता खाती लोड करण्यात अडचण आली.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersList();
  }, [user]);

  // Selected User Lookups
  const selectedAdminUser = adminUsers.find((u) => u.id === selectedAdminId);
  const selectedSuperAdminUser = superAdminUsers.find((u) => u.id === selectedSuperAdminId);

  // Handle Admin Password Submit Initiation
  const handleAdminFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!selectedAdminId || !selectedAdminUser) {
      setAdminError(isEn ? 'Please select an Admin account.' : 'कृपया ॲडमिन खाते निवडा.');
      return;
    }

    if (!adminNewPassword) {
      setAdminError(isEn ? 'Please enter a new password.' : 'कृपया नवीन पासवर्ड प्रविष्ट करा.');
      return;
    }

    if (adminNewPassword.length < 6) {
      setAdminError(isEn ? 'Password must be at least 6 characters.' : 'पासवर्ड किमान ६ अक्षरांचा असावा.');
      return;
    }

    if (adminNewPassword !== adminConfirmPassword) {
      setAdminError(isEn ? 'Passwords do not match. Please verify.' : 'दोन्ही पासवर्ड जुळत नाहीत. कृपया पुन्हा तपासा.');
      return;
    }

    // Open confirmation modal
    setConfirmModalData({
      isOpen: true,
      targetUser: selectedAdminUser,
      newPassword: adminNewPassword,
      type: 'ADMIN',
    });
  };

  // Handle Super Admin Password Submit Initiation
  const handleSuperAdminFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuperAdminError('');
    setSuperAdminSuccess('');

    if (!selectedSuperAdminId || !selectedSuperAdminUser) {
      setSuperAdminError(isEn ? 'Please select a Super Admin account.' : 'कृपया सुपर ॲडमिन खाते निवडा.');
      return;
    }

    if (!superAdminNewPassword) {
      setSuperAdminError(isEn ? 'Please enter a new password.' : 'कृपया नवीन पासवर्ड प्रविष्ट करा.');
      return;
    }

    if (superAdminNewPassword.length < 6) {
      setSuperAdminError(isEn ? 'Password must be at least 6 characters.' : 'पासवर्ड किमान ६ अक्षरांचा असावा.');
      return;
    }

    if (superAdminNewPassword !== superAdminConfirmPassword) {
      setSuperAdminError(isEn ? 'Passwords do not match. Please verify.' : 'दोन्ही पासवर्ड जुळत नाहीत. कृपया पुन्हा तपासा.');
      return;
    }

    // Open confirmation modal
    setConfirmModalData({
      isOpen: true,
      targetUser: selectedSuperAdminUser,
      newPassword: superAdminNewPassword,
      type: 'SUPER_ADMIN',
    });
  };

  // Execute Password Change
  const handleConfirmPasswordChange = async () => {
    if (!confirmModalData.targetUser || !confirmModalData.newPassword) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/settings/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: confirmModalData.targetUser.id,
          newPassword: confirmModalData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (isEn ? 'Failed to update password.' : 'पासवर्ड बदलण्यात त्रुटी आली.'));
      }

      // Success handling: Clear password inputs immediately from state
      if (confirmModalData.type === 'ADMIN') {
        setAdminNewPassword('');
        setAdminConfirmPassword('');
        setAdminSuccess(
          isEn
            ? `Admin password for "${confirmModalData.targetUser.name}" (${confirmModalData.targetUser.email}) changed successfully.`
            : `"${confirmModalData.targetUser.name}" (${confirmModalData.targetUser.email}) या ॲडमिन खात्याचा पासवर्ड यशस्वीरित्या बदलला आहे.`
        );
        setAdminError('');
      } else {
        setSuperAdminNewPassword('');
        setSuperAdminConfirmPassword('');
        setSuperAdminSuccess(
          isEn
            ? `Super Admin password for "${confirmModalData.targetUser.name}" (${confirmModalData.targetUser.email}) changed successfully.`
            : `"${confirmModalData.targetUser.name}" (${confirmModalData.targetUser.email}) या सुपर ॲडमिन खात्याचा पासवर्ड यशस्वीरित्या बदलला आहे.`
        );
        setSuperAdminError('');
      }

      setConfirmModalData({ isOpen: false, targetUser: null, newPassword: '', type: 'ADMIN' });
    } catch (err: any) {
      if (confirmModalData.type === 'ADMIN') {
        setAdminError(err.message || (isEn ? 'Failed to change password.' : 'पासवर्ड बदलताना त्रुटी आली.'));
      } else {
        setSuperAdminError(err.message || (isEn ? 'Failed to change password.' : 'पासवर्ड बदलताना त्रुटी आली.'));
      }
      setConfirmModalData({ ...confirmModalData, isOpen: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Strict UI Restriction: If not super admin, show access restricted screen
  if (!isLoading && !isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-red-200 rounded-2xl shadow-sm text-center space-y-4 font-devanagari">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">
          {isEn ? 'Access Restricted' : 'अनधिकृत प्रवेश'}
        </h2>
        <p className="text-sm text-stone-600">
          {isEn
            ? 'Password Management is strictly restricted to Super Admin users only.'
            : 'पासवर्ड व्यवस्थापन सुविधा फक्त सुपर ॲडमिनसाठी उपलब्ध आहे.'}
        </p>
        <div className="pt-2">
          <Link href="/dashboard">
            <Button variant="primary" size="md">
              {isEn ? 'Return to Dashboard' : 'डॅशबोर्डवर परत जा'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. MANDAL HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-600 text-white font-devanagari tracking-wide shadow-sm">
            ॥ {settings?.sloganMarathi || '॥ गणपती बाप्पा मोरया ॥'} ॥
          </span>
          <span className="text-xs text-stone-500 font-semibold font-devanagari">
            सन {settings?.year || '२०२६'}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2.5">
          <KeyRound className="w-6 h-6 text-orange-600 flex-shrink-0" />
          <span>{isEn ? 'Password Management' : 'पासवर्ड व्यवस्थापन'}</span>
        </h1>
        <p className="text-xs text-stone-600 font-devanagari">
          {isEn
            ? 'Securely manage and change passwords for Admin and Super Admin accounts. Supabase Auth manages credentials.'
            : 'मंडळातील ॲडमिन आणि सुपर ॲडमिन खात्यांचे पासवर्ड सुरक्षितपणे बदला. पासवर्ड Supabase Auth द्वारे नियंत्रित केले जातात.'}
        </p>
      </div>

      {/* 2. SUB-NAVIGATION SHORTCUTS */}
      <div className="flex flex-wrap gap-2 text-xs font-devanagari">
        <Link href="/settings/mandal">
          <Button variant="outline" size="sm" className="bg-white">
            <Sliders className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('nav.mandalSettings')}</span>
          </Button>
        </Link>
        <Link href="/settings/users">
          <Button variant="outline" size="sm" className="bg-white">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('nav.hostManagement')}</span>
          </Button>
        </Link>
        <Button variant="primary" size="sm" className="font-bold">
          <KeyRound className="w-3.5 h-3.5 mr-1.5" />
          <span>{isEn ? 'Password Management' : 'पासवर्ड व्यवस्थापन'}</span>
        </Button>
        <Link href="/settings/backup">
          <Button variant="outline" size="sm" className="bg-white">
            <Database className="w-3.5 h-3.5 mr-1.5" />
            <span>{t('nav.backupData')}</span>
          </Button>
        </Link>
      </div>

      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-devanagari flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* 3. TWO-COLUMN PASSWORD MANAGEMENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* SECTION 1: CHANGE ADMIN PASSWORD */}
        {/* ========================================================================= */}
        <Card className="border-stone-200 shadow-sm hover:border-amber-300 transition-colors">
          <CardHeader className="bg-gradient-to-r from-amber-50/70 to-orange-50/40 border-b border-amber-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-devanagari font-bold text-base">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <span>{isEn ? 'Change Admin Password' : 'ॲडमिन पासवर्ड बदला'}</span>
              </div>
              <Badge variant="warning">
                {adminUsers.length} {isEn ? 'Admin Accounts' : 'ॲडमिन खाती'}
              </Badge>
            </div>
            <CardDescription className="text-xs font-devanagari text-stone-500 pt-1">
              {isEn
                ? 'Select the Admin account and set a new password. The old password will stop working immediately.'
                : 'ज्या ॲडमिन खात्याचा पासवर्ड बदलायचा आहे ते खाते निवडा आणि नवीन पासवर्ड सेट करा.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 font-devanagari text-xs space-y-4">
            {adminSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span className="font-semibold">{adminSuccess}</span>
              </div>
            )}

            {adminError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{adminError}</span>
              </div>
            )}

            {adminUsers.length === 0 ? (
              <div className="p-6 text-center text-stone-500 border border-dashed border-stone-200 rounded-xl space-y-2">
                <Users className="w-8 h-8 mx-auto text-stone-300" />
                <p className="font-semibold">
                  {isEn ? 'No Admin accounts found.' : 'कोणतेही ॲडमिन खाते उपलब्ध नाही.'}
                </p>
                <Link href="/settings/users">
                  <Button variant="outline" size="sm" className="text-xs">
                    {isEn ? '+ Create Admin in Host Management' : '+ प्रतिनिधी व्यवस्थापनात ॲडमिन तयार करा'}
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleAdminFormSubmit} className="space-y-4">
                {/* Select Admin Account */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block">
                    {isEn ? 'Select Admin Account *' : 'ॲडमिन खाते निवडा *'}
                  </label>
                  <select
                    value={selectedAdminId}
                    onChange={(e) => {
                      setSelectedAdminId(e.target.value);
                      setAdminError('');
                      setAdminSuccess('');
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:border-orange-500 focus:outline-none cursor-pointer"
                  >
                    {adminUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email} ({isEn ? 'Admin' : 'प्रतिनिधी'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Account Info Card */}
                {selectedAdminUser && (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-1 text-[11px]">
                    <div className="font-bold text-stone-700">
                      {isEn ? 'Selected Account Details:' : 'निवडलेले खाते तपशील:'}
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>{isEn ? 'Name:' : 'नाव:'}</span>
                      <strong className="text-stone-900">{selectedAdminUser.name}</strong>
                    </div>
                    <div className="flex justify-between text-stone-600 font-mono">
                      <span>{isEn ? 'Email:' : 'ईमेल:'}</span>
                      <span className="text-stone-800">{selectedAdminUser.email}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>{isEn ? 'Role:' : 'भूमिका:'}</span>
                      <Badge variant="warning">{isEn ? 'Admin (Host)' : 'मंडळ प्रतिनिधी'}</Badge>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block">
                    {isEn ? 'New Password *' : 'नवीन पासवर्ड *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminNewPassword ? 'text' : 'password'}
                      required
                      placeholder={isEn ? 'Minimum 6 characters...' : 'किमान ६ अक्षरे...'}
                      value={adminNewPassword}
                      onChange={(e) => {
                        setAdminNewPassword(e.target.value);
                        setAdminError('');
                      }}
                      className="w-full pl-3 pr-10 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showAdminNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block">
                    {isEn ? 'Confirm New Password *' : 'नवीन पासवर्डची पुष्टी करा *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showAdminConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder={isEn ? 'Re-type new password...' : 'पुन्हा पासवर्ड टाईप करा...'}
                      value={adminConfirmPassword}
                      onChange={(e) => {
                        setAdminConfirmPassword(e.target.value);
                        setAdminError('');
                      }}
                      className="w-full pl-3 pr-10 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showAdminConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full font-bold shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    <span>{isEn ? 'Change Admin Password' : 'ॲडमिन पासवर्ड बदला'}</span>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* SECTION 2: CHANGE SUPER ADMIN PASSWORD */}
        {/* ========================================================================= */}
        <Card className="border-stone-200 shadow-sm hover:border-blue-300 transition-colors">
          <CardHeader className="bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border-b border-blue-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-stone-900 font-devanagari font-bold text-base">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-lg">
                  <KeyRound className="w-5 h-5" />
                </div>
                <span>{isEn ? 'Change Super Admin Password' : 'सुपर ॲडमिन पासवर्ड बदला'}</span>
              </div>
              <Badge variant="gold">
                {superAdminUsers.length} {isEn ? 'Super Admin Accounts' : 'सुपर ॲडमिन खाती'}
              </Badge>
            </div>
            <CardDescription className="text-xs font-devanagari text-stone-500 pt-1">
              {isEn
                ? 'Select the Super Admin account and update credentials. Previous password will immediately expire.'
                : 'सुपर ॲडमिन खात्याचा पासवर्ड सुरक्षितपणे अद्ययावत करा. जुना पासवर्ड ताबडतोब निष्क्रीय होईल.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-5 font-devanagari text-xs space-y-4">
            {superAdminSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span className="font-semibold">{superAdminSuccess}</span>
              </div>
            )}

            {superAdminError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>{superAdminError}</span>
              </div>
            )}

            {superAdminUsers.length === 0 ? (
              <div className="p-6 text-center text-stone-500 border border-dashed border-stone-200 rounded-xl space-y-2">
                <Users className="w-8 h-8 mx-auto text-stone-300" />
                <p className="font-semibold">
                  {isEn ? 'No Super Admin accounts found.' : 'कोणतेही सुपर ॲडमिन खाते उपलब्ध नाही.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSuperAdminFormSubmit} className="space-y-4">
                {/* Select Super Admin Account */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block">
                    {isEn ? 'Select Super Admin Account *' : 'सुपर ॲडमिन खाते निवडा *'}
                  </label>
                  <select
                    value={selectedSuperAdminId}
                    onChange={(e) => {
                      setSelectedSuperAdminId(e.target.value);
                      setSuperAdminError('');
                      setSuperAdminSuccess('');
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                  >
                    {superAdminUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email} ({isEn ? 'Super Admin' : 'सुपर ॲडमिन'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Super Admin Info Card */}
                {selectedSuperAdminUser && (
                  <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg space-y-1 text-[11px]">
                    <div className="font-bold text-stone-700">
                      {isEn ? 'Selected Account Details:' : 'निवडलेले खाते तपशील:'}
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>{isEn ? 'Name:' : 'नाव:'}</span>
                      <strong className="text-stone-900">{selectedSuperAdminUser.name}</strong>
                    </div>
                    <div className="flex justify-between text-stone-600 font-mono">
                      <span>{isEn ? 'Email:' : 'ईमेल:'}</span>
                      <span className="text-stone-800">{selectedSuperAdminUser.email}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>{isEn ? 'Role:' : 'भूमिका:'}</span>
                      <Badge variant="gold">{isEn ? 'Super Admin' : 'सुपर ॲडमिन'}</Badge>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block">
                    {isEn ? 'New Password *' : 'नवीन पासवर्ड *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showSuperAdminNewPassword ? 'text' : 'password'}
                      required
                      placeholder={isEn ? 'Minimum 6 characters...' : 'किमान ६ अक्षरे...'}
                      value={superAdminNewPassword}
                      onChange={(e) => {
                        setSuperAdminNewPassword(e.target.value);
                        setSuperAdminError('');
                      }}
                      className="w-full pl-3 pr-10 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSuperAdminNewPassword(!showSuperAdminNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showSuperAdminNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="font-bold text-stone-800 block">
                    {isEn ? 'Confirm New Password *' : 'नवीन पासवर्डची पुष्टी करा *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showSuperAdminConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder={isEn ? 'Re-type new password...' : 'पुन्हा पासवर्ड टाईप करा...'}
                      value={superAdminConfirmPassword}
                      onChange={(e) => {
                        setSuperAdminConfirmPassword(e.target.value);
                        setSuperAdminError('');
                      }}
                      className="w-full pl-3 pr-10 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSuperAdminConfirmPassword(!showSuperAdminConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showSuperAdminConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full font-bold shadow-sm bg-blue-700 hover:bg-blue-800"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    <span>{isEn ? 'Change Super Admin Password' : 'सुपर ॲडमिन पासवर्ड बदला'}</span>
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. CONFIRMATION DIALOG MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={confirmModalData.isOpen}
        onClose={() => setConfirmModalData({ ...confirmModalData, isOpen: false })}
        title={
          <div className="flex items-center gap-2 text-amber-700 font-devanagari">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>{isEn ? 'Change Password?' : 'पासवर्ड बदलायचा आहे का?'}</span>
          </div>
        }
        description={
          isEn
            ? 'You are about to change the password for this account. The previous password will no longer work. Continue?'
            : 'तुम्ही या खात्याचा पासवर्ड बदलत आहात. जुना पासवर्ड ताबडतोब काम करणे बंद करेल. पुढे जायचे का?'
        }
        maxWidth="sm"
      >
        {confirmModalData.targetUser && (
          <div className="space-y-4 font-devanagari text-xs">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5 text-stone-800">
              <div className="flex justify-between">
                <span className="text-stone-500">{isEn ? 'Account Name:' : 'खाते धारक नाव:'}</span>
                <span className="font-bold text-stone-900">{confirmModalData.targetUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{isEn ? 'Email:' : 'ईमेल:'}</span>
                <span className="font-mono text-stone-800">{confirmModalData.targetUser.email}</span>
              </div>
              <div className="flex justify-between border-t border-amber-200/70 pt-1">
                <span className="text-stone-500">{isEn ? 'Role:' : 'भूमिका:'}</span>
                <Badge variant={confirmModalData.targetUser.role === 'SUPER_ADMIN' ? 'gold' : 'warning'}>
                  {confirmModalData.targetUser.role === 'SUPER_ADMIN'
                    ? isEn
                      ? 'Super Admin'
                      : 'सुपर ॲडमिन'
                    : isEn
                    ? 'Admin (Host)'
                    : 'मंडळ प्रतिनिधी'}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModalData({ ...confirmModalData, isOpen: false })}
                disabled={isSubmitting}
              >
                {isEn ? 'Cancel' : 'रद्द करा'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmPasswordChange}
                disabled={isSubmitting}
                className="font-bold bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSubmitting
                  ? '...'
                  : isEn
                  ? 'Change Password'
                  : 'पासवर्ड बदला'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
