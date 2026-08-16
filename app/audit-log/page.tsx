'use client';

import React, { useEffect, useState } from 'react';
import { History, Shield, Search, User, Filter, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useAppMode } from '@/lib/context/mode-context';
import { AuditLog } from '@/types';

export default function AuditLogPage() {
  const { mode } = useAppMode();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/audit-logs?mode=${mode}`);
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [mode]);

  const filteredLogs = logs.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      l.userName.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <h1 className="text-xl sm:text-2xl font-black font-devanagari text-stone-900 flex items-center gap-2">
          <History className="w-6 h-6 text-orange-600" />
          <span>ऑडिट व ॲक्टिव्हिटी लॉग (Audit & Activity Trail)</span>
        </h1>
        <p className="text-xs text-stone-500 font-devanagari">
          मंडळातील सर्व पावत्या, लॉगिन, बदल व आर्थिक व्यवहारांची पारदर्शक आणि सुरक्षित नोंद.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="वापरकर्ता, कृती किंवा तपशील शोधा..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-devanagari"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-stone-700">
          <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase font-devanagari">
            <tr>
              <th className="px-4 py-3">वेळ व तारीख</th>
              <th className="px-4 py-3">वापरकर्ता</th>
              <th className="px-4 py-3">कृती (Action)</th>
              <th className="px-4 py-3">तपशील (Details)</th>
              <th className="px-4 py-3">मोड</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-stone-400 font-devanagari">
                  कोणतीही ऑडिट नोंद आढळली नाही.
                </td>
              </tr>
            ) : (
              filteredLogs.map((l) => (
                <tr key={l.id} className="hover:bg-amber-50/20 transition-colors">
                  <td className="px-4 py-3 text-stone-500 font-mono whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-stone-900">{l.userName}</div>
                    <div className="text-[10px] text-stone-500 font-semibold">{l.userRole}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-orange-800">
                    {l.action}
                  </td>
                  <td className="px-4 py-3 text-stone-700 font-devanagari">
                    {l.details}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={l.mode === 'TEST' ? 'test' : 'success'}>
                      {l.mode}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
