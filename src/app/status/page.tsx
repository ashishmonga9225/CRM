'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Upload,
  Phone,
  MessageSquare,
  Search,
  ChevronRight,
  RefreshCw,
  FileText,
  Plus,
} from 'lucide-react';
import { Lead, LeadStatus, Profile } from '@/lib/types';
import { fetchLeads, updateLeadStatus, fetchTeamMembers } from '@/lib/storage';
import { useAuth } from '@/lib/auth';
import LogFollowUpModal from '@/components/LogFollowUpModal';
import WhatsAppModal from '@/components/WhatsAppModal';
import LeadNotesModal from '@/components/LeadNotesModal';
import { ShieldCheck } from 'lucide-react';

type FilterCategory = 'all' | 'interested' | 'not_interested' | 'new' | 'visits' | 'booked';

export default function LeadStatusBoardPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [search, setSearch] = useState('');
  
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);
  const [notesLead, setNotesLead] = useState<Lead | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [data, team] = await Promise.all([
      fetchLeads(user),
      user?.role === 'admin' ? fetchTeamMembers() : Promise.resolve([]),
    ]);
    setLeads(data);
    if (team) setTeamMembers(team);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const isInterested = (l: Lead) => {
    return (
      l.status !== 'lost' &&
      (l.temperature === 'hot' ||
        l.status === 'visit_scheduled' ||
        l.status === 'visit_done' ||
        l.status === 'negotiation' ||
        l.status === 'booked' ||
        (l.status === 'contacted' && l.temperature !== 'cold'))
    );
  };

  const isNotInterested = (l: Lead) => {
    return l.status === 'lost' || (l.temperature === 'cold' && l.status !== 'booked');
  };

  const interestedLeads = leads.filter(isInterested);
  const notInterestedLeads = leads.filter(isNotInterested);
  const newLeads = leads.filter(l => l.status === 'new');
  const visitLeads = leads.filter(
    l => l.status === 'visit_scheduled' || l.status === 'visit_done'
  );
  const bookedLeads = leads.filter(l => l.status === 'booked');

  const filteredList = leads.filter(lead => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lead.name.toLowerCase().includes(q) ||
      lead.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      (lead.requirement && lead.requirement.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (user?.role === 'admin' && selectedAgent !== 'all') {
      if (selectedAgent === 'unassigned') {
        if (lead.assigned_to) return false;
      } else {
        if (lead.assigned_to !== selectedAgent) return false;
      }
    }

    if (activeFilter === 'all') return true;
    if (activeFilter === 'interested') return isInterested(lead);
    if (activeFilter === 'not_interested') return isNotInterested(lead);
    if (activeFilter === 'new') return lead.status === 'new';
    if (activeFilter === 'visits')
      return lead.status === 'visit_scheduled' || lead.status === 'visit_done';
    if (activeFilter === 'booked') return lead.status === 'booked';

    return true;
  });

  const handleQuickStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    let lostReason: string | undefined = undefined;
    if (newStatus === 'lost') {
      const reason = window.prompt('Reason for Not Interested / Lost? (e.g. Budget mismatch, Bought elsewhere):');
      if (reason === null) return;
      lostReason = reason.trim() || 'Client not interested';
    }

    await updateLeadStatus(leadId, newStatus, lostReason);
    loadData();
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
            Pipeline & Disposition
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {user?.role === 'admin' ? 'Client Status Board' : 'My Client Status Board'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'admin' && (
            <Link
              href="/import"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Upload Excel</span>
            </Link>
          )}
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STATUS OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => setActiveFilter(activeFilter === 'interested' ? 'all' : 'interested')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeFilter === 'interested'
              ? 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-300'
              : 'bg-emerald-50/70 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black text-emerald-800 uppercase tracking-tight">
              🔥 Interested Clients
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-700">{interestedLeads.length}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Hot & Active buyers</span>
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'not_interested' ? 'all' : 'not_interested')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeFilter === 'not_interested'
              ? 'ring-2 ring-red-500 bg-red-50 border-red-300'
              : 'bg-red-50/70 border-red-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black text-red-800 uppercase tracking-tight">
              ❌ Not Interested
            </span>
          </div>
          <p className="text-2xl font-black text-red-700">{notInterestedLeads.length}</p>
          <span className="text-[10px] text-red-600 font-semibold">Lost or dropped</span>
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'visits' ? 'all' : 'visits')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeFilter === 'visits'
              ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-300'
              : 'bg-purple-50/70 border-purple-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black text-purple-800 uppercase tracking-tight">
              📅 Site Visits
            </span>
          </div>
          <p className="text-2xl font-black text-purple-700">{visitLeads.length}</p>
          <span className="text-[10px] text-purple-600 font-semibold">Scheduled / Completed</span>
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'booked' ? 'all' : 'booked')}
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            activeFilter === 'booked'
              ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
              : 'bg-blue-50/70 border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-black text-blue-800 uppercase tracking-tight">
              🎉 Booked Deals
            </span>
          </div>
          <p className="text-2xl font-black text-blue-700">{bookedLeads.length}</p>
          <span className="text-[10px] text-blue-600 font-semibold">Closed & converted</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by client name, mobile or requirement..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 shadow-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-3 text-xs text-slate-400 hover:text-slate-700 font-bold"
          >
            Clear
          </button>
        )}
      </div>

      {/* Agent Filter (Super Admin only) */}
      {user?.role === 'admin' && teamMembers.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <span className="text-[11px] font-bold text-purple-700 mr-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Agent:</span>
          </span>
          <button
            onClick={() => setSelectedAgent('all')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
              selectedAgent === 'all'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Agents ({leads.length})
          </button>
          <button
            onClick={() => setSelectedAgent('unassigned')}
            className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
              selectedAgent === 'unassigned'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Unassigned ({leads.filter(l => !l.assigned_to).length})
          </button>
          {teamMembers.map(tm => {
            const count = leads.filter(l => l.assigned_to === tm.id).length;
            return (
              <button
                key={tm.id}
                onClick={() => setSelectedAgent(tm.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                  selectedAgent === tm.id
                    ? 'bg-purple-700 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {tm.full_name} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Interactive Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          All Clients ({leads.length})
        </button>

        <button
          onClick={() => setActiveFilter('interested')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1 ${
            activeFilter === 'interested'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          <span>🔥 Interested ({interestedLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('not_interested')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap flex items-center gap-1 ${
            activeFilter === 'not_interested'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-white border border-red-200 text-red-800 hover:bg-red-50'
          }`}
        >
          <span>❌ Not Interested ({notInterestedLeads.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('visits')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeFilter === 'visits'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-50'
          }`}
        >
          Site Visits ({visitLeads.length})
        </button>

        <button
          onClick={() => setActiveFilter('new')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeFilter === 'new'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-white border border-sky-200 text-sky-800 hover:bg-sky-50'
          }`}
        >
          New ({newLeads.length})
        </button>

        <button
          onClick={() => setActiveFilter('booked')}
          className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
            activeFilter === 'booked'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white border border-blue-200 text-blue-800 hover:bg-blue-50'
          }`}
        >
          Booked ({bookedLeads.length})
        </button>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse">
          Loading client status records...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm my-6 space-y-3">
          <p className="text-sm font-bold text-slate-700">No clients found in this status</p>
          <p className="text-xs text-slate-400">
            Upload an Excel sheet or select another status filter above.
          </p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Excel File</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map(lead => {
            const isClientInterested = isInterested(lead);
            const isClientLost = lead.status === 'lost';

            return (
              <div
                key={lead.id}
                className={`bg-white rounded-2xl p-4 border transition-all ${
                  isClientLost
                    ? 'border-red-200 bg-red-50/15'
                    : isClientInterested
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-extrabold text-base text-slate-900 hover:text-blue-600 flex items-center gap-1.5"
                    >
                      <span>{lead.name}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </Link>
                    <div className="text-xs font-semibold text-slate-600 font-mono mt-0.5">
                      {lead.phone}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                        isClientLost
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : lead.status === 'booked'
                          ? 'bg-emerald-600 text-white'
                          : lead.temperature === 'hot'
                          ? 'bg-rose-600 text-white'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {lead.status === 'lost' ? 'Not Interested' : lead.status.replace('_', ' ')}
                    </span>

                    {lead.source && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        Source: {lead.source}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl my-2.5 border border-slate-100 text-xs space-y-1">
                  {lead.requirement && (
                    <div className="text-slate-800 font-medium">
                      <span className="text-slate-500 font-normal">Req: </span>
                      {lead.requirement}
                    </div>
                  )}
                  {lead.project && (
                    <div className="text-blue-700 font-semibold text-[11px]">
                      Project: {lead.project.name}
                    </div>
                  )}
                  {lead.lost_reason && (
                    <div className="pt-1 text-[11px] font-bold text-red-700 border-t border-red-100">
                      Reason: {lead.lost_reason}
                    </div>
                  )}
                </div>

                {/* Notes & Messages Preview */}
                {lead.last_follow_up ? (
                  <button
                    type="button"
                    onClick={() => setNotesLead(lead)}
                    className="w-full text-left my-2 p-2 rounded-xl bg-amber-50/70 border border-amber-200/70 hover:bg-amber-100/70 transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold mb-0.5">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-amber-700" />
                        Latest {lead.last_follow_up.channel || 'Note'}:
                      </span>
                      <span className="text-blue-700 font-bold group-hover:underline">
                        View all {lead.follow_ups?.length || 1} msgs &rarr;
                      </span>
                    </div>
                    <p className="text-slate-800 text-[11px] line-clamp-1 italic">
                      &ldquo;{lead.last_follow_up.note}&rdquo;
                    </p>
                  </button>
                ) : (
                  <div className="flex items-center justify-between my-2 px-1 text-[11px]">
                    <span className="text-slate-400">No notes yet</span>
                    <button
                      type="button"
                      onClick={() => setNotesLead(lead)}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Add Note</span>
                    </button>
                  </div>
                )}

                {/* Quick Status Action Controls */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${lead.phone}`}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setWhatsAppLead(lead)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesLead(lead)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 font-bold text-xs hover:bg-amber-100 flex items-center gap-1 border border-amber-200"
                      title="View all Notes & Messages"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" />
                      <span>Notes {lead.follow_ups && lead.follow_ups.length > 0 ? `(${lead.follow_ups.length})` : ''}</span>
                    </button>
                    <button
                      onClick={() => setFollowUpLead(lead)}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100"
                    >
                      Follow-up
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {!isClientInterested && (
                      <button
                        onClick={() => handleQuickStatusChange(lead.id, 'contacted')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-all"
                        title="Mark client as Interested"
                      >
                        ✓ Mark Interested
                      </button>
                    )}

                    {lead.status !== 'lost' && (
                      <button
                        onClick={() => handleQuickStatusChange(lead.id, 'lost')}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] border border-red-200 transition-all"
                        title="Mark client as Not Interested"
                      >
                        ✕ Not Interested
                      </button>
                    )}

                    {lead.status !== 'booked' && (
                      <button
                        onClick={() => handleQuickStatusChange(lead.id, 'booked')}
                        className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition-all"
                        title="Mark deal as Booked"
                      >
                        🎉 Booked
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {followUpLead && (
        <LogFollowUpModal
          lead={followUpLead}
          isOpen={Boolean(followUpLead)}
          onClose={() => setFollowUpLead(null)}
          onSaved={loadData}
        />
      )}

      {whatsAppLead && (
        <WhatsAppModal
          lead={whatsAppLead}
          isOpen={Boolean(whatsAppLead)}
          onClose={() => setWhatsAppLead(null)}
          onFollowUpLogged={loadData}
        />
      )}

      {notesLead && (
        <LeadNotesModal
          lead={notesLead}
          isOpen={Boolean(notesLead)}
          onClose={() => setNotesLead(null)}
          onNotesUpdated={loadData}
        />
      )}
    </div>
  );
}
