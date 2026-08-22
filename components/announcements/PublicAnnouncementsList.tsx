'use client';

import React from 'react';
import { Bell, Calendar, MapPin, Clock } from 'lucide-react';
import { Announcement, MandalSettings } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface PublicAnnouncementsListProps {
  announcements: Announcement[];
  settings: MandalSettings | null;
}

export function PublicAnnouncementsList({
  announcements,
  settings,
}: PublicAnnouncementsListProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header (Strictly Marathi Header) */}
      <div className="border-b border-stone-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-orange-100 text-orange-700 rounded-xl shadow-sm">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-devanagari text-stone-900">
              मंडळ अधिकृत सूचना फलक
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-devanagari">
              {settings?.mandalNameMarathi || 'मोरया गणेशोत्सव मंडळ'} (
              {settings?.addressMarathi || 'तापडिया नगर अकोला 444001'})
            </p>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <Bell className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-700 font-devanagari">
            सध्या कोणतीही नवीन सूचना उपलब्ध नाही
          </h3>
          <p className="text-xs text-stone-500 mt-1 font-devanagari">
            नवीन सूचना प्रसिद्ध झाल्यावर येथे दिसतील.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => {
            const isHighPriority =
              item.priority === 'HIGH' || item.priority === 'URGENT';
            const title = item.titleMarathi || item.titleOriginal || item.titleEnglish;
            const content = item.contentMarathi || item.contentOriginal || item.contentEnglish;

            return (
              <Card
                key={item.id}
                className="border-amber-200 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div className="flex items-center gap-2">
                      {isHighPriority ? (
                        <Badge variant="danger">
                          महत्त्वाची सूचना
                        </Badge>
                      ) : (
                        <Badge variant="gold">
                          सूचना
                        </Badge>
                      )}
                      <span className="text-xs text-stone-500 flex items-center gap-1 font-medium font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.date}
                      </span>
                      {item.time && (
                        <span className="text-xs text-stone-500 flex items-center gap-1 font-medium font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          {item.time}
                        </span>
                      )}
                    </div>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-stone-900 font-devanagari">
                    {title}
                  </h2>

                  <p className="text-sm text-stone-700 font-devanagari leading-relaxed whitespace-pre-wrap">
                    {content}
                  </p>

                  {item.venue && (
                    <div className="pt-2 text-xs font-semibold text-amber-900 flex items-center gap-1.5 bg-amber-50 p-2.5 rounded-lg border border-amber-200/80 font-devanagari">
                      <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <span>स्थान / पत्ता: {item.venue}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
