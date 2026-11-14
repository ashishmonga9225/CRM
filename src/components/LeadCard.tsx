'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MessageSquare, ChevronRight, Clock, Building2, CheckCircle2, FileText, Plus } from 'lucide-react';
import { Lead } from '@/lib/types';

interface LeadCardProps {
  lead: Lead;
  onLogFollowUp: (lead: Lead) => void;
  onWhatsApp?: (lead: Lead) => void;
  onScheduleVisit?: (lead: Lead) => void;
  onViewNotes?: (lead: Lead) => void;
}

export default function LeadCard({
  lead,
  onLogFollowUp,
  onWhatsApp,
  onViewNotes,
}: LeadCardProps) {
  const cleanPhone = lead.phone.replace(/\D/g, '');
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const defaultWhatsAppUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Hi ${lead.name}, Ashish this side. We have received your query regarding property. Are you looking for investment or self-use?`
  )}`;

  const todayStr = new Date().toISOString().split('T')[0];
  const leadDateStr = lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toISOString().split('T')[0] : '';
  const isOverdue = leadDateStr && leadDateStr < todayStr;
  const isDueToday = leadDateStr === todayStr;

  const tempColors: Record<string, string> = {
    hot: 'bg-red-600 text-white font-extrabold',
    warm: 'bg-amber-500 text-white font-bold',
    cold: 'bg-blue-600 text-white font-bold',
  };

  const statusLabels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    visit_scheduled: 'Visit Scheduled',
    visit_done: 'Visit Done',
    negotiation: 'Negotiation',
    booked: 'Booked',
    lost: 'Not Interested / Lost',
  };

  const statusColors: Record<string, string> = {
    new: 'bg-sky-100 text-sky-800 border-sky-300',
    contacted: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    visit_scheduled: 'bg-purple-100 text-purple-800 border-purple-300',
    visit_done: 'bg-teal-100 text-teal-800 border-teal-300',
    negotiation: 'bg-amber-100 text-amber-900 border-amber-300',
    booked: 'bg-emerald-600 text-white border-emerald-600',
    lost: 'bg-red-100 text-red-800 border-red-300',
  };

  const displayBudget = lead.budget_text || (lead.budget_min || lead.budget_max ? `₹${lead.budget_min ? (lead.budget_min / 100000).toFixed(0) + 'L' : ''} - ₹${lead.budget_max ? (lead.budget_max / 100000).toFixed(0) + 'L' : ''}` : '');

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${
        isOverdue
          ? 'border-red-400 bg-red-50/10'
          : isDueToday
          ? 'border-amber-300 shadow-amber-500/5'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Row: Name, Status & Temperature Tags */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <Link
            href={`/leads/${lead.id}`}
            className="flex items-center gap-1.5 group"
          >
            <h3 className="font-extrabold text-base text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {lead.name}
            </h3>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
          </Link>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-700">
            <span className="font-semibold tracking-wide">{lead.phone}</span>
            {lead.source && (
              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                {lead.source}
              </span>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${tempColors[lead.temperature] || tempColors.warm}`}>
            {lead.temperature}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${statusColors[lead.status] || 'bg-slate-100 text-slate-700'}`}>
            {statusLabels[lead.status] || lead.status}
          </span>
        </div>
      </div>

      {/* Requirement / Project / Budget */}
      <div className="bg-slate-50 rounded-xl p-2.5 my-2.5 space-y-1 text-xs text-slate-800 border border-slate-100">
        {lead.requirement && (
          <p className="font-medium text-slate-900 leading-snug">
            <span className="text-slate-600 font-normal">Req: </span>
            {lead.requirement}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600">
          {displayBudget && (
            <span>
              <strong className="text-slate-800">Budget:</strong> {displayBudget}
            </span>
          )}
          {lead.project && (
            <span className="flex items-center gap-1 font-medium text-blue-700">
              <Building2 className="w-3.5 h-3.5" />
              {lead.project.name}
            </span>
          )}
        </div>
      </div>

      {/* Notes & Messages Preview / History Trigger */}
      {lead.last_follow_up ? (
        <button
          type="button"
          onClick={() => (onViewNotes ? onViewNotes(lead) : onLogFollowUp(lead))}
          className="w-full text-left mb-3 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 hover:bg-amber-100/70 transition-all group"
        >
          <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold mb-1">
            <span className="flex items-center gap-1.5 capitalize">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              Latest {lead.last_follow_up.channel}:
              <span className="font-normal text-amber-700 text-[10px]">
                {new Date(
                  lead.last_follow_up.contacted_at || lead.last_follow_up.created_at
                ).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </span>
            </span>
            <span className="text-[10px] text-blue-700 font-extrabold group-hover:underline flex items-center gap-0.5">
              <span>View all {lead.follow_ups?.length || 1} msgs</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-slate-800 text-[11px] line-clamp-2 leading-relaxed">
            &ldquo;{lead.last_follow_up.note}&rdquo;
          </p>
        </button>
      ) : (
        <div className="flex items-center justify-between mb-3 px-1 text-xs">
          <span className="text-[11px] text-slate-400">No notes recorded yet</span>
          <button
            type="button"
            onClick={() => (onViewNotes ? onViewNotes(lead) : onLogFollowUp(lead))}
            className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md"
          >
            <Plus className="w-3 h-3" />
            <span>+ Add Note</span>
          </button>
        </div>
      )}

      {/* Next Follow-up timing pill */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1.5 font-bold">
          <Clock
            className={`w-3.5 h-3.5 ${
              isOverdue ? 'text-red-600' : isDueToday ? 'text-amber-600' : 'text-slate-500'
            }`}
          />
          <span
            className={
              isOverdue
                ? 'text-red-700 font-extrabold'
                : isDueToday
                ? 'text-amber-700 font-extrabold'
                : 'text-slate-600'
            }
          >
            {isOverdue
              ? `Overdue (${leadDateStr})`
              : isDueToday
              ? 'Due Today'
              : leadDateStr
              ? `Upcoming: ${leadDateStr}`
              : 'No follow-up set'}
          </span>
        </div>
      </div>

      {/* ACTION BAR (Thumb Friendly Touch Targets) */}
      <div className="grid grid-cols-4 gap-1.5 pt-1 border-t border-slate-100">
        <a
          href={`tel:${lead.phone}`}
          className="h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          <span>Call</span>
        </a>

        {/* WhatsApp Button - Triggers Template Picker */}
        {onWhatsApp ? (
          <button
            type="button"
            onClick={() => onWhatsApp(lead)}
            className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>WhatsApp</span>
          </button>
        ) : (
          <a
            href={defaultWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>WhatsApp</span>
          </a>
        )}

        {/* Notes & Messages History */}
        <button
          type="button"
          onClick={() => (onViewNotes ? onViewNotes(lead) : onLogFollowUp(lead))}
          className="h-10 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>Notes {lead.follow_ups && lead.follow_ups.length > 0 ? `(${lead.follow_ups.length})` : ''}</span>
        </button>

        <button
          type="button"
          onClick={() => onLogFollowUp(lead)}
          className="h-10 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 transition-all"
        >
          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5] text-blue-600" />
          <span>Stage</span>
        </button>
      </div>
    </div>
  );
}
