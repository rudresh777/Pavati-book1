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
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useAppMode } from '@/lib/context/mode-context';
import { useLanguage } from '@/lib/context/language-context';
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
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const [donor, setDonor] = useState<Donor | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pavtis, setPavtis] = useState<Pavti[]>([]);
  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Delete / Archive Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

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

  const handleDeleteMember = async () => {
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/donors/${id}?mode=${mode}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to delete donor.' : 'देणगीदार हटवण्यात त्रुटी आली.'));

      alert(data.message);
      router.push('/donors');
    } catch (err: any) {
      setDeleteError(err.message || (isEn ? 'Error occurred.' : 'त्रुटी आली.'));
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20 font-devanagari text-stone-600">
        {t('common.loading')}
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-red-500 font-bold font-devanagari">
          {isEn ? 'Donor not found.' : 'देणगीदार सापडला नाही.'}
        </div>
        <Link href="/donors">
          <Button variant="outline">{isEn ? 'Back to Donors List' : 'यादीवर परत जा'}</Button>
        </Link>
      </div>
    );
  }

  const hasHistory = payments.length > 0 || pavtis.length > 0;

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900">
                {donor.name}
              </h1>
              {donor.isArchived && (
                <Badge variant="warning">{isEn ? 'Archived' : 'निष्क्रिय'}</Badge>
              )}
            </div>
            <p className="text-xs text-stone-500 font-mono">
              {donor.mobile || (isEn ? 'No mobile' : 'मोबाईल नोंद नाही')} • {isEn ? 'Registered:' : 'नोंदणी दिनांक:'} {donor.createdAt.split('T')[0]}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pavti/new">
            <Button variant="primary" size="sm" className="font-devanagari flex items-center gap-1.5 shadow">
              <PlusCircle className="w-4 h-4" />
              <span>{isEn ? 'Issue Receipt for Donor' : 'या देणगीदारासाठी पावती तयार करा'}</span>
            </Button>
          </Link>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setIsDeleteModalOpen(true)}
            className="font-devanagari flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isEn ? 'Delete' : 'हटवा'}</span>
          </Button>
        </div>
      </div>

      {/* DONOR SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-bold text-stone-500 font-devanagari uppercase">
              {isEn ? 'Total Contributed' : 'एकूण जमा वर्गणी'}
            </span>
            <div className="text-2xl font-black text-orange-800 font-mono">
              {formatIndianCurrency(donor.totalContributed)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-bold text-stone-500 font-devanagari uppercase">
              {isEn ? 'Total Receipts' : 'एकूण पावत्या संख्या'}
            </span>
            <div className="text-2xl font-black text-stone-900 font-mono">
              {donor.pavtiCount} {isEn ? 'Receipts' : 'पावत्या'}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs font-bold text-stone-500 font-devanagari uppercase">
              {isEn ? 'Address / Contact' : 'पत्ता / संपर्क'}
            </span>
            <div className="text-sm font-semibold text-stone-800 font-devanagari truncate">
              {donor.address || (isEn ? 'No address registered' : 'पत्ता नोंद नाही')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DONOR'S PAVTIS HISTORY */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold font-devanagari text-stone-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-orange-600" />
          <span>{isEn ? 'Receipt History' : 'पावत्यांचा इतिहास'}</span>
        </h2>

        {pavtis.length === 0 ? (
          <Card className="border-stone-200">
            <CardContent className="p-8 text-center text-stone-400 font-devanagari">
              {isEn ? 'No receipts generated yet for this donor.' : 'या देणगीदारासाठी अद्याप कोणतीही पावती तयार केलेली नाही.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pavtis.map((pavti) => (
              <Card
                key={pavti.id}
                className="border-stone-200 hover:border-amber-300 transition-colors shadow-sm"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-orange-800">
                        {pavti.receiptNumber ? `#${pavti.receiptNumber}` : (isEn ? 'DUE' : 'बाकी')}
                      </span>
                      <span className="text-xs text-stone-400 font-mono">
                        📅 {pavti.date}
                      </span>
                      <Badge variant={pavti.paymentMethod === 'UPI' ? 'info' : 'gold'}>
                        {pavti.paymentMethod === 'UPI' ? 'UPI' : (isEn ? 'Cash' : 'रोख')}
                      </Badge>
                      {pavti.status === 'DUE' && (
                        <Badge variant="warning">{isEn ? 'DUE' : 'बाकी'}</Badge>
                      )}
                    </div>
                    <div className="text-xs text-stone-600 font-devanagari">
                      {isEn ? 'Host:' : 'प्रतिनिधी:'} {pavti.hostName}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-lg font-black text-stone-900 font-mono">
                        {formatIndianCurrency(pavti.amount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {pavti.receiptNumber && (
                        <Link href={`/pavti/${pavti.receiptNumber}`}>
                          <Button variant="outline" size="sm" className="p-2">
                            <Eye className="w-4 h-4 text-stone-600" />
                          </Button>
                        </Link>
                      )}
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => {
                          setSelectedPavti(pavti);
                          setIsShareModalOpen(true);
                        }}
                        className="flex items-center gap-1 font-devanagari"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Share' : 'शेअर'}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DELETE / ARCHIVE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-red-600 font-devanagari">
            <AlertTriangle className="w-5 h-5" />
            <span>{isEn ? 'Confirm Delete Donor' : 'देणगीदार हटवण्याची पुष्टी करा'}</span>
          </div>
        }
        description={isEn ? 'Are you sure you want to delete this donor member?' : 'तुम्हाला खरोखर हा देणगीदार सदस्य हटवायचा आहे का?'}
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          {deleteError && (
            <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs font-bold font-devanagari">
              {deleteError}
            </div>
          )}

          <div className="p-3.5 bg-stone-100 rounded-xl text-xs text-stone-800 font-devanagari space-y-1.5 border border-stone-200">
            <div><strong>{isEn ? 'Name:' : 'नाव:'}</strong> {donor.name}</div>
            <div><strong>{isEn ? 'Mobile:' : 'मोबाईल:'}</strong> {donor.mobile || '-'}</div>
            <div><strong>{isEn ? 'Total Contributed:' : 'एकूण जमा:'}</strong> {formatIndianCurrency(donor.totalContributed)} ({donor.pavtiCount} {isEn ? 'receipts' : 'पावत्या'})</div>
          </div>

          {hasHistory ? (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 font-devanagari space-y-1">
              <div className="font-bold">{isEn ? '🛡️ Financial Ledger Protection:' : '🛡️ आर्थिक इतिहास संरक्षण:'}</div>
              <div className="text-[11px] text-amber-800">
                {isEn
                  ? 'Because this donor has active financial records, this donor will be archived to preserve ledger balance.'
                  : 'या देणगीदाराच्या नावावर आर्थिक पावत्या असल्याने जमा हिशोबाचा ताळेबंद सुरक्षित ठेवण्यासाठी हे रेकॉर्ड निष्क्रिय केले जाईल.'}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-600 font-devanagari">
              {isEn ? 'No financial history. This donor record will be permanently deleted.' : 'या देणगीदाराचा कोणताही आर्थिक इतिहास नाही. हे रेकॉर्ड कायमस्वरूपी हटवले जाईल.'}
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteMember}
              className="font-devanagari font-bold"
            >
              {hasHistory ? (isEn ? 'Archive Donor' : 'होय, निष्क्रिय करा') : (isEn ? 'Delete Permanently' : 'होय, कायमचे हटवा')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* SHARE / PREVIEW MODAL */}
      {selectedPavti && settings && (
        <>
          <div className="fixed left-[-9999px] top-[-9999px]">
            <PavtiCard
              id="donor-pavti-preview-element"
              pavti={selectedPavti}
              settings={settings}
            />
          </div>
          <PavtiShareModal
            isOpen={isShareModalOpen}
            onClose={() => {
              setIsShareModalOpen(false);
              setSelectedPavti(null);
            }}
            pavti={selectedPavti}
            settings={settings}
            elementId="donor-pavti-preview-element"
          />
        </>
      )}
    </div>
  );
}
