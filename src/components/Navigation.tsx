'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck,
  Users,
  Plus,
  Building2,
  MoreHorizontal,
  Compass,
  Settings,
  Flame,
  UploadCloud,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Do not show navigation on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/signup';
  if (isAuthPage) {
    return null;
  }

  const isToday = pathname === '/' || pathname === '/today';
  const isLeads = pathname.startsWith('/leads') && pathname !== '/leads/new';
  const isStatus = pathname.startsWith('/status');
  const isImport = pathname.startsWith('/import');
  const isVisits = pathname.startsWith('/visits');
  const isProjects = pathname.startsWith('/projects');
  const isTeam = pathname.startsWith('/team');
  const isMore = pathname.startsWith('/more');
  const isSettings = pathname.startsWith('/settings');

  return (
    <>
      {/* DESKTOP SIDEBAR (Visible on md and up) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 z-40 shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                CR
              </div>
              <span className="font-extrabold tracking-tight text-lg text-white">
                LeadFlow CRM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Real Estate Lead Engine</p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="p-4 space-y-2">
          <Link
            href="/leads/new"
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-[0.98] text-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Single Lead</span>
          </Link>
          <Link
            href="/import"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-semibold py-2 px-3 rounded-xl border border-emerald-500/30 transition-all text-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Bulk Upload Excel</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-1 space-y-1 font-medium text-sm overflow-y-auto">
          <Link
            href="/today"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isToday
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-5 h-5" />
            <div className="flex-1 flex items-center justify-between">
              <span>Today&apos;s Follow-ups</span>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
          </Link>

          {/* Dedicated Status Board */}
          <Link
            href="/status"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isStatus
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-5 h-5 text-emerald-400" />
            <span>Client Status Board</span>
          </Link>

          <Link
            href="/leads"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isLeads
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>{user?.role === 'admin' ? 'All Leads' : 'My Leads'}</span>
          </Link>

          <Link
            href="/visits"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isVisits
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span>Site Visits</span>
          </Link>

          <Link
            href="/projects"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isProjects
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span>Projects</span>
          </Link>

          {user?.role === 'admin' && (
            <Link
              href="/team"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isTeam
                  ? 'bg-purple-600/20 text-purple-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <div className="flex-1 flex items-center justify-between">
                <span>Team Logins</span>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">
                  Admin
                </span>
              </div>
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              href="/more"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isMore
                  ? 'bg-blue-600/20 text-blue-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span>More & Reports</span>
            </Link>
          )}
        </nav>

        {/* Bottom Profile / Settings */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <Link
            href="/settings"
            className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
              isSettings ? 'bg-slate-800' : 'hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="text-xs truncate">
                <p className="font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-slate-400 capitalize">{user?.role || 'Executive'}</p>
              </div>
            </div>
            <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </Link>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {/* 1. Today */}
          <Link
            href="/today"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
              isToday ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <div className="relative">
              <CalendarCheck className="w-6 h-6 stroke-[2.2]" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">Today</span>
          </Link>

          {/* 2. Status Board */}
          <Link
            href="/status"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
              isStatus ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <Layers className="w-6 h-6 stroke-[2]" />
            <span className="text-[11px] mt-0.5 tracking-tight">Status</span>
          </Link>

          {/* 3. Center Floating "+ Add Lead" Button */}
          <div className="flex-1 flex justify-center -mt-6">
            <Link
              href="/leads/new"
              aria-label="Add new lead"
              className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 active:scale-95 transition-transform border-4 border-white"
            >
              <Plus className="w-7 h-7 stroke-[3]" />
            </Link>
          </div>

          {/* 4. Leads List */}
          <Link
            href="/leads"
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
              isLeads ? 'text-blue-600 font-bold' : 'text-slate-600'
            }`}
          >
            <Users className="w-6 h-6 stroke-[2]" />
            <span className="text-[11px] mt-0.5 tracking-tight">Leads</span>
          </Link>

          {/* 5. More (Admin) or Settings (Executive) */}
          {user?.role === 'admin' ? (
            <Link
              href="/more"
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
                isMore || isImport ? 'text-blue-600 font-bold' : 'text-slate-600'
              }`}
            >
              <MoreHorizontal className="w-6 h-6 stroke-[2]" />
              <span className="text-[11px] mt-0.5 tracking-tight">More</span>
            </Link>
          ) : (
            <Link
              href="/settings"
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 ${
                isSettings ? 'text-blue-600 font-bold' : 'text-slate-600'
              }`}
            >
              <Settings className="w-6 h-6 stroke-[2]" />
              <span className="text-[11px] mt-0.5 tracking-tight">Settings</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
