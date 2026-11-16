'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Download,
  Upload,
  BarChart3,
  Database,
  CheckCircle,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  Flame,
  Award,
  Settings,
  ChevronRight,
  User,
  Layers,
  UploadCloud,
} from 'lucide-react';
import { Lead } from '@/lib/types';
import { fetchLeads } from '@/lib/storage';
import { exportLeadsToExcel, downloadExcelTemplate } from '@/lib/exportImport';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const LAST_BACKUP_KEY = 'crm_last_backup_timestamp_v1';

export default function MorePage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [lastBackup, setLastBackup] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LAST_BACKUP_KEY) || 'Never';
    }
    return 'Never';
  });

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLeads(user);
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-7 h-7 text-red-600" />
        </div>
        <h2 className="text-xl font-black text-slate-800">Super Admin Access Only</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Company analytics, database configuration, and bulk data tools are only accessible to the Super Admin.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/today"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-md"
          >
            <span>Today&apos;s Follow-ups</span>
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
          >
            <span>My Account Settings</span>
          </Link>
        </div>
      </div>
    );
  }

  // Compute metrics
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.temperature === 'hot').length;
  const bookedLeads = leads.filter(l => l.status === 'booked').length;
  const notInterestedLeads = leads.filter(l => l.status === 'lost').length;
  const visitsDone = leads.filter(
    l => l.status === 'visit_done' || l.status === 'negotiation' || l.status === 'booked'
  ).length;

  const conversionRate = totalLeads > 0 ? Math.round((bookedLeads / totalLeads) * 100) : 0;

  // Source breakdown
  const sourceCounts: Record<string, number> = {};
  leads.forEach(l => {
    const src = l.source || 'Other';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });

  const handleExport = () => {
    exportLeadsToExcel(leads);
    const dateStr = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    setLastBackup(dateStr);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_BACKUP_KEY, dateStr);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
          Tools & Configuration
        </span>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          More & Reports
        </h1>
      </div>

      {/* QUICK LAUNCH CARDS (Status Board & Bulk Upload) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Client Status Board */}
        <Link
          href="/status"
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-400 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                Client Status Board
              </h3>
              <p className="text-xs text-slate-500">Interested, Not Interested & Stages</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
        </Link>

        {/* Bulk Upload Excel */}
        <Link
          href="/import"
          className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-400 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-700 transition-colors">
                Bulk Lead Import
              </h3>
              <p className="text-xs text-slate-500">Upload Excel (.xlsx) with Name & Number</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
        </Link>

        {/* Super Admin Team & Child Logins Card */}
        {user?.role === 'admin' && (
          <Link
            href="/team"
            className="sm:col-span-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-200 shadow-sm flex items-center justify-between hover:border-purple-400 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-purple-950 group-hover:text-purple-700 transition-colors">
                    Team & Child Logins
                  </h3>
                  <span className="text-[10px] bg-purple-200/80 text-purple-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-purple-800/80 mt-0.5">
                  Create child logins for executives, set passwords, and manage lead assignments
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400 group-hover:text-purple-700" />
          </Link>
        )}
      </div>

      {/* Profile & Settings Banner */}
      <Link
        href="/settings"
        className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-400 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
              {user?.name || 'User Profile'}
            </h3>
            <p className="text-xs text-slate-500">Edit Name, Password & Account Settings</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
      </Link>

      {/* Database Connection Status Card */}
      <div className={`p-4 rounded-2xl border ${
        isSupabaseConfigured
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-amber-50/80 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          {isSupabaseConfigured ? (
            <>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Supabase Cloud Connected (Mumbai)</span>
            </>
          ) : (
            <>
              <Database className="w-5 h-5 text-amber-600" />
              <span>Local Offline Ready Mode</span>
            </>
          )}
        </div>
        <p className="text-xs mt-1 leading-relaxed">
          {isSupabaseConfigured
            ? 'All leads and follow-ups are safely synchronizing in real time with your Supabase PostgreSQL database.'
            : 'Running with local persistent storage. To connect to Supabase Cloud, add your Project URL and Anon key in .env.local.'}
        </p>
      </div>

      {/* KPI Performance Summary */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lead Conversion & Velocity
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">Live</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">
              Total Leads
            </span>
            <span className="text-2xl font-black text-slate-900">{totalLeads}</span>
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-600 uppercase block">
              Interested
            </span>
            <span className="text-2xl font-black text-emerald-700">{hotLeads}</span>
          </div>

          <div className="bg-red-50/60 p-3 rounded-2xl border border-red-100">
            <span className="text-[10px] font-bold text-red-600 uppercase block">
              Not Interested
            </span>
            <span className="text-2xl font-black text-red-700">{notInterestedLeads}</span>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">
              Bookings
            </span>
            <span className="text-2xl font-black text-blue-800">{bookedLeads}</span>
          </div>
        </div>

        {/* Lead Source Breakdown */}
        <div className="pt-2">
          <h3 className="text-xs font-bold text-slate-800 mb-2">Leads by Channel</h3>
          <div className="space-y-1.5">
            {Object.entries(sourceCounts).map(([src, count]) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={src} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{src}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Excel Data Management */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Excel Data Management
            </h2>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">
            Last Export: {lastBackup}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export to Excel */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-white text-slate-800 font-bold text-xs transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export All Leads to Excel (.xlsx)</span>
          </button>

          {/* Download Template */}
          <button
            onClick={downloadExcelTemplate}
            className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-white text-slate-800 font-bold text-xs transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Download Sample Excel Template</span>
          </button>
        </div>
      </div>
    </div>
  );
}
