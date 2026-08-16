'use client';

import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Building,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MandalSettings, MandalDesignation } from '@/types';

export default function MandalSettingsPage() {
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
      .catch((err) => setError('सेटिंग्ज लोड करण्यात अडचण आली.'))
      .finally(() => setIsLoading(false));
  }, []);

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
      titleMarathi: 'पदाधिकारी',
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
      if (!res.ok) throw new Error(data.error || 'सेटिंग्ज सेव्ह करण्यात अडचण आली.');

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'काहीतरी त्रुटी आली.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="text-center py-20 font-devanagari text-stone-600">
        सेटिंग्ज लोड होत आहेत...
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
            <span>मंडळ व पावती सेटिंग्ज (Mandal Settings)</span>
          </h1>
          <p className="text-xs text-stone-500 font-devanagari">
            मंडळाचे नाव, पत्ता, संपर्क, पावतीचे स्वरूप आणि पदाधिकाऱ्यांची माहिती येथे बदला.
          </p>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={isSaving}
          className="font-devanagari font-bold py-2.5 px-6 shadow flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>बदल सेव्ह करा</span>
        </Button>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>मंडळ सेटिंग्ज यशस्वीरीत्या जतन करण्यात आल्या!</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. BASIC MANDAL DETAILS */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50">
          <CardTitle className="text-sm font-bold text-amber-950 font-devanagari">
            १. मंडळाचे मूळ नाव व माहिती (Basic Mandal Info)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                मंडळाचे नाव (मराठी) *
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
                मंडळाचे नाव (English)
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
                उत्सव वर्ष (Year)
              </label>
              <input
                type="text"
                value={settings.year}
                onChange={(e) => setSettings({ ...settings, year: e.target.value })}
                placeholder="२०२६-२०२७"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                नोंदणी क्रमांक (Reg. No. - Optional)
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
                स्थान / शहर (Location)
              </label>
              <input
                type="text"
                value={settings.locationMarathi}
                onChange={(e) =>
                  setSettings({ ...settings, locationMarathi: e.target.value })
                }
                placeholder="पुणे, महाराष्ट्र"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              मंडळाचा पूर्ण पत्ता (Address)
            </label>
            <input
              type="text"
              value={settings.addressMarathi || ''}
              onChange={(e) =>
                setSettings({ ...settings, addressMarathi: e.target.value })
              }
              placeholder="उदा. लक्ष्मी रोड, गणपती चौक, पुणे - ४११००२"
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-devanagari focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. CONTACT & WHATSAPP GROUP */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50">
          <CardTitle className="text-sm font-bold text-amber-950 font-devanagari">
            २. संपर्क व WhatsApp ग्रुप लिंक
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                मुख्य संपर्क क्रमांक (Contact Number)
              </label>
              <input
                type="text"
                value={settings.contactNumber}
                onChange={(e) =>
                  setSettings({ ...settings, contactNumber: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                पर्यायी संपर्क क्रमांक (Alternate Contact)
              </label>
              <input
                type="text"
                value={settings.alternateContact || ''}
                onChange={(e) =>
                  setSettings({ ...settings, alternateContact: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              मंडळ अधिकृत WhatsApp ग्रुप लिंक (Group Invite Link)
            </label>
            <input
              type="url"
              value={settings.whatsappGroupLink}
              onChange={(e) =>
                setSettings({ ...settings, whatsappGroupLink: e.target.value })
              }
              placeholder="https://chat.whatsapp.com/..."
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-[11px] text-stone-500 font-devanagari">
              पावती शेअर करताना देणगीदाराला या ग्रुपमध्ये सामील होण्यासाठी आमंत्रण लिंक दिली जाईल.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 3. COMMITTEE DESIGNATIONS WITH ON/OFF TOGGLES */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-amber-950 font-devanagari">
              ३. पावतीवरील पदाधिकारी नावे व टॉगल (Designations on Pavti)
            </CardTitle>
            <CardDescription className="text-xs text-stone-500 font-devanagari">
              ज्या पदाधिकाऱ्यांचे नाव पावतीवर दाखवायचे आहे ते सुरू (ON) ठेवा. नको असल्यास बंद (OFF) करा.
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
            <span>+ नवीन पद जोडा</span>
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-3">
          {settings.designations.map((desig) => (
            <div
              key={desig.id}
              className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 flex-1">
                {/* ON/OFF TOGGLE */}
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
                      <span>सुरू (ON)</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-stone-500" />
                      <span>बंद (OFF)</span>
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
                    placeholder="उदा. अध्यक्ष / सचिव"
                    className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-devanagari font-bold"
                  />

                  <input
                    type="text"
                    value={desig.name}
                    onChange={(e) =>
                      handleUpdateDesignation(desig.id, 'name', e.target.value)
                    }
                    placeholder="उदा. श्री. रमेश पाटील"
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
            ४. पावती अनुक्रमांक सेटिंग्ज (Receipt Numbering)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                पावती उपसर्ग (Receipt Prefix - Optional)
              </label>
              <input
                type="text"
                value={settings.receiptPrefix || ''}
                onChange={(e) =>
                  setSettings({ ...settings, receiptPrefix: e.target.value })
                }
                placeholder="उदा. GPB- किंवा रिक्त ठेवा"
                className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 font-mono focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                सुरुवातीचा पावती क्रमांक (Starting Number)
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
              <p className="text-[11px] text-stone-500">
                उदा. 1 $\rightarrow$ 000001, 101 $\rightarrow$ 000101
              </p>
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
          <span>सर्व बदल सेव्ह करा (Save All Changes)</span>
        </Button>
      </div>
    </form>
  );
}
