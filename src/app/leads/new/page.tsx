'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  AlertCircle,
  Check,
  Building2,
  Calendar,
  Phone,
  User,
} from 'lucide-react';
import { Project, Temperature, Lead } from '@/lib/types';
import { fetchProjects, checkDuplicatePhone, saveLead } from '@/lib/storage';

const SOURCES = ['MagicBricks', '99acres', 'Meta Ads', 'Referral', 'Walk-in', 'Website', 'Direct Call'];

export default function NewLeadPage() {
  const router = useRouter();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [temperature, setTemperature] = useState<Temperature>('warm');
  const [source, setSource] = useState('Meta Ads');
  const [requirement, setRequirement] = useState('');
  const [projectId, setProjectId] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');

  // Duplicate Check State
  const [duplicateLead, setDuplicateLead] = useState<Lead | null>(null);

  // Projects list
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
    fetchProjects().then(setProjects);
  }, []);

  // Live duplicate warning while typing
  useEffect(() => {
    const clean = phone.replace(/\D/g, '');
    if (clean.length >= 7) {
      checkDuplicatePhone(phone).then(found => {
        setDuplicateLead(found);
      });
    } else {
      setDuplicateLead(null);
    }
  }, [phone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = phone.replace(/\D/g, '');
    if (!name.trim() || cleanDigits.length < 7) {
      alert('Please enter a valid Name and a 7-15 digit phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await saveLead({
        name: name.trim(),
        phone: cleanDigits,
        temperature,
        source,
        requirement: requirement.trim(),
        project_id: projectId || undefined,
        next_follow_up_at: new Date(`${nextFollowUpDate}T10:00:00Z`).toISOString(),
        status: 'new',
      });
      router.push(`/leads/${created.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to save lead');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
            Fast Entry
          </span>
          <h1 className="text-xl font-black text-slate-900">Add New Lead</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* SECTION 1: REQUIRED FIELDS (Name & Phone) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Essential Details
          </h2>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Lead Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                ref={nameInputRef}
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ramesh Kulkarni"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className={`w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 ${
                  duplicateLead ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-300'
                }`}
              />
            </div>

            {duplicateLead && (
              <div className="mt-2.5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 font-bold text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Duplicate Lead Detected!</span>
                </div>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  A lead named <strong>{duplicateLead.name}</strong> is already registered with{' '}
                  <strong>{duplicateLead.phone}</strong> (Status: {duplicateLead.status}).
                </p>
                <div>
                  <Link
                    href={`/leads/${duplicateLead.id}`}
                    className="inline-block text-xs font-bold text-blue-700 underline hover:text-blue-900"
                  >
                    View existing lead record &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Temperature (Hot, Warm, Cold) */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Temperature
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemperature('hot')}
                className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                  temperature === 'hot'
                    ? 'border-red-600 bg-red-600 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                🔥 Hot
              </button>
              <button
                type="button"
                onClick={() => setTemperature('warm')}
                className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                  temperature === 'warm'
                    ? 'border-amber-500 bg-amber-500 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                ⚡ Warm
              </button>
              <button
                type="button"
                onClick={() => setTemperature('cold')}
                className={`py-2 px-2 rounded-xl text-xs font-black border transition-all ${
                  temperature === 'cold'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                    : 'border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                ❄️ Cold
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 2: OPTIONAL FIELDS */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Requirement & Project
            </h2>
            <span className="text-[11px] text-slate-400">Optional</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Source
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SOURCES.map(src => (
                <button
                  type="button"
                  key={src}
                  onClick={() => setSource(src)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    source === src
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Interested Development / Project
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="">Select project (optional)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Requirement
            </label>
            <input
              type="text"
              value={requirement}
              onChange={e => setRequirement(e.target.value)}
              placeholder="e.g. 3 BHK high-rise, 200 sq yd plot"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              First Follow-up Date
            </label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={e => setNextFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>
        </div>

        {/* STICKY SAVE BUTTON */}
        <div className="pt-2 sticky bottom-20 md:bottom-4 z-30">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{isSubmitting ? 'Saving Lead...' : 'Save Lead'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
