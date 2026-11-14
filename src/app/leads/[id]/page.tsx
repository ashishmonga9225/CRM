'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  History,
  AlertTriangle,
  Compass,
  CheckCircle2,
  FileText,
  Plus,
} from 'lucide-react';
import { Lead, FollowUp, SiteVisit, LeadStatus } from '@/lib/types';
import {
  fetchLeadById,
  fetchFollowUpsForLead,
  fetchSiteVisits,
  updateLeadStatus,
  addFollowUp,
} from '@/lib/storage';
import LogFollowUpModal from '@/components/LogFollowUpModal';
import ScheduleVisitModal from '@/components/ScheduleVisitModal';
import WhatsAppModal from '@/components/WhatsAppModal';
import LeadNotesModal from '@/components/LeadNotesModal';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'visit_scheduled', label: 'Visit Scheduled' },
  { value: 'visit_done', label: 'Visit Done' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'booked', label: 'Booked' },
  { value: 'lost', label: 'Not Interested / Lost' },
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  // Inline note state
  const [inlineNote, setInlineNote] = useState('');
  const [inlineSubmitting, setInlineSubmitting] = useState(false);

  const [showLostConfirm, setShowLostConfirm] = useState(false);
  const [lostReason, setLostReason] = useState('');

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    const [leadData, fuData, allVisits] = await Promise.all([
      fetchLeadById(id),
      fetchFollowUpsForLead(id),
      fetchSiteVisits(),
    ]);

    setLead(leadData);
    setFollowUps(fuData);
    setVisits(allVisits.filter(v => v.lead_id === id));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 text-sm animate-pulse">
        Loading lead profile...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm font-bold text-slate-700">Lead not found</p>
        <Link href="/leads" className="text-xs text-blue-600 underline font-bold">
          &larr; Back to Leads
        </Link>
      </div>
    );
  }

  const cleanPhone = lead.phone.replace(/\D/g, '');
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
    `Hello ${lead.name}, regarding your property requirement.`
  )}`;

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (newStatus === 'lost') {
      setShowLostConfirm(true);
      return;
    }
    await updateLeadStatus(lead.id, newStatus);
    loadData();
  };

  const confirmMarkLost = async () => {
    if (!lostReason.trim()) {
      alert('Please specify a reason for marking this lead as Lost.');
      return;
    }
    await updateLeadStatus(lead.id, 'lost', lostReason);
    setShowLostConfirm(false);
    loadData();
  };

  const handleInlineAddNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inlineNote.trim() || !lead) return;
    setInlineSubmitting(true);
    try {
      await addFollowUp(lead.id, {
        channel: 'other',
        outcome: 'Note Added',
        note: inlineNote.trim(),
      });
      setInlineNote('');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Could not save note');
    } finally {
      setInlineSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-black uppercase ${
              lead.temperature === 'hot'
                ? 'bg-red-600 text-white'
                : lead.temperature === 'warm'
                ? 'bg-amber-500 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            {lead.temperature}
          </span>

          <button
            onClick={() => setShowVisitModal(true)}
            className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs px-3 py-2 rounded-xl transition-all"
          >
            <Compass className="w-4 h-4" />
            <span>Visit</span>
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {lead.name}
              </h1>
              <p className="text-sm font-bold text-slate-600 font-mono mt-0.5">
                {lead.phone}
              </p>
            </div>

            <div className="text-right">
              <label className="text-[10px] uppercase font-extrabold text-slate-400 block mb-0.5">
                Current Stage
              </label>
              <select
                value={lead.status}
                onChange={e => handleStatusChange(e.target.value as LeadStatus)}
                className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 capitalize"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <a
              href={`tel:${lead.phone}`}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <Phone className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>Call Lead</span>
            </a>
            <button
              type="button"
              onClick={() => setShowWhatsAppModal(true)}
              className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setShowNotesModal(true)}
              className="h-12 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Notes ({followUps.length})</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">
              Development
            </span>
            <span className="font-extrabold text-slate-900 text-sm truncate block">
              {lead.project?.name || 'Any Project'}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">
              Lead Source
            </span>
            <span className="font-bold text-slate-800">
              {lead.source || 'Direct'}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">
              Next Follow-Up
            </span>
            <span className="font-bold text-blue-700">
              {lead.next_follow_up_at
                ? new Date(lead.next_follow_up_at).toLocaleDateString('en-IN')
                : 'No follow-up set'}
            </span>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-600 block uppercase">
              Temperature
            </span>
            <span className="font-bold text-slate-900 capitalize">
              {lead.temperature}
            </span>
          </div>
        </div>

        {lead.requirement && (
          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs">
            <span className="text-[10px] font-bold text-blue-900 block uppercase">
              Specific Requirement
            </span>
            <p className="font-semibold text-slate-800 mt-0.5">{lead.requirement}</p>
          </div>
        )}

        {lead.status === 'lost' && lead.lost_reason && (
          <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-900">
            <span className="text-[10px] font-bold text-red-700 block uppercase">
              Reason Marked Lost
            </span>
            <p className="font-semibold mt-0.5">{lead.lost_reason}</p>
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Activity History & Timeline
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-600">
            {followUps.length + visits.length} items
          </span>
        </div>

        {/* Inline Add Note Composer (Appends to history) */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Note / Message</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Appends &bull; Never overwrites
            </span>
          </div>

          <div className="flex flex-wrap gap-1">
            {[
              'Interested in 3BHK',
              'Wants weekend site visit',
              'Budget confirmed',
              'Call back tomorrow',
              'Shared brochure',
            ].map(phrase => (
              <button
                key={phrase}
                type="button"
                onClick={() =>
                  setInlineNote(prev => (prev ? `${prev}. ${phrase}` : phrase))
                }
                className="text-[10px] bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-2 py-0.5 rounded-md font-medium transition-all"
              >
                + {phrase}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-2 pt-1">
            <textarea
              rows={2}
              value={inlineNote}
              onChange={e => setInlineNote(e.target.value)}
              placeholder="Type a note or message here..."
              className="flex-1 p-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-inner"
            />
            <button
              type="button"
              disabled={inlineSubmitting || !inlineNote.trim()}
              onClick={handleInlineAddNote}
              className="h-10 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{inlineSubmitting ? 'Saving...' : 'Add Note'}</span>
            </button>
          </div>
        </div>

        {followUps.length === 0 && visits.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No activity recorded yet. Write a note above or tap &ldquo;Log Follow-up&rdquo; below to record the first contact.
          </div>
        ) : (
          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            {followUps.map(fu => {
              const isWhatsApp = fu.channel === 'whatsapp';
              const isCall = fu.channel === 'call';
              return (
                <div key={fu.id} className="relative flex items-start gap-3 pl-2">
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-white z-10 flex-shrink-0 mt-1 ${
                      isWhatsApp
                        ? 'bg-emerald-600 ring-2 ring-emerald-100'
                        : isCall
                        ? 'bg-blue-600 ring-2 ring-blue-100'
                        : 'bg-amber-500 ring-2 ring-amber-100'
                    }`}
                  />
                  <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 capitalize flex items-center gap-1.5">
                        {isWhatsApp ? (
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                        ) : isCall ? (
                          <Phone className="w-3 h-3 text-blue-600" />
                        ) : (
                          <FileText className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{fu.outcome || fu.channel}</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {new Date(fu.contacted_at || fu.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-800 leading-relaxed font-medium">{fu.note}</p>
                  </div>
                </div>
              );
            })}

            {visits.map(v => (
              <div key={v.id} className="relative flex items-start gap-3 pl-2">
                <div className="w-4 h-4 rounded-full bg-purple-600 border-2 border-white ring-2 ring-purple-100 z-10 flex-shrink-0 mt-1" />
                <div className="flex-1 bg-purple-50/50 p-3 rounded-xl border border-purple-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 capitalize">
                      Site Visit: {v.status}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {new Date(v.visit_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {v.outcome && (
                    <div className="text-[11px] font-semibold text-purple-800">
                      Outcome: {v.outcome}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRM MARK AS LOST MODAL */}
      {showLostConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Mark Lead as Lost</span>
            </div>
            <p className="text-xs text-slate-600">
              Please state why this lead is not interested / lost:
            </p>
            <input
              type="text"
              required
              value={lostReason}
              onChange={e => setLostReason(e.target.value)}
              placeholder="e.g. Budget mismatch, Bought elsewhere"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
            />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLostConfirm(false)}
                className="py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmMarkLost}
                className="py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs shadow-md"
              >
                Confirm Lost
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIXED ONE-THUMB "LOG FOLLOW-UP" BOTTOM BUTTON */}
      <div className="fixed bottom-20 md:bottom-6 left-0 right-0 max-w-md mx-auto px-4 z-40">
        <button
          onClick={() => setShowFollowUpModal(true)}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-2 active:scale-[0.98] transition-all border-2 border-white/40"
        >
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>Log Follow-up</span>
        </button>
      </div>

      {showFollowUpModal && (
        <LogFollowUpModal
          lead={lead}
          isOpen={showFollowUpModal}
          onClose={() => setShowFollowUpModal(false)}
          onSaved={loadData}
        />
      )}

      {showVisitModal && (
        <ScheduleVisitModal
          lead={lead}
          isOpen={showVisitModal}
          onClose={() => setShowVisitModal(false)}
          onScheduled={loadData}
        />
      )}

      {showWhatsAppModal && (
        <WhatsAppModal
          lead={lead}
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          onFollowUpLogged={loadData}
        />
      )}

      {showNotesModal && (
        <LeadNotesModal
          lead={lead}
          isOpen={showNotesModal}
          onClose={() => setShowNotesModal(false)}
          onNotesUpdated={loadData}
        />
      )}
    </div>
  );
}
