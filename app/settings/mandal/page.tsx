'use client';

import React, { useEffect, useState } from 'react';
import {
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Building,
  Languages,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/lib/context/language-context';
import { MandalSettings, MandalDesignation } from '@/types';
import { cn } from '@/lib/utils/cn';

export default function MandalSettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const isEn = language === 'en';

  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => setError(isEn ? 'Failed to load settings.' : 'सेटिंग्ज लोड करण्यात अडचण आली.'))
      .finally(() => setIsLoading(false));
  }, [isEn]);

  const handleToggleDesignation = (id: string) => {
    if (!settings) return;
    const updated = settings.designations.map((d) =>
      d.id === id ? { ...d, enabled: !d.enabled } : d
    );
    setSettings({ ...settings, designations: updated });
  };

  const handleUpdateDesignation = (id: string, field: keyof MandalDesignation, value: any) => {
    if (!settings) return;
    const updated = settings.designations.map((d) =>
      d.id === id ? { ...d, [field]: value } : d
    );
    setSettings({ ...settings, designations: updated });
  };

  const handleAddDesignation = () => {
    if (!settings) return;
    const newDesig: MandalDesignation = {
      id: `desig-${Date.now()}`,
      titleMarathi: isEn ? 'Member' : 'पदाधिकारी',
      titleEnglish: 'Member',
      name: '',
      enabled: true,
    };
    setSettings({ ...settings, designations: [...settings.designations, newDesig] });
  };

  const handleDeleteDesignation = (id: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      designations: settings.designations.filter((d) => d.id !== id),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setError('');
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to save settings.' : 'सेटिंग्ज सेव्ह करण्यात अडचण आली.'));

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || (isEn ? 'Something went wrong.' : 'काहीतरी त्रुटी आली.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="text-center py-20 font-devanagari text-stone-600">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
            <Building className="w-6 h-6 text-orange-600" />
            <span>{t('settings.title')}</span>
          </h1>
          <p className="text-xs text-stone-500 font-devanagari">
            {t('settings.subtitle')}
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSaving}
          className="font-devanagari font-bold py-2.5 px-6 shadow flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{t('settings.saveChanges')}</span>
        </Button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>
            {isEn
              ? 'Mandal settings successfully saved!'
              : 'मंडळ सेटिंग्ज यशस्वीरीत्या जतन करण्यात आल्या!'}
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LANGUAGE PREFERENCE SETTING */}
      <Card className="border-amber-300 bg-gradient-to-r from-amber-50/70 to-orange-50/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-amber-950 font-devanagari flex items-center gap-2">
            <Languages className="w-4 h-4 text-orange-600" />
            <span>{t('settings.languageSetting')}</span>
          </CardTitle>
          <CardDescription className="text-xs text-stone-600">
            {t('settings.languageDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setLanguage('mr')}
              className={cn(
                'px-5 py-2.5 rounded-xl border-2 font-bold text-xs sm:text-sm font-devanagari transition-all shadow-sm',
                language === 'mr'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-orange-300'
              )}
            >
              मराठी
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={cn(
                'px-5 py-2.5 rounded-xl border-2 font-bold text-xs sm:text-sm font-sans transition-all shadow-sm',
                language === 'en'
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-orange-300'
              )}
            >
              English
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 1. BASIC MANDAL DETAILS */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50">
          <CardTitle className="text-sm font-bold text-amber-950 font-devanagari">
            {isEn ? '1. Basic Mandal Information' : '१. मंडळाची मूळ माहिती'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Mandal Name (Marathi) *' : 'मंडळाचे नाव (मराठी) *'}
              </label>
              <input
                type="text"
                required
                value={settings.mandalNameMarathi}
                onChange={(e) =>
                  setSettings({ ...settings, mandalNameMarathi: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari font-bold focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Mandal Name (English)' : 'मंडळाचे नाव (इंग्रजी)'}
              </label>
              <input
                type="text"
                value={settings.mandalNameEnglish}
                onChange={(e) =>
                  setSettings({ ...settings, mandalNameEnglish: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Festival Year' : 'उत्सव वर्ष'}
              </label>
              <input
                type="text"
                value={settings.year}
                onChange={(e) => setSettings({ ...settings, year: e.target.value })}
                placeholder="२०२६"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Registration Number' : 'नोंदणी क्रमांक'}
              </label>
              <input
                type="text"
                value={settings.regNumber || ''}
                onChange={(e) => setSettings({ ...settings, regNumber: e.target.value })}
                placeholder="महा/१२३/२०२६"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Location / City' : 'स्थान / शहर'}
              </label>
              <input
                type="text"
                value={settings.locationMarathi}
                onChange={(e) =>
                  setSettings({ ...settings, locationMarathi: e.target.value })
                }
                placeholder="अकोला, महाराष्ट्र"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              {isEn ? 'Mandal Address' : 'मंडळाचा पत्ता'}
            </label>
            <input
              type="text"
              value={settings.addressMarathi || ''}
              onChange={(e) =>
                setSettings({ ...settings, addressMarathi: e.target.value })
              }
              placeholder="उदा. तापडिया नगर अकोला 444001"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. CONTACT & WHATSAPP GROUP */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <CardTitle className="text-sm font-bold text-amber-950 font-devanagari">
              {isEn ? '2. Contact and WhatsApp Group Invite Link' : '२. संपर्क व WhatsApp ग्रुप आमंत्रण लिंक'}
            </CardTitle>
          </div>
          <CardDescription className="text-xs text-stone-500 font-devanagari">
            {isEn
              ? 'Configure official Mandal contact numbers and WhatsApp group invitation link.'
              : 'मंडळाचे अधिकृत संपर्क क्रमांक आणि ग्रुप आमंत्रण लिंक येथे नोंदवा.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Primary Contact Number' : 'मुख्य संपर्क क्रमांक'}
              </label>
              <input
                type="text"
                value={settings.contactNumber}
                onChange={(e) =>
                  setSettings({ ...settings, contactNumber: e.target.value })
                }
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Alternate Contact Number' : 'पर्यायी संपर्क क्रमांक'}
              </label>
              <input
                type="text"
                value={settings.alternateContact || ''}
                onChange={(e) =>
                  setSettings({ ...settings, alternateContact: e.target.value })
                }
                placeholder="9123456789"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-amber-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'WhatsApp Group Invite Link' : 'मंडळ अधिकृत WhatsApp ग्रुप लिंक'}
              </label>
              {settings.whatsappGroupLink && (
                <a
                  href={settings.whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline font-devanagari bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                >
                  <span>{isEn ? 'Test Link' : 'लिंक तपासा'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="url"
              value={settings.whatsappGroupLink}
              onChange={(e) =>
                setSettings({ ...settings, whatsappGroupLink: e.target.value })
              }
              placeholder="https://chat.whatsapp.com/XXXXXXXX"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-[11px] text-stone-500 font-devanagari leading-relaxed">
              {isEn
                ? 'Example: https://chat.whatsapp.com/XXXXXXXX — Donors can click this link to voluntarily join the WhatsApp group after receipt generation.'
                : 'उदा. https://chat.whatsapp.com/XXXXXXXX — पावती तयार झाल्यानंतर भाविक या लिंकवरून स्वेच्छेने ग्रुपमध्ये सामील होऊ शकतात.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. COMMITTEE DESIGNATIONS WITH ON/OFF TOGGLES */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-amber-950 font-devanagari">
              {isEn ? '3. Committee Designations on Receipt' : '३. पावतीवरील पदाधिकारी नावे'}
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 font-devanagari">
              {isEn
                ? 'Toggle ON the designations you want to display on the receipt.'
                : 'ज्या पदाधिकाऱ्यांचे नाव पावतीवर दाखवायचे आहे ते सुरू ठेवा.'}
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDesignation}
            className="font-devanagari flex items-center gap-1 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isEn ? '+ Add Designation' : '+ नवीन पद जोडा'}</span>
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-3">
          {settings.designations.map((desig) => (
            <div
              key={desig.id}
              className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1">
                <button
                  type="button"
                  onClick={() => handleToggleDesignation(desig.id)}
                  className={`p-1.5 rounded-lg border flex items-center gap-1.5 text-xs font-bold font-devanagari transition-colors ${
                    desig.enabled
                      ? 'bg-emerald-100 border-emerald-400 text-emerald-800'
                      : 'bg-stone-200 border-stone-300 text-stone-600'
                  }`}
                >
                  {desig.enabled ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-emerald-700" />
                      <span>{isEn ? 'ON' : 'सुरू'}</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-stone-500" />
                      <span>{isEn ? 'OFF' : 'बंद'}</span>
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2 flex-1">
                  <input
                    type="text"
                    value={desig.titleMarathi}
                    onChange={(e) =>
                      handleUpdateDesignation(desig.id, 'titleMarathi', e.target.value)
                    }
                    placeholder={isEn ? 'Designation' : 'उदा. अध्यक्ष'}
                    className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-devanagari font-bold"
                  />

                  <input
                    type="text"
                    value={desig.name}
                    onChange={(e) =>
                      handleUpdateDesignation(desig.id, 'name', e.target.value)
                    }
                    placeholder={isEn ? 'Name' : 'उदा. रमेश पाटील'}
                    className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-devanagari"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDeleteDesignation(desig.id)}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 4. RECEIPT NUMBERING */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50">
          <CardTitle className="text-sm font-bold text-amber-950 font-devanagari">
            {isEn ? '4. Receipt Numbering Settings' : '४. पावती अनुक्रमांक सेटिंग्ज'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Receipt Prefix' : 'पावती उपसर्ग'}
              </label>
              <input
                type="text"
                value={settings.receiptPrefix || ''}
                onChange={(e) =>
                  setSettings({ ...settings, receiptPrefix: e.target.value })
                }
                placeholder={isEn ? 'e.g. GPB- or leave blank' : 'उदा. GPB- किंवा रिक्त ठेवा'}
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Starting Receipt Number' : 'सुरुवातीचा पावती क्रमांक'}
              </label>
              <input
                type="number"
                min="1"
                value={settings.startingReceiptNumber || 1}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    startingReceiptNumber: Number(e.target.value) || 1,
                  })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end pt-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isSaving}
          className="font-devanagari font-bold py-3 px-8 shadow-lg text-base"
        >
          <Save className="w-5 h-5 mr-2" />
          <span>{t('settings.saveChanges')}</span>
        </Button>
      </div>
    </form>
  );
}
