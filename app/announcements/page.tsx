import React from 'react';
import { getStorageProvider } from '@/lib/storage';
import { PublicAnnouncementsList } from '@/components/announcements/PublicAnnouncementsList';

export const revalidate = 0;

export default async function AnnouncementsPage() {
  const storage = getStorageProvider();
  await storage.init();

  const settings = await storage.getSettings();
  const allAnnouncements = await storage.getAnnouncements(true);
  const announcements = allAnnouncements.filter(
    (a) => a.status === 'PUBLISHED' || (a.status === undefined && a.active)
  );

  return (
    <PublicAnnouncementsList
      announcements={announcements}
      settings={settings}
    />
  );
}

