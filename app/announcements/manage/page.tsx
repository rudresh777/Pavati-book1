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
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Announcement } from '@/types';

export default function ManageAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<Announcement | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
    setTitle('');
    setContent('');
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
    setTitle(item.titleOriginal || item.titleMarathi || item.titleEnglish || '');
    setContent(item.contentOriginal || item.contentMarathi || item.contentEnglish || '');
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
    if (!title.trim() || !content.trim()) {
      setFormError('कृपया सूचनेचे शीर्षक आणि संपूर्ण मजकूर प्रविष्ट करा.');
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
          title: title.trim(),
          content: content.trim(),
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
      setFormError(err.message || 'त्रुटी आली. कृपया पुन्हा प्रयत्न करा.');
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
      {/* Header (Strictly Marathi Header) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-600" />
            <span>मंडळ सूचना व्यवस्थापन</span>
          </h1>
          <p className="text-xs text-stone-500 font-devanagari">
            वेबसाईटवरील सूचना फलकावर प्रसिद्ध करण्यासाठी नवीन सूचना तयार करा, संपादित करा किंवा अप्रकाशित करा. (इंग्रजी, हिंदी किंवा मराठीत माहिती भरल्यास ती आपोआप अधिकृत मराठीत रूपांतरित होईल.)
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
        {isLoading ? (
          <div className="text-center py-12 font-devanagari text-stone-500">
            सूचना लोड होत आहेत...
          </div>
        ) : announcements.length === 0 ? (
          <Card className="border-dashed border-stone-300">
            <CardContent className="p-12 text-center text-stone-400 font-devanagari space-y-2">
              <Bell className="w-10 h-10 mx-auto opacity-50" />
              <div className="font-bold text-stone-700">
                कोणतीही सूचना उपलब्ध नाही.
              </div>
              <p className="text-xs text-stone-500">
                नवीन सूचना प्रसिद्ध करण्यासाठी वरील "+ नवीन सूचना जोडा" बटनावर क्लिक करा.
              </p>
            </CardContent>
          </Card>
        ) : (
          announcements.map((item) => {
            const itemStatus = item.status || (item.active ? 'PUBLISHED' : 'DRAFT');
            const displayTitle = item.titleMarathi || item.titleOriginal || item.titleEnglish;
            const displayContent = item.contentMarathi || item.contentOriginal || item.contentEnglish;

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
                          ? 'प्रसिद्ध'
                          : itemStatus === 'DRAFT'
                          ? 'मसुदा'
                          : itemStatus === 'UNPUBLISHED'
                          ? 'अप्रकाशित'
                          : 'संग्रहित'}
                      </Badge>

                      <Badge variant={item.priority === 'HIGH' ? 'danger' : 'gold'}>
                        {item.priority === 'HIGH'
                          ? 'महत्त्वाची'
                          : item.priority === 'URGENT'
                          ? 'तातडीची'
                          : 'सामान्य'}
                      </Badge>

                      <span className="text-xs text-stone-400 font-mono">📅 {item.date}</span>
                      {item.time && <span className="text-xs text-stone-400 font-mono">⏰ {item.time}</span>}
                    </div>

                    <h3 className="text-base font-bold text-stone-900 font-devanagari">
                      {displayTitle}
                    </h3>

                    <p className="text-xs text-stone-600 font-devanagari line-clamp-2">
                      {displayContent}
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
                        <span>अप्रकाशित करा</span>
                      </button>
                    )}

                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-1.5 text-stone-600 hover:text-orange-600 rounded-lg hover:bg-stone-100"
                      title="पूर्वावलोकन"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1.5 text-stone-600 hover:text-orange-600 rounded-lg hover:bg-stone-100"
                      title="संपादित करा"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      title="हटवा"
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

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-devanagari flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>टीप:</strong> आपण ही माहिती इंग्रजी, हिंदी किंवा मराठीत भरू शकता. मुख्य वेबसाईटवर ती आपोआप अस्सल मराठीत दिसेल.
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              सूचनेचे शीर्षक *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="उदा. गणेश आगमन मिरवणूक व महाआरती किंवा Grand Aarti & Mahaprasad"
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-devanagari font-bold"
            />
          </div>

          {/* Content */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              सूचनेचा संपूर्ण तपशील / मजकूर *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="सर्व भाविक भक्तांना कळविण्यात येते की... किंवा Devotees are invited to attend..."
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-devanagari leading-relaxed"
            />
          </div>

          {/* Date, Time, Venue Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                दिनांक
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
                वेळ (ऐच्छिक)
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="उदा. सायं. ७:३० किंवा 7:30 PM"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                स्थान / पत्ता (ऐच्छिक)
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="उदा. मंडळ मुख्य मंडप किंवा Main Mandap"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              />
            </div>
          </div>

          {/* Priority and Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                प्राधान्य
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              >
                <option value="NORMAL">सामान्य (Normal)</option>
                <option value="HIGH">महत्त्वाची (High Priority)</option>
                <option value="URGENT">तातडीची (Urgent)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                प्रकाशन स्थिती
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari font-bold"
              >
                <option value="PUBLISHED">प्रसिद्ध करा (Published / Live)</option>
                <option value="DRAFT">मसुदा ठेवा (Draft)</option>
                <option value="UNPUBLISHED">अप्रकाशित (Unpublished)</option>
                <option value="ARCHIVED">संग्रहित (Archived)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              रद्द करा
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} className="font-devanagari font-bold px-4">
              सूचना सेव्ह करा
            </Button>
          </div>
        </form>
      </Modal>

      {/* PREVIEW MODAL */}
      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title="सूचना पूर्वावलोकन (मराठी फलक)"
          maxWidth="md"
        >
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-3 font-devanagari">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-bold text-orange-800 uppercase tracking-wider">
                महत्त्वाची सूचना
              </span>
              <span>📅 {previewItem.date} {previewItem.time && `• ⏰ ${previewItem.time}`}</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">
              {previewItem.titleMarathi || previewItem.titleOriginal}
            </h3>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">
              {previewItem.contentMarathi || previewItem.contentOriginal}
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
