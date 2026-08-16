'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Plus, Trash2, Edit2, Calendar, MapPin, CheckCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Announcement } from '@/types';

export default function ManageAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleMarathi, setTitleMarathi] = useState('');
  const [titleEnglish, setTitleEnglish] = useState('');
  const [contentMarathi, setContentMarathi] = useState('');
  const [contentEnglish, setContentEnglish] = useState('');
  const [venue, setVenue] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/announcements');
      const data = await res.json();
      if (data.announcements) setAnnouncements(data.announcements);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setTitleMarathi('');
    setTitleEnglish('');
    setContentMarathi('');
    setContentEnglish('');
    setVenue('');
    setPriority('NORMAL');
    setActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Announcement) => {
    setEditingId(item.id);
    setTitleMarathi(item.titleMarathi);
    setTitleEnglish(item.titleEnglish || '');
    setContentMarathi(item.contentMarathi);
    setContentEnglish(item.contentEnglish || '');
    setVenue(item.venue || '');
    setPriority(item.priority);
    setActive(item.active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleMarathi.trim() || !contentMarathi.trim()) {
      setFormError('शीर्षक आणि मजकूर आवश्यक आहे.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId || undefined,
          titleMarathi: titleMarathi.trim(),
          titleEnglish: titleEnglish.trim(),
          contentMarathi: contentMarathi.trim(),
          contentEnglish: contentEnglish.trim(),
          venue: venue.trim(),
          priority,
          active,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'सूचना सेव्ह करण्यात अडचण आली.');

      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      setFormError(err.message || 'त्रुटी आली.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('तुम्हाला ही सूचना हटवायची आहे का?')) return;
    try {
      await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' });
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-600" />
            <span>मंडळ सूचना व्यवस्थापन (Announcements CMS)</span>
          </h1>
          <p className="text-xs text-stone-500 font-devanagari">
            वेबसाईटवरील सूचना फलकावर प्रसिद्ध करण्यासाठी नवीन सूचना तयार करा किंवा संपादित करा.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleOpenCreateModal}
          className="font-devanagari flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>+ नवीन सूचना जोडा</span>
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-3">
        {announcements.map((item) => (
          <Card key={item.id} className="border-stone-200">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={item.priority === 'HIGH' ? 'danger' : 'gold'}>
                    {item.priority}
                  </Badge>
                  <Badge variant={item.active ? 'success' : 'default'}>
                    {item.active ? 'प्रसिद्ध (Active)' : 'अप्रकाशित (Draft)'}
                  </Badge>
                  <span className="text-xs text-stone-400 font-mono">{item.date}</span>
                </div>

                <h3 className="text-base font-bold text-stone-900 font-devanagari">
                  {item.titleMarathi}
                </h3>

                <p className="text-xs text-stone-600 font-devanagari line-clamp-2">
                  {item.contentMarathi}
                </p>

                {item.venue && (
                  <div className="text-[11px] text-stone-500 font-devanagari">
                    📍 {item.venue}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => handleOpenEditModal(item)}
                  className="p-2 text-stone-600 hover:text-orange-600 rounded-lg hover:bg-stone-100"
                  title="संपादित करा"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="हटवा"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'सूचना संपादित करा' : 'नवीन सूचना तयार करा'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-bold">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              सूचनेचे शीर्षक (मराठी) *
            </label>
            <input
              type="text"
              required
              value={titleMarathi}
              onChange={(e) => setTitleMarathi(e.target.value)}
              placeholder="उदा. गणेश आगमन मिरवणूक व आरती वेळ"
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-devanagari font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              सूचनेचा संपूर्ण मजकूर (मराठी) *
            </label>
            <textarea
              required
              rows={4}
              value={contentMarathi}
              onChange={(e) => setContentMarathi(e.target.value)}
              placeholder="सर्व भाविक भक्तांनी..."
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                स्थान / पत्ता (ऐच्छिक)
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="मंडळ मंडप, लक्ष्मी रोड"
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                प्राधान्य (Priority)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
              >
                <option value="NORMAL">सामान्य (Normal)</option>
                <option value="HIGH">महत्त्वाची (High)</option>
                <option value="URGENT">तातडीची (Urgent)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 font-devanagari cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded text-orange-600"
              />
              <span>वेबसाईटवर लगेच प्रसिद्ध करा (Publish Immediately)</span>
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              रद्द करा
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} className="font-devanagari">
              सेव्ह करा
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
