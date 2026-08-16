'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Wallet,
  Clock,
  CheckCircle,
  PlusCircle,
  Users,
  CreditCard,
  ArrowRight,
  Share2,
  Eye,
  Sparkles,
  Calendar,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppMode } from '@/lib/context/mode-context';
import { CollectionSummary, Payment, Pavti, MandalSettings } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';
import { PavtiShareModal } from '@/components/pavti/PavtiShareModal';
import { PavtiCard } from '@/components/pavti/PavtiCard';

export default function DashboardPage() {
  const { mode, user } = useAppMode();

  const [summary, setSummary] = useState<CollectionSummary | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pavti Share Modal state
  const [selectedPavti, setSelectedPavti] = useState<Pavti | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, setRes] = await Promise.all([
        fetch(`/api/dashboard/summary?mode=${mode}`),
        fetch(`/api/settings`),
      ]);

      const sumData = await sumRes.json();
      const setData = await setRes.json();

      if (sumData.summary) {
        setSummary(sumData.summary);
        setRecentPayments(sumData.recentPayments || []);
        setPendingPayments(sumData.pendingPayments || []);
      }
      if (setData.settings) {
        setSettings(setData.settings);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [mode]);

  const handleSharePayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/pavtis?mode=${mode}`);
      const data = await res.json();
      const pavti = (data.pavtis || []).find((p: Pavti) => p.paymentId === paymentId);
      if (pavti) {
        setSelectedPavti(pavti);
        setIsShareModalOpen(true);
      } else {
        alert('पावती रेकॉर्ड सापडला नाही.');
      }
    } catch (err) {
      console.error('Error fetching pavti:', err);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* WELCOME BANNER & RAPID ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50 p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-600 text-white font-devanagari tracking-wide">
              ॥ {settings?.sloganMarathi || 'गणपती बाप्पा मोरया'} ॥
            </span>
            <span className="text-xs text-stone-500 font-semibold">
              सन {settings?.year || '२०२६'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900">
            स्वागत आहे, {user?.name || 'प्रतिनिधी'}!
          </h1>
          <p className="text-xs text-stone-600 font-devanagari">
            {settings?.mandalNameMarathi} — डिजिटल देणगी व पावती संकलन केंद्र
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/pavti/new">
            <Button
              variant="primary"
              size="md"
              className="flex items-center gap-1.5 shadow-md py-2.5 px-4 font-devanagari"
            >
              <PlusCircle className="w-4 h-4" />
              <span>नवीन पावती फाडा</span>
            </Button>
          </Link>

          <Link href="/pavti/new?pending=true">
            <Button
              variant="outline"
              size="md"
              className="flex items-center gap-1.5 py-2.5 px-4 font-devanagari border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950"
            >
              <Clock className="w-4 h-4 text-amber-700" />
              <span>बाकी नोंद करा</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* PRIMARY FINANCIAL KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collection */}
        <Card className="border-l-4 border-l-orange-600 border-stone-200">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
              <span>एकूण जमा रक्कम (Total Collection)</span>
              <Wallet className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight">
              {isLoading ? '...' : formatIndianCurrency(summary?.totalCollection || 0)}
            </div>
            <div className="text-xs text-stone-500 font-devanagari flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                <strong>{summary?.paidPavtisCount || 0}</strong> अधिकृत पावत्या तयार झाल्या
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Today's Collection */}
        <Card className="border-l-4 border-l-emerald-600 border-stone-200">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
              <span>आजची जमा (Today's Collection)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
              {isLoading ? '...' : formatIndianCurrency(summary?.todayCollection || 0)}
            </div>
            <div className="text-xs text-stone-500 font-devanagari">
              कालची जमा: {formatIndianCurrency(summary?.yesterdayCollection || 0)}
            </div>
          </CardContent>
        </Card>

        {/* Cash vs UPI Breakdown */}
        <Card className="border-l-4 border-l-blue-600 border-stone-200">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
              <span>रोख व UPI वर्गणी (Payment Modes)</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs text-stone-500 font-devanagari">रोख (Cash):</div>
                <div className="text-base font-bold text-stone-800 font-mono">
                  {formatIndianCurrency(summary?.cashCollection || 0)}
                </div>
              </div>
              <div className="text-right border-l border-stone-200 pl-4">
                <div className="text-xs text-stone-500 font-devanagari">UPI / Online:</div>
                <div className="text-base font-bold text-blue-700 font-mono">
                  {formatIndianCurrency(summary?.upiCollection || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Amount & Count */}
        <Card className="border-l-4 border-l-amber-500 border-stone-200">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
              <span>येणे बाकी (Pending Payments)</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono tracking-tight">
              {isLoading ? '...' : formatIndianCurrency(summary?.pendingAmount || 0)}
            </div>
            <div className="text-xs text-amber-800 font-semibold font-devanagari flex items-center justify-between">
              <span>{summary?.pendingDonorsCount || 0} देणगीदार बाकी</span>
              <Link href="/pending" className="text-orange-600 hover:underline flex items-center">
                <span>पहा</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TWO COLUMN SECTION: RECENT PAVTIS & PENDING DONORS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT COLLECTIONS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-devanagari text-stone-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>अलीकडील जमा पावत्या (Recent Pavtis)</span>
            </h2>
            <Link
              href="/payments"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 font-devanagari flex items-center gap-1"
            >
              <span>सर्व नोंदी पहा</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPayments.filter((p) => p.status === 'PAID').length === 0 ? (
            <Card className="border-dashed border-stone-300">
              <CardContent className="p-8 text-center space-y-2">
                <PlusCircle className="w-10 h-10 text-stone-300 mx-auto" />
                <h4 className="text-sm font-bold text-stone-700 font-devanagari">
                  अद्याप कोणतीही पावती तयार केलेली नाही
                </h4>
                <p className="text-xs text-stone-500 font-devanagari">
                  पहिल्या देणगीदारासाठी "नवीन पावती फाडा" बटनावर क्लिक करा.
                </p>
                <div className="pt-2">
                  <Link href="/pavti/new">
                    <Button variant="primary" size="sm" className="font-devanagari">
                      नवीन पावती तयार करा
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase font-devanagari">
                    <tr>
                      <th className="px-4 py-3">पावती क्र.</th>
                      <th className="px-4 py-3">देणगीदार</th>
                      <th className="px-4 py-3">रक्कम</th>
                      <th className="px-4 py-3">प्रकार</th>
                      <th className="px-4 py-3">दिनांक</th>
                      <th className="px-4 py-3 text-right">कृती</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {recentPayments
                      .filter((p) => p.status === 'PAID')
                      .map((payment) => (
                        <tr key={payment.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-orange-800">
                            #{payment.receiptNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-stone-900 font-devanagari">
                              {payment.donorName}
                            </div>
                            {payment.donorMobile && (
                              <div className="text-[11px] text-stone-500 font-mono">
                                {payment.donorMobile}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-bold text-stone-900 font-mono text-sm">
                            {formatIndianCurrency(payment.receivedAmount)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={payment.paymentMethod === 'UPI' ? 'info' : 'gold'}>
                              {payment.paymentMethod === 'CASH' ? 'रोख' : 'UPI'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-stone-500">{payment.date}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                href={`/pavti/${payment.receiptNumber || payment.id}`}
                                className="p-1.5 text-stone-600 hover:text-orange-600 rounded hover:bg-stone-100"
                                title="पावती पहा"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleSharePayment(payment.id)}
                                className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded hover:bg-emerald-50"
                                title="शेअर करा"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ACTIVE PENDING DONORS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-devanagari text-stone-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>येणे बाकी यादी (Pending)</span>
            </h2>
            <Link
              href="/pending"
              className="text-xs font-bold text-amber-800 hover:underline font-devanagari flex items-center gap-1"
            >
              <span>सर्व पहा ({pendingPayments.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingPayments.length === 0 ? (
            <Card className="border-dashed border-stone-300">
              <CardContent className="p-6 text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-stone-700 font-devanagari">
                  कोणतीही बाकी रक्कम प्रलंबित नाही
                </h4>
                <p className="text-[11px] text-stone-500 font-devanagari">
                  सर्व देणग्या जमा झालेल्या आहेत.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {pendingPayments.map((p) => (
                <Card
                  key={p.id}
                  className="border-amber-200 hover:border-amber-300 transition-colors"
                >
                  <CardContent className="p-4 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs sm:text-sm text-stone-900 font-devanagari">
                        {p.donorName}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono">
                        {p.donorMobile || 'मोबाईल नाही'} • {p.date}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="font-bold text-amber-900 font-mono text-sm">
                        {formatIndianCurrency(p.expectedAmount - p.receivedAmount)}
                      </div>
                      <Link href={`/pending`}>
                        <span className="text-[11px] font-bold text-orange-600 hover:underline font-devanagari">
                          जमा करा →
                        </span>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RENDER HIDDEN PAVTI CARD FOR PNG GENERATION IF SHARE MODAL IS TRIGGERED */}
      {selectedPavti && settings && (
        <>
          <div className="fixed left-[-9999px] top-[-9999px]">
            <PavtiCard
              id="dashboard-hidden-pavti"
              pavti={selectedPavti}
              settings={settings}
            />
          </div>
          <PavtiShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            pavti={selectedPavti}
            settings={settings}
            elementId="dashboard-hidden-pavti"
          />
        </>
      )}
    </div>
  );
}
