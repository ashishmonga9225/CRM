'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  CalendarCheck,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Lead } from '@/lib/types';
import { fetchLeads } from '@/lib/storage';
import LeadCard from '@/components/LeadCard';
import LogFollowUpModal from '@/components/LogFollowUpModal';
import ScheduleVisitModal from '@/components/ScheduleVisitModal';
import WhatsAppModal from '@/components/WhatsAppModal';
import LeadNotesModal from '@/components/LeadNotesModal';

export default function TodayPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'overdue' | 'due' | 'upcoming'>('all');
  
  const [activeLeadForFollowUp, setActiveLeadForFollowUp] = useState<Lead | null>(null);
  const [activeLeadForVisit, setActiveLeadForVisit] = useState<Lead | null>(null);
  const [activeLeadForWhatsApp, setActiveLeadForWhatsApp] = useState<Lead | null>(null);
  const [activeLeadForNotes, setActiveLeadForNotes] = useState<Lead | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLeads();
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const activeFollowUpLeads = leads.filter(
    l => l.status !== 'booked' && l.status !== 'lost'
  );

  const overdueLeads = activeFollowUpLeads.filter(l => {
    if (!l.next_follow_up_at) return false;
    const dStr = new Date(l.next_follow_up_at).toISOString().split('T')[0];
    return dStr < todayStr;
  });

  const dueTodayLeads = activeFollowUpLeads.filter(l => {
    if (!l.next_follow_up_at) return false;
    const dStr = new Date(l.next_follow_up_at).toISOString().split('T')[0];
    return dStr === todayStr;
  });

  const upcomingLeads = activeFollowUpLeads.filter(l => {
    if (!l.next_follow_up_at) return false;
    const dStr = new Date(l.next_follow_up_at).toISOString().split('T')[0];
    return dStr > todayStr;
  });

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Today&apos;s Follow-ups
          </h1>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 active:rotate-180 transition-all shadow-sm"
          title="Refresh follow-ups"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={() => setActiveTab(activeTab === 'overdue' ? 'all' : 'overdue')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTab === 'overdue'
              ? 'ring-2 ring-red-500 bg-red-100/60 border-red-400'
              : 'bg-red-50/80 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold text-red-700 uppercase tracking-tight">
              Overdue
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <p className="text-2xl font-black text-red-700">{overdueLeads.length}</p>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'due' ? 'all' : 'due')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTab === 'due'
              ? 'ring-2 ring-amber-500 bg-amber-100/60 border-amber-400'
              : 'bg-amber-50/80 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-tight">
              Due Today
            </span>
            <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-800">{dueTodayLeads.length}</p>
        </button>

        <button
          onClick={() => setActiveTab(activeTab === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            activeTab === 'upcoming'
              ? 'ring-2 ring-emerald-500 bg-emerald-100/60 border-emerald-400'
              : 'bg-emerald-50/80 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-tight">
              Upcoming
            </span>
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-800">{upcomingLeads.length}</p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Active ({activeFollowUpLeads.length})
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'overdue'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
          }`}
        >
          <span>Overdue</span>
          <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-800 text-[10px]">
            {overdueLeads.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('due')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'due'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-50'
          }`}
        >
          <span>Due Today</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
            {dueTodayLeads.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'upcoming'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          <span>Upcoming</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
            {upcomingLeads.length}
          </span>
        </button>
      </div>

      {/* Main List Rendering */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 animate-pulse text-sm">
          Loading follow-ups...
        </div>
      ) : activeFollowUpLeads.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm my-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">All caught up for today!</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              You have no pending follow-ups due right now. Ready to capture a new prospect?
            </p>
          </div>
          <Link
            href="/leads/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Lead</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'overdue') && overdueLeads.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <h2 className="text-sm font-extrabold text-red-700 uppercase tracking-wider">
                  Overdue Follow-ups ({overdueLeads.length})
                </h2>
              </div>
              <div className="space-y-3">
                {overdueLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onLogFollowUp={l => setActiveLeadForFollowUp(l)}
                    onWhatsApp={l => setActiveLeadForWhatsApp(l)}
                    onScheduleVisit={l => setActiveLeadForVisit(l)}
                    onViewNotes={l => setActiveLeadForNotes(l)}
                  />
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'due') && dueTodayLeads.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h2 className="text-sm font-extrabold text-amber-800 uppercase tracking-wider">
                  Due Today ({dueTodayLeads.length})
                </h2>
              </div>
              <div className="space-y-3">
                {dueTodayLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onLogFollowUp={l => setActiveLeadForFollowUp(l)}
                    onWhatsApp={l => setActiveLeadForWhatsApp(l)}
                    onScheduleVisit={l => setActiveLeadForVisit(l)}
                    onViewNotes={l => setActiveLeadForNotes(l)}
                  />
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'upcoming') && upcomingLeads.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h2 className="text-sm font-extrabold text-emerald-800 uppercase tracking-wider">
                  Upcoming ({upcomingLeads.length})
                </h2>
              </div>
              <div className="space-y-3">
                {upcomingLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onLogFollowUp={l => setActiveLeadForFollowUp(l)}
                    onWhatsApp={l => setActiveLeadForWhatsApp(l)}
                    onScheduleVisit={l => setActiveLeadForVisit(l)}
                    onViewNotes={l => setActiveLeadForNotes(l)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeLeadForFollowUp && (
        <LogFollowUpModal
          lead={activeLeadForFollowUp}
          isOpen={Boolean(activeLeadForFollowUp)}
          onClose={() => setActiveLeadForFollowUp(null)}
          onSaved={loadData}
        />
      )}

      {activeLeadForVisit && (
        <ScheduleVisitModal
          lead={activeLeadForVisit}
          isOpen={Boolean(activeLeadForVisit)}
          onClose={() => setActiveLeadForVisit(null)}
          onScheduled={loadData}
        />
      )}

      {activeLeadForWhatsApp && (
        <WhatsAppModal
          lead={activeLeadForWhatsApp}
          isOpen={Boolean(activeLeadForWhatsApp)}
          onClose={() => setActiveLeadForWhatsApp(null)}
          onFollowUpLogged={loadData}
        />
      )}

      {activeLeadForNotes && (
        <LeadNotesModal
          lead={activeLeadForNotes}
          isOpen={Boolean(activeLeadForNotes)}
          onClose={() => setActiveLeadForNotes(null)}
          onNotesUpdated={loadData}
        />
      )}
    </div>
  );
}
