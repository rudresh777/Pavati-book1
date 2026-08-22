'use client';

import React, { useEffect, useState } from 'react';
import { Users, Plus, Trash2, Shield, UserCheck, Key, KeyRound, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { User, UserRole } from '@/types';
import { useLanguage } from '@/lib/context/language-context';

export default function UsersManagementPage() {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('HOST');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setRole('HOST');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError(isEn ? 'Name, email, and password are required.' : 'नाव, ईमेल आणि पासवर्ड आवश्यक आहे.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          phone: phone.trim(),
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to create user account.' : 'वापरकर्ता तयार करण्यात त्रुटी आली.'));

      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || (isEn ? 'Something went wrong.' : 'काहीतरी त्रुटी आली.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (!confirm(isEn ? `Are you sure you want to delete "${userName}" account?` : `तुम्हाला खात्री आहे का की "${userName}" हे खाते हटवायचे आहे?`)) return;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (isEn ? 'Failed to delete user.' : 'वापरकर्ता हटवण्यात अडचण आली.'));
      fetchUsers();
    } catch (err: any) {
      alert(err.message || (isEn ? 'Error occurred.' : 'त्रुटी आली.'));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-600" />
            <span>{isEn ? 'Host & User Management' : 'मंडळ प्रतिनिधी व्यवस्थापन'}</span>
          </h1>
          <p className="text-xs text-stone-500 font-devanagari">
            {isEn
              ? 'Add or manage authorized hosts and administrator accounts for receipt generation.'
              : 'पावती तयार करण्यासाठी अधिकृत मंडळ प्रतिनिधी व सुपर ॲडमिन खाती जोडा किंवा व्यवस्थापित करा.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/settings/passwords">
            <Button
              variant="outline"
              size="sm"
              className="font-devanagari flex items-center gap-1.5 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950"
            >
              <KeyRound className="w-4 h-4 text-orange-600" />
              <span>{isEn ? 'Password Management' : 'पासवर्ड व्यवस्थापन'}</span>
            </Button>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
            className="font-devanagari flex items-center gap-1.5 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>{isEn ? '+ Add New Host' : '+ नवीन प्रतिनिधी जोडा'}</span>
          </Button>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase font-devanagari">
            <tr>
              <th className="px-4 py-3">{isEn ? 'Name' : 'नाव'}</th>
              <th className="px-4 py-3">{isEn ? 'Email / Contact' : 'ईमेल / संपर्क'}</th>
              <th className="px-4 py-3">{isEn ? 'Role' : 'भूमिका'}</th>
              <th className="px-4 py-3">{isEn ? 'Status' : 'स्थिती'}</th>
              <th className="px-4 py-3 text-right">{isEn ? 'Actions' : 'कृती'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-amber-50/30 transition-colors">
                <td className="px-4 py-3 font-bold text-stone-900 font-devanagari">
                  {u.name}
                </td>
                <td className="px-4 py-3">
                  <div className="text-stone-800">{u.email}</div>
                  {u.phone && <div className="text-[11px] text-stone-500 font-mono">{u.phone}</div>}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'SUPER_ADMIN' ? 'gold' : 'info'}>
                    {u.role === 'SUPER_ADMIN'
                      ? (isEn ? 'Super Admin' : 'सुपर ॲडमिन')
                      : (isEn ? 'Host' : 'मंडळ प्रतिनिधी')}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-emerald-700 font-bold">
                    {isEn ? 'Active' : 'सक्रिय'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDeleteUser(u.id, u.name)}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded hover:bg-red-50"
                    title={isEn ? 'Delete' : 'हटवा'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE HOST MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEn ? 'Add New Host' : 'नवीन प्रतिनिधी जोडा'}
        description={isEn ? 'Set up login credentials for the representative.' : 'प्रतिनिधीच्या लॉगिनसाठी ईमेल व पासवर्ड सेट करा.'}
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-bold">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              {isEn ? 'Full Name *' : 'प्रतिनिधीचे पूर्ण नाव *'}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isEn ? 'e.g. Rahul Kadam' : 'उदा. राहुल कदम'}
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              {isEn ? 'Email Address *' : 'ईमेल आयडी *'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="host2@mandal.org"
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-stone-700 font-devanagari">
              {isEn ? 'Password (Min 6 chars) *' : 'पासवर्ड (किमान ६ अक्षरे) *'}
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Mobile Number' : 'मोबाईल क्रमांक'}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full px-3.5 py-2 border border-stone-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-stone-700 font-devanagari">
                {isEn ? 'Role' : 'भूमिका'}
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-devanagari"
              >
                <option value="HOST">{isEn ? 'Mandal Host' : 'मंडळ प्रतिनिधी'}</option>
                <option value="SUPER_ADMIN">{isEn ? 'Super Admin' : 'सुपर ॲडमिन'}</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} className="font-devanagari">
              {isEn ? 'Create Account' : 'खाते तयार करा'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
