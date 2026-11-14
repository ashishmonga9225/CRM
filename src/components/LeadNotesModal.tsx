'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  MessageSquare,
  Phone,
  Send,
  Plus,
  Clock,
  Sparkles,
  Calendar,
  FileText,
  User,
  CheckCircle2,
} from 'lucide-react';
import { Lead, FollowUp, Channel } from '@/lib/types';
import { fetchFollowUpsForLead, addFollowUp } from '@/lib/storage';

interface LeadNotesModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onNotesUpdated?: () => void;
}

const PRESET_PHRASES = [
  'Shared brochure & pricing on WhatsApp',
  'Interested in 3BHK, wants weekend visit',
  'Budget too high, looking for alternatives',
  'Busy right now, call back in evening',
  'Ready to negotiate on token booking',
  'Pre-approved bank loan confirmed',
];

export default function LeadNotesModal({
  lead,
  isOpen,
  onClose,
  onNotesUpdated,
}: LeadNotesModalProps) {
  const [messages, setMessages] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<Channel>('other');
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = async () => {
    if (!lead) return;
    setLoading(true);
    try {
      const data = await fetchFollowUpsForLead(lead.id);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch lead notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && lead) {
      loadNotes();
    }
  }, [isOpen, lead?.id]);

  if (!isOpen || !lead) return null;

  const handleAddNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      const created = await addFollowUp(lead.id, {
        channel: selectedChannel,
        note: newNote.trim(),
        outcome: selectedChannel === 'whatsapp' ? 'WhatsApp Message' : selectedChannel === 'call' ? 'Call Note' : 'Note Added',
      });

      // Append new message to local state immediately
      setMessages(prev => [created, ...prev]);
      setNewNote('');
      if (onNotesUpdated) onNotesUpdated();
    } catch (err) {
      console.error('Failed to add note:', err);
      alert('Could not save note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimestamp = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeStr = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) {
      return `Today, ${timeStr}`;
    }
    return `${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}, ${timeStr}`;
  };

  const getChannelBadge = (fu: FollowUp) => {
    if (fu.channel === 'whatsapp') {
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
        label: 'WhatsApp Message',
      };
    }
    if (fu.channel === 'call') {
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        icon: <Phone className="w-3.5 h-3.5 text-blue-600" />,
        label: fu.outcome || 'Phone Call',
      };
    }
    if (fu.channel === 'meeting' || fu.channel === 'site_visit') {
      return {
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        icon: <Calendar className="w-3.5 h-3.5 text-purple-600" />,
        label: fu.channel === 'site_visit' ? 'Site Visit' : 'Meeting',
      };
    }
    return {
      bg: 'bg-amber-50 text-amber-900 border-amber-200',
      icon: <FileText className="w-3.5 h-3.5 text-amber-600" />,
      label: fu.outcome || 'Note Added',
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-600">
                  Notes & Message History
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                  {messages.length}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 truncate">
                {lead.name} <span className="text-xs font-mono font-medium text-slate-500">({lead.phone})</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Message & Note Stream */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
              Loading notes & message history...
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm space-y-2 my-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">No notes or messages yet</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Add your first note below. Every note is saved to history so you can track all conversations with {lead.name}.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(fu => {
                const badge = getChannelBadge(fu);
                return (
                  <div
                    key={fu.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all space-y-2"
                  >
                    {/* Top Row: Channel Badge + Timestamp */}
                    <div className="flex items-center justify-between gap-2">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${badge.bg}`}>
                        {badge.icon}
                        <span>{badge.label}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTimestamp(fu.contacted_at || fu.created_at)}
                      </span>
                    </div>

                    {/* Message / Note Content */}
                    <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-wrap pl-1">
                      {fu.note || 'No additional note'}
                    </p>

                    {/* Next Follow-up Pill (if set) */}
                    {fu.next_follow_up_at && (
                      <div className="text-[10px] font-bold text-blue-700 bg-blue-50/70 border border-blue-100 rounded-lg px-2 py-0.5 inline-block">
                        Next action set for: {new Date(fu.next_follow_up_at).toLocaleDateString('en-IN')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Composer: Quick Preset Phrases & Add Note */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          {/* Quick presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                1-Tap Quick Note
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">Appends to history</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {PRESET_PHRASES.map(phrase => (
                <button
                  key={phrase}
                  type="button"
                  onClick={() => setNewNote(prev => (prev ? `${prev}. ${phrase}` : phrase))}
                  className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[10px] font-bold whitespace-nowrap transition-all border border-slate-200"
                >
                  + {phrase}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAddNote} className="space-y-2.5">
            {/* Channel Selection */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-500 mr-1">Type:</span>
              {[
                { value: 'other', label: '📝 Note' },
                { value: 'whatsapp', label: '💬 WhatsApp' },
                { value: 'call', label: '📞 Call' },
                { value: 'meeting', label: '🤝 Meeting' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSelectedChannel(opt.value as Channel)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    selectedChannel === opt.value
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                required
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder={`Write a note for ${lead.name}... (notes are added, never overwritten)`}
                className="flex-1 p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-none shadow-inner"
              />

              <button
                type="submit"
                disabled={submitting || !newNote.trim()}
                className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{submitting ? 'Adding...' : 'Add Note'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
