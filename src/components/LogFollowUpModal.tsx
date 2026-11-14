'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, History, MessageSquare, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Lead, Channel, FollowUp } from '@/lib/types';
import { addFollowUp, fetchFollowUpsForLead } from '@/lib/storage';

interface LogFollowUpModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const OUTCOMES = [
  { label: 'Connected', icon: '📞', color: 'border-blue-500 bg-blue-50 text-blue-800' },
  { label: 'Call back', icon: '⏱️', color: 'border-amber-500 bg-amber-50 text-amber-800' },
  { label: 'Not answered', icon: '📵', color: 'border-slate-300 bg-slate-50 text-slate-700' },
  { label: 'WhatsApp sent', icon: '💬', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
  { label: 'Meeting done', icon: '🤝', color: 'border-purple-500 bg-purple-50 text-purple-800' },
  { label: 'Not interested', icon: '❌', color: 'border-rose-300 bg-rose-50 text-rose-800' },
];

const QUICK_NOTES = [
  'Shared brochure & pricing on WhatsApp',
  'Interested in 3BHK, wants weekend visit',
  'Budget high, looking for alternatives',
  'Busy right now, asked to call in evening',
];

export default function LogFollowUpModal({
  lead,
  isOpen,
  onClose,
  onSaved,
}: LogFollowUpModalProps) {
  const [outcome, setOutcome] = useState('Connected');
  const [channel, setChannel] = useState<Channel>('call');
  const [note, setNote] = useState('');
  const [pastNotes, setPastNotes] = useState<FollowUp[]>([]);
  const [showPastNotes, setShowPastNotes] = useState(false);

  useEffect(() => {
    if (isOpen && lead) {
      fetchFollowUpsForLead(lead.id).then(setPastNotes).catch(console.error);
    }
  }, [isOpen, lead?.id]);

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const in1Week = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [nextDate, setNextDate] = useState(tomorrow);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addFollowUp(lead.id, {
        channel,
        outcome,
        note: note.trim() || `Follow-up logged: ${outcome}`,
        next_follow_up_at: outcome === 'Not interested' ? undefined : new Date(`${nextDate}T10:00:00Z`).toISOString(),
      });
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save follow-up');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/70">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-blue-600">
              Quick Log Follow-up
            </span>
            <h3 className="text-base font-bold text-slate-900 truncate">
              {lead.name} <span className="text-xs font-normal text-slate-500">({lead.phone})</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Past Notes & Messages History Toggle */}
          {pastNotes.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
              <button
                type="button"
                onClick={() => setShowPastNotes(prev => !prev)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-800"
              >
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>Past Notes & Messages ({pastNotes.length})</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-blue-600 font-extrabold">
                  <span>{showPastNotes ? 'Hide' : 'Show All'}</span>
                  {showPastNotes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {showPastNotes && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 pt-1 border-t border-slate-200">
                  {pastNotes.map(fu => (
                    <div key={fu.id} className="bg-white p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span className="font-bold text-slate-800 capitalize flex items-center gap-1">
                          {fu.channel === 'whatsapp' ? (
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <FileText className="w-3 h-3 text-blue-600" />
                          )}
                          <span>{fu.channel} &bull; {fu.outcome || 'Note'}</span>
                        </span>
                        <span>{new Date(fu.contacted_at || fu.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium">{fu.note}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 1: Channel */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              1. Communication Channel
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['call', 'whatsapp', 'meeting', 'site_visit'] as Channel[]).map(type => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setChannel(type)}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border text-center capitalize transition-all ${
                    channel === type
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Pick Outcome */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              2. Outcome
            </label>
            <div className="grid grid-cols-3 gap-2">
              {OUTCOMES.map(item => {
                const selected = outcome === item.label;
                return (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => setOutcome(item.label)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                      selected
                        ? `${item.color} ring-2 ring-blue-500/20 shadow-sm scale-[1.02]`
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="truncate w-full text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Next Follow-up Date */}
          {outcome !== 'Not interested' && (
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                3. Next Follow-up Date
              </label>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setNextDate(tomorrow)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    nextDate === tomorrow
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setNextDate(in3Days)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    nextDate === in3Days
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  In 3 Days
                </button>
                <button
                  type="button"
                  onClick={() => setNextDate(in1Week)}
                  className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                    nextDate === in1Week
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700'
                  }`}
                >
                  In 1 Week
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Or pick date:</span>
                <input
                  type="date"
                  value={nextDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setNextDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Quick Note */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700">
                Notes (Optional)
              </label>
              <span className="text-[11px] text-slate-400">Tap quick phrase</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-2">
              {QUICK_NOTES.map(preset => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setNote(prev => (prev ? `${prev}. ${preset}` : preset))}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-medium text-left"
                >
                  + {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add specific details or next action..."
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 space-y-1.5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Saving...' : '+ Add New Follow-up Note'}</span>
            </button>
            <p className="text-[10px] text-center text-slate-400 font-medium">
              Every note is added as a new entry in the client&apos;s history (never overwrites).
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
