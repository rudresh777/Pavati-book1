'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Search, Phone, Eye, PlusCircle, ArrowRight, Wallet, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppMode } from '@/lib/context/mode-context';
import { Donor, MandalSettings } from '@/types';
import { formatIndianCurrency } from '@/lib/utils/number-to-words';

export default function DonorsPage() {
  const { mode } = useAppMode();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [settings, setSettings] = useState<MandalSettings | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDonors = async () => {
    setIsLoading(true);
    try {
      const [donRes, setRes] = await Promise.all([
        fetch(`/api/donors?mode=${mode}`),
        fetch('/api/settings'),
      ]);
      const donData = await donRes.json();
      const setData = await setRes.json();

      if (donData.donors) setDonors(donData.donors);
      if (setData.settings) setSettings(setData.settings);
    } catch (err) {
      console.error('Failed to fetch donors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [mode]);

  const filteredDonors = donors.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.mobile.includes(q) ||
      (d.address && d.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            <span>देणगीदार यादी (Donors Directory)</span>
          </h1>
          <p className="text-xs text-stone-500 font-devanagari">
            मंडळातील सर्व देणगीदारांची नावे, मोबाईल आणि एकूण जमा वर्गणीचा इतिहास.
          </p>
        </div>

        <Link href="/pavti/new">
          <Button variant="primary" size="sm" className="font-devanagari flex items-center gap-1.5 shadow">
            <PlusCircle className="w-4 h-4" />
            <span>नवीन पावती फाडा</span>
          </Button>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="देणगीदाराचे नाव, मोबाईल किंवा पत्ता शोधा..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-devanagari"
        />
      </div>

      {/* Donors List */}
      {filteredDonors.length === 0 ? (
        <Card className="border-dashed border-stone-300">
          <CardContent className="p-12 text-center space-y-2">
            <Users className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-base font-bold text-stone-800 font-devanagari">
              {searchQuery ? 'कोणताही देणगीदार आढळला नाही' : 'अद्याप कोणतेही देणगीदार नोंदवलेले नाहीत'}
            </h3>
            <p className="text-xs text-stone-500 font-devanagari">
              पहिल्या पावतीनंतर देणगीदाराचे रेकॉर्ड आपोआप येथे तयार होईल.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDonors.map((d) => (
            <Card key={d.id} className="hover:border-orange-300 transition-all shadow-sm">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-2.5">
                  <div>
                    <h3 className="font-bold text-base text-stone-900 font-devanagari">
                      {d.name}
                    </h3>
                    {d.mobile && (
                      <div className="text-xs text-stone-500 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        <span>{d.mobile}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-stone-400 block font-devanagari">
                      एकूण देणगी
                    </span>
                    <span className="font-bold text-orange-800 font-mono text-base">
                      {formatIndianCurrency(d.totalContributed)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500 font-devanagari">
                  <span className="flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>{d.pavtiCount} पावत्या</span>
                  </span>
                  {d.lastPaymentDate && (
                    <span>शेवटची पावती: {d.lastPaymentDate}</span>
                  )}
                </div>

                {d.address && (
                  <div className="text-[11px] text-stone-500 truncate font-devanagari">
                    📍 {d.address}
                  </div>
                )}

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <Link
                    href={`/donors/${d.id}`}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 font-devanagari flex items-center gap-1"
                  >
                    <span>इतिहास पहा</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href={`/pavti/new`}
                    className="text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200"
                  >
                    + पावती फाडा
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
