'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Wallet,
  FileCheck,
  Eye,
  Share2,
  PlusCircle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAppMode } from '@/lib/context/mode-context';
import { Donor, Payment, Pavti, MandalSettings } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';
import { PavtiCard } from '@/components/pavti/PavtiCard';
import { PavtiShareModal } from '@/components/pavti/PavtiShareModal';

export default function DonorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { mode } = useAppMode();

  const [donor, setDonor] = useState<Donor | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pavtis, setPavtis] = useState<Pavti[]>([]);
  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Share Modal
  const [selectedPavti, setSelectedPavti] = useState<Pavti | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    async function loadDonorData() {
      setIsLoading(true);
      try {
        const [donRes, setRes] = await Promise.all([
          fetch(`/api/donors/${id}?mode=${mode}`),
          fetch('/api/settings'),
        ]);

        const donData = await donRes.json();
        const setData = await setRes.json();

        if (donData.donor) setDonor(donData.donor);
        if (donData.payments) setPayments(donData.payments);
        if (donData.pavtis) setPavtis(donData.pavtis);
        if (setData.settings) setSettings(setData.settings);
      } catch (err) {
        console.error('Failed to load donor:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDonorData();
  }, [id, mode]);

  if (isLoading) {
    return (
      <div className="text-center py-20 font-devanagari text-stone-600">
        माहिती लोड होत आहे...
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-red-500 font-bold font-devanagari">देणगीदार सापडला नाही.</div>
        <Link href="/donors">
          <Button variant="outline">यादीवर परत जा</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/donors')}
            className="p-2 text-stone-500 hover:text-stone-800 rounded-lg hover:bg-stone-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900">
              {donor.name}
            </h1>
            <p className="text-xs text-stone-500 font-mono">
              {donor.mobile || 'मोबाईल नोंद नाही'} • नोंदणी दिनांक: {donor.createdAt.split('T')[0]}
            </p>
          </div>
        </div>

        <Link href="/pavti/new">
          <Button variant="primary" size="sm" className="font-devanagari flex items-center gap-1.5 shadow">
            <PlusCircle className="w-4 h-4" />
            <span>या देणगीदारासाठी पावती फाडा</span>
          </Button>
        </Link>
      </div>

      {/* DONOR SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-bold text-stone-500 font-devanagari uppercase">
              एकूण जमा वर्गणी
            </span>
            <div className="text-2xl font-black text-orange-800 font-mono">
              {formatIndianCurrency(donor.totalContributed)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-bold text-stone-500 font-devanagari uppercase">
              एकूण पावत्या संख्या
            </span>
            <div className="text-2xl font-black text-stone-900 font-mono">
              {donor.pavtiCount} पावत्या
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-bold text-stone-500 font-devanagari uppercase">
              पत्ता / संपर्क
            </span>
            <div className="text-sm font-semibold text-stone-800 font-devanagari truncate">
              {donor.address || 'पत्ता नोंद नाही'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DONOR'S PAVTIS HISTORY */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-devanagari text-stone-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-orange-600" />
          <span>पावत्यांचा इतिहास (Pavti Records)</span>
        </h2>

        {payments.length === 0 ? (
          <Card className="border-dashed border-stone-300">
            <CardContent className="p-8 text-center text-xs text-stone-500 font-devanagari">
              अद्याप कोणतीही पावती नोंदवलेली नाही.
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-stone-700">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase font-devanagari">
                <tr>
                  <th className="px-4 py-3">पावती क्र.</th>
                  <th className="px-4 py-3">दिनांक</th>
                  <th className="px-4 py-3">रक्कम</th>
                  <th className="px-4 py-3">स्थिती</th>
                  <th className="px-4 py-3">प्रकार</th>
                  <th className="px-4 py-3 text-right">कृती</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-orange-800">
                      {p.receiptNumber ? `#${p.receiptNumber}` : '- (बाकी)'}
                    </td>
                    <td className="px-4 py-3 text-stone-600 font-mono">{p.date}</td>
                    <td className="px-4 py-3 font-bold text-stone-900 font-mono text-sm">
                      {formatIndianCurrency(p.receivedAmount || p.expectedAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === 'PAID' ? 'success' : 'warning'}>
                        {p.status === 'PAID' ? 'जमा (Paid)' : 'बाकी (Pending)'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-devanagari">
                      {p.paymentMethod === 'CASH' ? 'रोख' : 'UPI'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'PAID' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/pavti/${p.receiptNumber || p.id}`}
                            className="p-1.5 text-stone-600 hover:text-orange-600 rounded hover:bg-stone-100"
                            title="पावती पहा"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => {
                              const foundPavti = pavtis.find((pav) => pav.paymentId === p.id);
                              if (foundPavti) {
                                setSelectedPavti(foundPavti);
                                setIsShareModalOpen(true);
                              }
                            }}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 rounded hover:bg-emerald-50"
                            title="शेअर करा"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SHARE MODAL IF TRIGGERED */}
      {selectedPavti && settings && (
        <>
          <div className="fixed left-[-9999px] top-[-9999px]">
            <PavtiCard
              id="donor-history-pavti-element"
              pavti={selectedPavti}
              settings={settings}
            />
          </div>
          <PavtiShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            pavti={selectedPavti}
            settings={settings}
            elementId="donor-history-pavti-element"
          />
        </>
      )}
    </div>
  );
}
