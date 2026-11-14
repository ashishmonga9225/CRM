'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Lead, Project } from '@/lib/types';
import { fetchProjects, scheduleSiteVisit } from '@/lib/storage';

interface ScheduleVisitModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

export default function ScheduleVisitModal({
  lead,
  isOpen,
  onClose,
  onScheduled,
}: ScheduleVisitModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(lead.project_id || '');
  const [visitDate, setVisitDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects().then(data => {
      setProjects(data);
      if (!selectedProjectId && data.length > 0) {
        setSelectedProjectId(data[0].id);
      }
    });
  }, [selectedProjectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await scheduleSiteVisit({
        lead_id: lead.id,
        project_id: selectedProjectId,
        visit_at: new Date(visitDate).toISOString(),
        notes,
      });
      onScheduled();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to schedule site visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-purple-600">
              Schedule Site Visit
            </span>
            <h3 className="text-base font-bold text-slate-900 truncate">
              {lead.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Select Development
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 bg-white"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Visit Date & Time
            </label>
            <input
              type="datetime-local"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Instructions / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Pickup from metro station, interested in sample flat A"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              <span>{isSubmitting ? 'Scheduling...' : 'Confirm Site Visit'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
