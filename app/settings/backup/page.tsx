'use client';

import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  FileJson,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';

export default function BackupSettingsPage() {
  const { mode, user } = useAppMode();
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // 1. Test Data Clear Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearResult, setClearResult] = useState<string | null>(null);
  const [clearError, setClearError] = useState('');

  // 2. Complete Live Data Reset Modal State (Super Admin Only)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmationInput, setResetConfirmationInput] = useState('');
  const [isResetSecondStep, setIsResetSecondStep] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [resetError, setResetError] = useState('');

  // 3. Restore State
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup/export';
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(isEn ? 'Restoring backup will replace current data. Continue?' : 'बॅकअप रिस्टोअर केल्याने सध्याचा डेटा बदलला जाईल. पुढे जायचे का?')) return;

    setIsRestoring(true);
    setRestoreMessage('');

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to restore backup.' : 'बॅकअप रिस्टोअर करण्यात अडचण आली.'));

      setRestoreMessage(isEn ? 'Data restored successfully!' : 'डेटा यशस्वीरीत्या रिस्टोअर झाला आहे!');
      setTimeout(() => setRestoreMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || (isEn ? 'Invalid backup file or error.' : 'अवैध बॅकअप फाईल किंवा त्रुटी.'));
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  const handleClearTestData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationInput !== 'CLEAR_ALL_TEST_DATA') {
      setClearError(isEn ? 'Please type exact phrase: CLEAR_ALL_TEST_DATA' : 'कृपया अचूक शब्द टाईप करा: CLEAR_ALL_TEST_DATA');
      return;
    }

    setIsClearing(true);
    setClearError('');

    try {
      const res = await fetch('/api/test-mode/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: confirmationInput }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to clear test data.' : 'चाचणी डेटा हटवण्यात त्रुटी आली.'));

      setClearResult(data.message || (isEn ? 'All test data cleared.' : 'सर्व चाचणी डेटा हटवला गेला.'));
      setIsClearModalOpen(false);
      setConfirmationInput('');
      setTimeout(() => setClearResult(null), 5000);
    } catch (err: any) {
      setClearError(err.message || (isEn ? 'Error occurred.' : 'त्रुटी आली.'));
    } finally {
      setIsClearing(false);
    }
  };

  // Handle Full Live Data Reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetConfirmationInput !== 'RESET' && resetConfirmationInput !== 'DELETE ALL DATA') {
      setResetError(isEn ? 'Please type exact phrase: RESET' : 'कृपया अचूक शब्द टाईप करा: RESET');
      return;
    }

    if (!isResetSecondStep) {
      setIsResetSecondStep(true);
      return;
    }

    setIsResetting(true);
    setResetError('');

    try {
      const res = await fetch('/api/data/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'RESET', mode: 'LIVE' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to reset live data.' : 'डेटा रीसेट करताना त्रुटी आली.'));

      setResetResult(data.message || (isEn ? 'All live data successfully reset.' : 'सर्व मूळ डेटा यशस्वीरीत्या रीसेट झाला.'));
      setIsResetModalOpen(false);
      setResetConfirmationInput('');
      setIsResetSecondStep(false);
      setTimeout(() => setResetResult(null), 5000);
    } catch (err: any) {
      setResetError(err.message || (isEn ? 'Error occurred.' : 'त्रुटी आली.'));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-orange-600" />
          <span>{isEn ? 'Data Backup and Reset Management' : 'डेटा बॅकअप व डेटा व्यवस्थापन'}</span>
        </h1>
        <p className="text-xs text-stone-500 font-devanagari">
          {isEn
            ? 'Download backups, restore previous data, or reset system database.'
            : 'मंडळाचा संपूर्ण डेटा एका क्लिकवर डाऊनलोड करा, रिस्टोअर करा किंवा चाचणी व मूळ डेटा स्वच्छ करा.'}
        </p>
      </div>

      {clearResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{clearResult}</span>
        </div>
      )}

      {resetResult && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{resetResult}</span>
        </div>
      )}

      {restoreMessage && (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-xl text-xs text-blue-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{restoreMessage}</span>
        </div>
      )}

      {/* 1. EXPORT BACKUP */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50">
          <CardTitle className="text-base font-bold text-stone-900 font-devanagari flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-600" />
            <span>{isEn ? '1. Export Complete Database Backup' : '१. संपूर्ण डेटा बॅकअप डाऊनलोड करा'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-stone-500 font-devanagari">
            {isEn
              ? 'Download all receipts, donors, settings, and logs as a single secure JSON backup file.'
              : 'मंडळाची माहिती, सर्व देणगीदार, जमा पावत्या, बाकी यादी व ऑडिट लॉग्ज JSON फाईल स्वरूपात डाऊनलोड करा.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Button
            variant="gold"
            onClick={handleDownloadBackup}
            className="font-devanagari flex items-center gap-2 py-3 px-6 shadow font-bold"
          >
            <Download className="w-4 h-4" />
            <span>{isEn ? 'Download Backup File' : 'संपूर्ण डेटाबेस डाऊनलोड करा'}</span>
          </Button>
        </CardContent>
      </Card>

      {/* 2. RESTORE BACKUP */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50">
          <CardTitle className="text-base font-bold text-stone-900 font-devanagari flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>{isEn ? '2. Restore Backup File' : '२. डेटा बॅकअप रिस्टोअर करा'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-stone-500 font-devanagari">
            {isEn
              ? 'Upload a previously saved JSON backup file to restore database records.'
              : 'पूर्वी डाऊनलोड केलेली JSON बॅकअप फाईल अपलोड करून डेटा पूर्ववत करा.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold font-devanagari cursor-pointer shadow-sm">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>{isRestoring ? (isEn ? 'Restoring...' : 'रिस्टोअर होत आहे...') : (isEn ? 'Select Backup JSON File' : 'बॅकअप JSON फाईल निवडा')}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              disabled={isRestoring}
              className="hidden"
            />
          </label>
        </CardContent>
      </Card>

      {/* 3. CLEAR ALL TEST DATA */}
      <Card className="border-amber-300 bg-amber-50/40 shadow-sm">
        <CardHeader className="bg-amber-100/60">
          <CardTitle className="text-base font-bold text-amber-950 font-devanagari flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-amber-700" />
            <span>{isEn ? '3. Clear Test Data' : '३. चाचणी डेटा स्वच्छ करा'}</span>
          </CardTitle>
          <CardDescription className="text-xs text-amber-800 font-devanagari">
            {isEn
              ? 'Clear demo records created in Test Mode without touching Live records.'
              : 'चाचणी दरम्यान तयार केलेला सर्व खोटा डेटा नष्ट करा. मूळ डेटा सुरक्षित राहील.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <p className="text-xs text-stone-700 font-devanagari">
            {isEn
              ? 'This action only deletes receipts and donors created in Test Mode.'
              : 'हा पर्याय फक्त चाचणी मोडमधील पावत्या, देणगीदार आणि काउंटर साफ करतो.'}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmationInput('');
              setClearError('');
              setIsClearModalOpen(true);
            }}
            className="font-devanagari flex items-center gap-2 font-bold py-2.5 px-5 shadow border-amber-400 bg-white hover:bg-amber-50 text-amber-900"
          >
            <Trash2 className="w-4 h-4 text-amber-700" />
            <span>{isEn ? 'Clear Test Data' : 'सर्व चाचणी डेटा हटवा'}</span>
          </Button>
        </CardContent>
      </Card>

      {/* 4. DANGEROUS: COMPLETE LIVE DATA RESET (SUPER ADMIN ONLY) */}
      {isSuperAdmin && (
        <Card className="border-red-400 bg-red-50/50 shadow-sm">
          <CardHeader className="bg-red-100/80">
            <CardTitle className="text-base font-bold text-red-950 font-devanagari flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              <span>{isEn ? '4. Complete Live Data Reset (Super Admin Only)' : '४. संपूर्ण डेटा रीसेट करा'}</span>
            </CardTitle>
            <CardDescription className="text-xs text-red-900 font-devanagari">
              {isEn
                ? 'High risk action: Clears all Live receipts, donors, and balances back to zero.'
                : 'अत्यंत धोक्याची कृती: याने मूळ मधील सर्व पावत्या, देणगीदार आणि बाकी यादी शून्य केली जाईल.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <p className="text-xs text-stone-800 font-devanagari">
              {isEn
                ? 'Use this when starting fresh for a new festival year after exporting your backups.'
                : 'नवीन वर्षाच्या उत्सवाची सुरुवात नव्याने करण्यासाठी किंवा पूर्ण चाचणीनंतर सर्व जुना डेटा नष्ट करण्यासाठी हा पर्याय वापरावा.'}
            </p>
            <Button
              variant="danger"
              onClick={() => {
                setResetConfirmationInput('');
                setResetError('');
                setIsResetSecondStep(false);
                setIsResetModalOpen(true);
              }}
              className="font-devanagari flex items-center gap-2 font-bold py-2.5 px-5 shadow"
            >
              <Flame className="w-4 h-4" />
              <span>{isEn ? 'Reset All Data' : 'संपूर्ण डेटा रीसेट करा'}</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* TEST DATA CLEAR CONFIRMATION MODAL */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-amber-800 font-devanagari">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>{isEn ? 'Confirm Clear Test Data' : 'चाचणी डेटा हटवण्याची पुष्टी करा'}</span>
          </div>
        }
        description={isEn ? 'This action is irreversible. Only test records will be deleted.' : 'हा निर्णय पूर्ववत करता येणार नाही. फक्त चाचणी डेटा नष्ट होईल.'}
        maxWidth="md"
      >
        <form onSubmit={handleClearTestData} className="space-y-4 pt-1">
          {clearError && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs font-bold">
              {clearError}
            </div>
          )}

          <div className="p-3.5 bg-stone-100 rounded-xl text-xs text-stone-700 font-devanagari space-y-1">
            <p>{isEn ? 'Type the exact phrase below to confirm:' : 'पुष्टी करण्यासाठी खालील शब्द टाईप करा:'}</p>
            <div className="font-mono font-bold text-amber-900 bg-white p-2 rounded border border-stone-300 select-all">
              CLEAR_ALL_TEST_DATA
            </div>
          </div>

          <div className="space-y-1">
            <input
              type="text"
              required
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder="CLEAR_ALL_TEST_DATA"
              className="w-full px-3.5 py-2.5 border-2 border-amber-400 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsClearModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isClearing}
              disabled={confirmationInput !== 'CLEAR_ALL_TEST_DATA'}
              className="font-devanagari font-bold bg-amber-600 hover:bg-amber-700"
            >
              {isEn ? 'Clear Test Data' : 'होय, चाचणी डेटा नष्ट करा'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* COMPLETE LIVE DATA RESET CONFIRMATION MODAL (2-STEP) */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          setIsResetModalOpen(false);
          setIsResetSecondStep(false);
        }}
        title={
          <div className="flex items-center gap-2 text-red-600 font-devanagari">
            <Flame className="w-5 h-5" />
            <span>
              {isResetSecondStep
                ? (isEn ? 'Final Confirmation' : 'अंतिम पुष्टीकरण')
                : (isEn ? 'Confirm Complete Data Reset' : 'संपूर्ण डेटा रीसेट पुष्टीकरण')}
            </span>
          </div>
        }
        description={isEn ? 'Warning: This action is permanent and cannot be undone.' : 'चेतावणी: हा निर्णय कायमस्वरूपी आहे आणि पूर्ववत करता येणार नाही.'}
        maxWidth="md"
      >
        <form onSubmit={handleResetSubmit} className="space-y-4 pt-1">
          {resetError && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs font-bold font-devanagari">
              {resetError}
            </div>
          )}

          {!isResetSecondStep ? (
            <>
              <div className="p-3.5 bg-red-100 rounded-xl text-xs text-red-950 font-devanagari space-y-1.5 border border-red-300">
                <p className="font-bold">
                  {isEn ? '⚠️ You are about to wipe all LIVE data:' : '⚠️ तुम्ही मंडळाचा संपूर्ण LIVE डेटा हटवत आहात:'}
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  <li>{isEn ? 'All recorded receipts will be permanently deleted.' : 'सर्व जमा पावत्या नष्ट होतील.'}</li>
                  <li>{isEn ? 'All donors and pending balances will be cleared.' : 'सर्व देणगीदार आणि बाकी यादी शून्य होईल.'}</li>
                  <li>{isEn ? 'Receipt counter will reset to 1.' : 'पावती काउंटर क्रमांक १ वर रीसेट होईल.'}</li>
                </ul>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-stone-700 font-devanagari">
                  {isEn ? 'Type RESET to confirm:' : 'पुष्टी करण्यासाठी RESET टाईप करा:'}
                </label>
                <input
                  type="text"
                  required
                  value={resetConfirmationInput}
                  onChange={(e) => setResetConfirmationInput(e.target.value)}
                  placeholder="RESET"
                  className="w-full px-3.5 py-2.5 border-2 border-red-500 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-red-500 uppercase"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsResetModalOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={resetConfirmationInput !== 'RESET' && resetConfirmationInput !== 'DELETE ALL DATA'}
                  className="font-devanagari font-bold"
                >
                  {isEn ? 'Proceed to Final Step →' : 'पुढे जा →'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-red-500 text-white rounded-xl text-xs font-devanagari space-y-2 shadow">
                <div className="font-bold text-sm">
                  {isEn ? '🚨 Are you 100% sure you want to permanently delete all data?' : '🚨 तुम्ही १००% खात्रीने हा डेटा कायमचा नष्ट करू इच्छिता?'}
                </div>
                <p className="text-[11px] opacity-90">
                  {isEn ? 'Make sure you have exported and downloaded your backup before proceeding.' : 'कृपया पुढे जाण्यापूर्वी बॅकअप डाऊनलोड केल्याची खात्री करा.'}
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setIsResetSecondStep(false);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={isResetting}
                  className="font-devanagari font-bold bg-red-700 hover:bg-red-800"
                >
                  {isEn ? 'Confirm Full Reset' : 'होय, सर्व डेटा नष्ट करा'}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
}
