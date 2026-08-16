import React from 'react';
import { Database, CheckCircle, ExternalLink, HardDrive, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function StorageSettingsPage() {
  const currentProvider = process.env.STORAGE_PROVIDER || 'local';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-orange-600" />
          <span>डेटा स्टोरेज व बॅकअप आर्किटेक्चर (Storage Settings)</span>
        </h1>
        <p className="text-xs text-stone-500 font-devanagari">
          ₹० खर्चाचे स्टोरेज आर्किटेक्चर: लोकल फाईल स्टोरेज आणि गुगल शीट्स / ड्राईव्ह इंटिग्रेशन.
        </p>
      </div>

      {/* ACTIVE PROVIDER STATUS */}
      <Card className="border-emerald-300 bg-emerald-50/40">
        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow flex-shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-stone-900 font-devanagari">
                  सक्रिय स्टोरेज मोड: {currentProvider === 'google' ? 'गुगल शीट्स (Google Sheets)' : 'लोकल फाईल डेटाबेस (Local Storage)'}
                </h3>
                <Badge variant="success">Active</Badge>
              </div>
              <p className="text-xs text-stone-600 font-devanagari">
                सर्व पावती नोंदी, देणगीदार आणि हिशोब शून्य खर्चात सुरक्षितपणे सेव्ह होत आहेत.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GOOGLE SHEETS SETUP DOCUMENTATION & GUIDE */}
      <Card className="border-amber-200 shadow-sm">
        <CardHeader className="bg-amber-50/50">
          <CardTitle className="text-base font-bold text-stone-900 font-devanagari flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Google Sheets & Google Drive मोफत जोडणी मार्गदर्शक</span>
          </CardTitle>
          <CardDescription className="text-xs text-stone-500 font-devanagari">
            मंडळाच्या स्वतंत्र Google खात्याद्वारे मोफत क्लाऊड बॅकअप सुरू करण्यासाठी खालील पायऱ्या पूर्ण करा:
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4 text-xs text-stone-700 font-devanagari leading-relaxed">
          <ol className="list-decimal pl-5 space-y-2.5">
            <li>
              <strong>Google Cloud Console वर नवीन प्रोजेक्ट तयार करा:</strong>
              <p className="text-stone-500 font-sans mt-0.5">
                https://console.cloud.google.com/ वर जाऊन मंडळासाठी "Mandal Pavti Book" नावाचा मोफत प्रोजेक्ट बनवा.
              </p>
            </li>
            <li>
              <strong>Google Sheets API आणि Google Drive API सुरू (Enable) करा:</strong>
              <p className="text-stone-500 font-sans mt-0.5">
                APIs & Services $\rightarrow$ Enable APIs $\rightarrow$ "Google Sheets API" व "Google Drive API" सर्च करून Enable करा.
              </p>
            </li>
            <li>
              <strong>Service Account तयार करा आणि Key डाऊनलोड करा:</strong>
              <p className="text-stone-500 font-sans mt-0.5">
                Credentials $\rightarrow$ Create Credentials $\rightarrow$ Service Account निवडा. तयार झालेल्या ईमेलला कॉपी करा आणि Keys टॅबमधून JSON की डाऊनलोड करा.
              </p>
            </li>
            <li>
              <strong>Google Sheet तयार करा आणि Service Account ईमेलसोबत शेअर करा:</strong>
              <p className="text-stone-500 font-sans mt-0.5">
                मंडळाच्या Drive मध्ये "Mandal_Pavti_Records" नावाची नवी शीट बनवा व Service Account ईमेलला 'Editor' म्हणून Share करा.
              </p>
            </li>
            <li>
              <strong>पर्यावरण व्हेरिएबल्स (.env.local) मध्ये कीज सेट करा:</strong>
              <div className="mt-1 p-3 bg-stone-900 text-stone-100 rounded-lg font-mono text-[11px] space-y-0.5">
                <div>STORAGE_PROVIDER=google</div>
                <div>GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here</div>
                <div>GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com</div>
                <div>GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."</div>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
