'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Building2,
  Phone,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { SiteVisit, SiteVisitStatus } from '@/lib/types';
import { fetchSiteVisits, updateSiteVisitOutcome } from '@/lib/storage';
import { useAuth } from '@/lib/auth';

export default function SiteVisitsPage() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const [editingVisit, setEditingVisit] = useState<SiteVisit | null>(null);
  const [outcomeText, setOutcomeText] = useState('');
  const [statusVal, setStatusVal] = useState<SiteVisitStatus>('done');

  const loadData = async () => {
    setLoading(true);
    const data = await fetchSiteVisits(user);
    setVisits(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const now = new Date().toISOString();
  const upcomingVisits = visits.filter(
    v => v.status === 'scheduled' && v.visit_at >= now
  );
  const pastVisits = visits.filter(
    v => v.status !== 'scheduled' || v.visit_at < now
  );

  const handleSaveOutcome = async () => {
    if (!editingVisit) return;
    await updateSiteVisitOutcome(editingVisit.id, outcomeText, statusVal);
    setEditingVisit(null);
    loadData();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600">
            Field Appointments
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Site Visits
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl max-w-sm">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'upcoming'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Upcoming ({upcomingVisits.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'past'
              ? 'bg-white text-purple-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Past / Completed ({pastVisits.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse">
          Loading site visits...
        </div>
      ) : (activeTab === 'upcoming' ? upcomingVisits : pastVisits).length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm my-6 space-y-2">
          <Compass className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No {activeTab} site visits</p>
          <p className="text-xs text-slate-400">
            Open any lead in your leads list to schedule a project site visit.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(activeTab === 'upcoming' ? upcomingVisits : pastVisits).map(visit => {
            const cleanPhone = visit.lead?.phone.replace(/\D/g, '') || '';
            const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
            const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
              `Hello ${visit.lead?.name}, looking forward to our site visit at ${visit.project?.name}.`
            )}`;

            return (
              <div
                key={visit.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Link
                      href={`/leads/${visit.lead_id}`}
                      className="font-extrabold text-base text-slate-900 hover:text-blue-600"
                    >
                      {visit.lead?.name || 'Lead'}
                    </Link>
                    <p className="text-xs font-semibold text-slate-500 font-mono">
                      {visit.lead?.phone}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      visit.status === 'scheduled'
                        ? 'bg-purple-100 text-purple-800'
                        : visit.status === 'done'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {visit.status}
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{visit.project?.name || 'Project Site'}</span>
                    {visit.project?.location && (
                      <span className="text-slate-600 font-normal">
                        ({visit.project.location})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {new Date(visit.visit_at).toLocaleString('en-IN', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {visit.outcome && (
                    <div className="pt-1 text-[11px] font-bold text-purple-900">
                      Outcome: {visit.outcome}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    {visit.lead?.phone && (
                      <>
                        <a
                          href={`tel:${visit.lead.phone}`}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Phone className="w-4 h-4 text-emerald-600" />
                        </a>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setEditingVisit(visit);
                      setOutcomeText(visit.outcome || '');
                      setStatusVal(visit.status);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs"
                  >
                    Update Outcome
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-900">
              Update Site Visit Outcome
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Status
              </label>
              <select
                value={statusVal}
                onChange={e => setStatusVal(e.target.value as SiteVisitStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold capitalize"
              >
                <option value="done">Done</option>
                <option value="scheduled">Scheduled</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Outcome & Feedback
              </label>
              <textarea
                rows={3}
                value={outcomeText}
                onChange={e => setOutcomeText(e.target.value)}
                placeholder="e.g. Liked layout, negotiating price"
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingVisit(null)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveOutcome}
                className="py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
