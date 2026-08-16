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
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';
import { Payment, Pavti, MandalSettings } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';
import { PavtiShareModal } from '@/components/pavti/PavtiShareModal';
import { PavtiCard } from '@/components/pavti/PavtiCard';

export default function DashboardPage() {
  const { mode, user } = useAppMode();
  const { t } = useLanguage();

  const [summary, setSummary] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string>('HOST');
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
      const [sumRes, setRes, meRes] = await Promise.all([
        fetch(`/api/dashboard/summary?mode=${mode}`),
        fetch(`/api/settings`),
        fetch('/api/auth/me'),
      ]);

      const sumData = await sumRes.json();
      const setData = await setRes.json();
      const meData = await meRes.json();

      if (meData.user?.role) {
        setUserRole(meData.user.role);
      } else if (sumData.role) {
        setUserRole(sumData.role);
      }

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
        alert(t('common.error'));
      }
    } catch (err) {
      console.error('Error fetching pavti:', err);
    }
  };

  const isSuperAdmin = userRole === 'SUPER_ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-8 pb-10">
      {/* WELCOME BANNER & RAPID ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-amber-50 to-orange-50 p-5 sm:p-6 rounded-2xl border border-amber-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-600 text-white font-devanagari tracking-wide">
              ॥ {settings?.sloganMarathi || '॥ गणपती बाप्पा मोरया ॥'} ॥
            </span>
            <span className="text-xs text-stone-500 font-semibold">
              सन {settings?.year || '२०२६'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900">
            {t('dashboard.welcome')}, {user?.name || (isSuperAdmin ? 'सुपर ॲडमिन' : 'मंडळ प्रतिनिधी')}!
          </h1>
          <p className="text-xs text-stone-600 font-devanagari">
            {settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ'} — {t('dashboard.centerTag')}
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
              <span>{t('dashboard.newPavtiBtn')}</span>
            </Button>
          </Link>

          <Link href="/pavti/new?pending=true">
            <Button
              variant="outline"
              size="md"
              className="flex items-center gap-1.5 py-2.5 px-4 font-devanagari border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950"
            >
              <Clock className="w-4 h-4 text-amber-700" />
              <span>{t('dashboard.recordPendingBtn')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI METRICS (ROLE-BASED CONDITIONAL RENDERING) */}
      {isSuperAdmin ? (
        /* SUPER ADMIN VIEW: Show Total Collection, Cash, UPI, and Pending metrics */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Collection */}
          <Card className="border-l-4 border-l-orange-600 border-stone-200 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
                <span>{t('dashboard.totalCollection')}</span>
                <Wallet className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-stone-900 font-mono tracking-tight">
                {isLoading ? '...' : formatIndianCurrency(summary?.totalCollection || 0)}
              </div>
              <div className="text-xs text-stone-500 font-devanagari flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  <strong>{summary?.paidPavtisCount || 0}</strong> {t('dashboard.officialPavtisCount')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Today's Collection */}
          <Card className="border-l-4 border-l-emerald-600 border-stone-200 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
                <span>{t('dashboard.todayCollection')}</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-tight">
                {isLoading ? '...' : formatIndianCurrency(summary?.todayCollection || 0)}
              </div>
              <div className="text-xs text-stone-500 font-devanagari">
                {t('dashboard.yesterdayCollection')}: {formatIndianCurrency(summary?.yesterdayCollection || 0)}
              </div>
            </CardContent>
          </Card>

          {/* Cash vs UPI Breakdown */}
          <Card className="border-l-4 border-l-blue-600 border-stone-200 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
                <span>{t('dashboard.paymentModes')}</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-xs text-stone-500 font-devanagari">{t('dashboard.cash')}:</div>
                  <div className="text-base font-bold text-stone-800 font-mono">
                    {formatIndianCurrency(summary?.cashCollection || 0)}
                  </div>
                </div>
                <div className="text-right border-l border-stone-200 pl-4">
                  <div className="text-xs text-stone-500 font-devanagari">{t('dashboard.upi')}:</div>
                  <div className="text-base font-bold text-blue-700 font-mono">
                    {formatIndianCurrency(summary?.upiCollection || 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Amount & Count */}
          <Card className="border-l-4 border-l-amber-500 border-stone-200 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
                <span>{t('dashboard.pendingAmount')}</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono tracking-tight">
                {isLoading ? '...' : formatIndianCurrency(summary?.pendingAmount || 0)}
              </div>
              <div className="text-xs text-amber-800 font-semibold font-devanagari flex items-center justify-between">
                <span>{summary?.pendingDonorsCount || 0} {t('dashboard.pendingDonors')}</span>
                <Link href="/pending" className="text-orange-600 hover:underline flex items-center">
                  <span>{t('dashboard.view')}</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* HOST VIEW: Strictly NO Total Collection, Cash or UPI totals */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Operational Pending Amount */}
          <Card className="border-l-4 border-l-amber-500 border-stone-200 shadow-sm">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
                <span>{t('dashboard.pendingAmount')}</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono tracking-tight">
                {isLoading ? '...' : formatIndianCurrency(summary?.pendingAmount || 0)}
              </div>
              <div className="text-xs text-amber-800 font-semibold font-devanagari flex items-center justify-between">
                <span>{summary?.pendingDonorsCount || 0} {t('dashboard.pendingDonors')}</span>
                <Link href="/pending" className="text-orange-600 hover:underline flex items-center">
                  <span>{t('dashboard.view')}</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Action: New Pavti */}
          <Card className="border-l-4 border-l-orange-600 border-stone-200 shadow-sm hover:border-orange-300 transition-colors">
            <CardContent className="p-5 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
                  <span>{t('nav.newPavti')}</span>
                  <PlusCircle className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-sm font-semibold text-stone-700 pt-1 font-devanagari">
                  {t('pavti.newSubtitlePaid')}
                </div>
              </div>
              <Link href="/pavti/new" className="pt-2">
                <Button variant="primary" size="sm" className="w-full font-devanagari">
                  {t('dashboard.newPavtiBtn')} →
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Quick Action: Donors Directory */}
          <Card className="border-l-4 border-l-emerald-600 border-stone-200 shadow-sm hover:border-emerald-300 transition-colors">
            <CardContent className="p-5 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase font-devanagari">
                  <span>{t('nav.donors')}</span>
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-sm font-semibold text-stone-700 pt-1 font-devanagari">
                  {t('donors.subtitle')}
                </div>
              </div>
              <Link href="/donors" className="pt-2">
                <Button variant="outline" size="sm" className="w-full font-devanagari">
                  {t('donors.title')} →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TWO COLUMN SECTION: RECENT PAVTIS & PENDING DONORS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT COLLECTIONS */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-devanagari text-stone-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span>{t('dashboard.recentPavtis')}</span>
            </h2>
            <Link
              href="/payments"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 font-devanagari flex items-center gap-1"
            >
              <span>{t('dashboard.viewAll')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentPayments.filter((p) => p.status === 'PAID').length === 0 ? (
            <Card className="border-dashed border-stone-300">
              <CardContent className="p-8 text-center space-y-2">
                <PlusCircle className="w-10 h-10 text-stone-300 mx-auto" />
                <h4 className="text-sm font-bold text-stone-700 font-devanagari">
                  {t('dashboard.noPavtiYet')}
                </h4>
                <p className="text-xs text-stone-500 font-devanagari">
                  {t('dashboard.noPavtiYetDesc')}
                </p>
                <div className="pt-2">
                  <Link href="/pavti/new">
                    <Button variant="primary" size="sm" className="font-devanagari">
                      {t('dashboard.createPavtiBtn')}
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
                      <th className="px-4 py-3">{t('dashboard.table.pavtiNo')}</th>
                      <th className="px-4 py-3">{t('dashboard.table.donor')}</th>
                      <th className="px-4 py-3">{t('dashboard.table.amount')}</th>
                      <th className="px-4 py-3">{t('dashboard.table.method')}</th>
                      <th className="px-4 py-3">{t('dashboard.table.date')}</th>
                      <th className="px-4 py-3 text-right">{t('dashboard.table.actions')}</th>
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
                              {payment.paymentMethod === 'CASH' ? t('dashboard.cash') : 'UPI'}
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
              <span>{t('dashboard.pendingList')}</span>
            </h2>
            <Link
              href="/pending"
              className="text-xs font-bold text-amber-800 hover:underline font-devanagari flex items-center gap-1"
            >
              <span>{t('dashboard.viewAllPending')} ({pendingPayments.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pendingPayments.length === 0 ? (
            <Card className="border-dashed border-stone-300">
              <CardContent className="p-6 text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-stone-700 font-devanagari">
                  {t('dashboard.noPendingYet')}
                </h4>
                <p className="text-[11px] text-stone-500 font-devanagari">
                  {t('dashboard.noPendingYetDesc')}
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
                        {p.donorMobile || '-'} • {p.date}
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="font-bold text-amber-900 font-mono text-sm">
                        {formatIndianCurrency(p.expectedAmount - (p.receivedAmount || 0))}
                      </div>
                      <Link href={`/pending`}>
                        <span className="text-[11px] font-bold text-orange-600 hover:underline font-devanagari">
                          {t('dashboard.collectNow')}
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
