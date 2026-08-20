import React from 'react';
import { getStorageProvider } from '@/lib/storage';
import { HomeContent } from '@/components/home/HomeContent';

export const revalidate = 0;

export default async function HomePage() {
  const storage = getStorageProvider();
  await storage.init();

  const settings = await storage.getSettings();
  const announcements = await storage.getAnnouncements(true);
  const publishedAnnouncements = announcements.filter(
    (a) => (a as any).status === 'PUBLISHED' || ((a as any).status === undefined && a.active)
  );
  const latestAnnouncement = publishedAnnouncements[0] || null;

  return (
    <HomeContent
      settings={settings}
      latestAnnouncement={latestAnnouncement}
    />
  );
}

