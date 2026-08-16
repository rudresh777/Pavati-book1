'use client';

import React, { useEffect, useState } from 'react';
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Eye,
  Archive,
  EyeOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Announcement } from '@/types';
import { useLanguage } from '@/lib/context/language-context';

export default function ManageAnnouncementsPage() {
  const { language } = useLanguage();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<Announcement | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [titleMarathi, setTitleMarathi] = useState('');
  const [titleEnglish, setTitleEnglish] = useState('');
  const [contentMarathi, setContentMarathi] = useState('');
  const [contentEnglish, setContentEnglish] = useState('');
  const [venue, setVenue] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED'>('PUBLISHED');
  const [priority, setPriority] = useState<'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
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
    setTime('');
    setDate(new Date().toISOString().split('T')[0]);
    setStatus('PUBLISHED');
    setPriority('NORMAL');
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
    setTime(item.time || '');
    setDate(item.date || new Date().toISOString().split('T')[0]);
    setStatus(item.status || (item.active ? 'PUBLISHED' : 'DRAFT'));
    setPriority(item.priority || 'NORMAL');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleQuickStatusChange = async (
    id: string,
    newStatus: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED'
  ) => {
    const item = announcements.find((a) => a.id === id);
    if (!item) return;

    try {
      await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          status: newStatus,
        }),
      });
      fetchAnnouncements();
    } catch (err) {
      console.error('Error changing status:', err);
    }
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
          time: time.trim(),
          date: date || new Date().toISOString().split('T')[0],
          status,
          priority,
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
    if (!confirm('तुम्हाला ही सूचना कायमस्वरूपी हटवायची आहे का?')) return;
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
            वेबसाईटवरील सूचना फलकावर प्रसिद्ध करण्यासाठी नवीन सूचना तयार करा, संपादित करा, प्रसिद्ध (Publish) किंवा अप्रकाशित करा.
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
        {announcements.length === 0 ? (
          <Card className="border-dashed border-stone-300">
            <CardContent className="p-12 text-center text-stone-400 font-devanagari space-y-2">
              <Bell className="w-10 h-10 mx-auto opacity-50" />
              <div className="font-bold text-stone-700">कोणतीही सूचना उपलब्ध नाही.</div>
            </CardContent>
          </Card>
        ) : (
          announcements.map((item) => {
            const itemStatus = item.status || (item.active ? 'PUBLISHED' : 'DRAFT');
            return (
              <Card key={item.id} className="border-stone-200 hover:border-amber-300 transition-colors shadow-sm">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={
                          itemStatus === 'PUBLISHED'
                            ? 'success'
                            : itemStatus === 'DRAFT'
                            ? 'default'
                            : itemStatus === 'UNPUBLISHED'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {itemStatus === 'PUBLISHED'
                          ? 'प्रसिद्ध (PUBLISHED)'
                          : itemStatus === 'DRAFT'
                          ? 'मसुदा (DRAFT)'
                          : itemStatus === 'UNPUBLISHED'
                          ? 'अप्रकाशित (UNPUBLISHED)'
                          : 'संग्रहित (ARCHIVED)'}
                      </Badge>

                      <Badge variant={item.priority === 'HIGH' ? 'danger' : 'gold'}>
                        {item.priority === 'HIGH' ? 'महत्त्वाची' : item.priority === 'URGENT' ? 'तातडीची' : 'सामान्य'}
                      </Badge>

                      <span className="text-xs text-stone-400 font-mono">📅 {item.date}</span>
                      {item.time && <span className="text-xs text-stone-400 font-mono">⏰ {item.time}</span>}
                    </div>

                    <h3 className="text-base font-bold text-stone-900 font-devanagari">
                      {item.titleMarathi}
                    </h3>

                    <p className="text-xs text-stone-600 font-devanagari line-clamp-2">
                      {item.contentMarathi}
                    </p>

                    {item.venue && (
                      <div className="text-[11px] text-stone-500 font-devanagari flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-orange-600" />
                        <span>स्थान: {item.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-center">
                    {itemStatus !== 'PUBLISHED' ? (
                      <button
                        onClick={() => handleQuickStatusChange(item.id, 'PUBLISHED')}
                        className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-bold font-devanagari flex items-center gap-1"
                        title="प्रसिद्ध करा"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>प्रसिद्ध करा</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickStatusChange(item.id, 'UNPUBLISHED')}
                        className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 rounded-lg text-xs font-bold font-devanagari flex items-center gap-1"
                        title="अप्रकाशित करा"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>अप्रकाशित</span>
                      </button>
                    )}

                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 text-stone-600 hover:text-orange-600 rounded-lg hover:bg-stone-100"
                      title="पूर्वावलोकन पहा (Preview)"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-stone-600 hover:text-orange-600 rounded-lg hover:bg-stone-100"
                      title="संपादित करा (Edit)"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="हटवा (Delete)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'सूचना संपादित करा' : 'नवीन सूचना तयार करा'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {formError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-bold font-devanagari">
              {formError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              सूचनेचे शीर्षक (मराठी) *
            </label>
            <input
              type="text"
              required
              value={titleMarathi}
              onChange={(e) => setTitleMarathi(e.target.value)}
              placeholder="उदा. गणेश आगमन मिरवणूक व महाआरती"
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-devanagari font-bold"
            />
          </div>

          {/* Content */}
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

          {/* Date, Time, Venue Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                दिनांक (Date)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                वेळ (Time - ऐच्छिक)
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="उदा. सायं. ७:३०"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                स्थान / पत्ता (Venue)
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="उदा. मंडळ मुख्य मंडप"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              />
            </div>
          </div>

          {/* Priority and Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                प्राधान्य (Priority)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              >
                <option value="NORMAL">सामान्य (Normal)</option>
                <option value="HIGH">महत्त्वाची (High)</option>
                <option value="URGENT">तातडीची (Urgent)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                स्थिती (Publication Status)
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari font-bold"
              >
                <option value="PUBLISHED">🟢 प्रसिद्ध करा (PUBLISHED - Live)</option>
                <option value="DRAFT">⚪ मसुदा ठेवा (DRAFT)</option>
                <option value="UNPUBLISHED">🟡 अप्रकाशित (UNPUBLISHED)</option>
                <option value="ARCHIVED">🔴 संग्रहित (ARCHIVED)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              रद्द करा
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} className="font-devanagari font-bold px-4">
              सेव्ह करा
            </Button>
          </div>
        </form>
      </Modal>

      {/* PREVIEW MODAL */}
      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title="सूचना पूर्वावलोकन (Announcement Preview)"
          maxWidth="md"
        >
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3 font-devanagari">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-bold text-orange-800 uppercase tracking-wider">
                महत्त्वाची सूचना
              </span>
              <span>📅 {previewItem.date} {previewItem.time && `• ⏰ ${previewItem.time}`}</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">{previewItem.titleMarathi}</h3>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {previewItem.contentMarathi}
            </p>
            {previewItem.venue && (
              <div className="text-xs text-amber-900 font-semibold pt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                <span>स्थान: {previewItem.venue}</span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
