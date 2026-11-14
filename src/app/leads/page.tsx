'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  Building2,
  ChevronRight,
  Clock,
  Upload,
  FileText,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Check,
} from 'lucide-react';
import { Lead, Temperature, LeadStatus, Project } from '@/lib/types';
import { fetchLeads, fetchProjects } from '@/lib/storage';
import { exportLeadsToExcel, exportLeadsToPDF } from '@/lib/exportImport';
import LogFollowUpModal from '@/components/LogFollowUpModal';
import LeadCard from '@/components/LeadCard';
import WhatsAppModal from '@/components/WhatsAppModal';
import LeadNotesModal from '@/components/LeadNotesModal';

const STATUSES: { value: LeadStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'visit_scheduled', label: 'Visit Scheduled' },
  { value: 'visit_done', label: 'Visit Done' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'booked', label: 'Booked' },
  { value: 'lost', label: 'Lost' },
];

export default function LeadsListPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'all'>('all');
  const [selectedTemp, setSelectedTemp] = useState<Temperature | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Pagination & Export
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Modals
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);
  const [notesLead, setNotesLead] = useState<Lead | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [leadsData, projData] = await Promise.all([fetchLeads(), fetchProjects()]);
    setLeads(leadsData);
    setProjects(projData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLeads = leads.filter(l => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.name.toLowerCase().includes(q) ||
      l.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      (l.requirement && l.requirement.toLowerCase().includes(q));

    const matchesStatus = selectedStatus === 'all' || l.status === selectedStatus;
    const matchesTemp = selectedTemp === 'all' || l.temperature === selectedTemp;
    const matchesProject = selectedProject === 'all' || l.project_id === selectedProject;

    return matchesSearch && matchesStatus && matchesTemp && matchesProject;
  });

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedStatus, selectedTemp, selectedProject, pageSize]);

  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
            Directory ({filteredLeads.length})
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            All Leads
          </h1>
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Download / Export Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(prev => !prev)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
              title="Download Data in Excel or PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Excel (.xlsx) Download
                </div>
                <button
                  type="button"
                  onClick={() => {
                    exportLeadsToExcel(
                      paginatedLeads,
                      `Leads_Page_${safeCurrentPage}_${new Date().toISOString().split('T')[0]}.xlsx`
                    );
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Current Page ({paginatedLeads.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportLeadsToExcel(
                      filteredLeads,
                      `All_Leads_${new Date().toISOString().split('T')[0]}.xlsx`
                    );
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>All Leads ({filteredLeads.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">.xlsx</span>
                </button>

                <div className="border-t border-slate-100 my-1" />

                <div className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  PDF Report Download
                </div>
                <button
                  type="button"
                  onClick={() => {
                    exportLeadsToPDF(
                      paginatedLeads,
                      `Leads Report (Page ${safeCurrentPage})`
                    );
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Current Page ({paginatedLeads.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    exportLeadsToPDF(filteredLeads, `All Filtered Leads Report`);
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>All Leads ({filteredLeads.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">PDF</span>
                </button>
              </div>
            )}
          </div>

          <Link
            href="/import"
            className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs px-3 py-2.5 rounded-xl border border-emerald-200 transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel Import</span>
          </Link>
          <Link
            href="/leads/new"
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Lead</span>
          </Link>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone or requirement..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-sm"
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

      {/* Horizontal Scrollable Filter Chips */}
      <div className="space-y-2">
        {/* Temperature Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Temp:</span>
          {(['all', 'hot', 'warm', 'cold'] as const).map(p => (
            <button
              key={p}
              onClick={() => setSelectedTemp(p)}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap capitalize transition-all ${
                selectedTemp === p
                  ? p === 'hot'
                    ? 'bg-red-600 text-white shadow-sm'
                    : p === 'warm'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : p === 'cold'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Stage:</span>
          {STATUSES.map(st => (
            <button
              key={st.value}
              onClick={() => setSelectedStatus(st.value)}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                selectedStatus === st.value
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse">
          Loading leads...
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm my-6 space-y-3">
          <p className="text-sm font-bold text-slate-700">No leads found matching your criteria</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedStatus('all');
              setSelectedTemp('all');
              setSelectedProject('all');
            }}
            className="text-xs font-bold text-blue-600 underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Card List */}
          <div className="block md:hidden space-y-3">
            {paginatedLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onLogFollowUp={l => setFollowUpLead(l)}
                onWhatsApp={l => setWhatsAppLead(l)}
                onViewNotes={l => setNotesLead(l)}
              />
            ))}
          </div>

          {/* LAPTOP / DESKTOP VIEW: Structured Responsive Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Lead</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Temperature</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Next Follow-up</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {paginatedLeads.map(lead => {
                  const cleanPhone = lead.phone.replace(/\D/g, '');
                  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                  const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(
                    `Hello ${lead.name}, regarding your inquiry for ${lead.project?.name || 'property'}.`
                  )}`;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <Link href={`/leads/${lead.id}`} className="hover:text-blue-600">
                          {lead.name}
                        </Link>
                        {lead.source && (
                          <div className="text-[10px] text-slate-600 font-normal">
                            {lead.source}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold">{lead.phone}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            lead.temperature === 'hot'
                              ? 'bg-red-600 text-white'
                              : lead.temperature === 'warm'
                              ? 'bg-amber-500 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {lead.temperature}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded-md border font-semibold bg-slate-100 text-slate-700 capitalize">
                          {lead.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {lead.project?.name || 'Any'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {lead.next_follow_up_at
                          ? new Date(lead.next_follow_up_at).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
                            title="Call"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setWhatsAppLead(lead)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="Send WhatsApp Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setNotesLead(lead)}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] flex items-center gap-1 border border-amber-200"
                            title="View all Notes & Messages"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span>Notes {lead.follow_ups && lead.follow_ups.length > 0 ? `(${lead.follow_ups.length})` : ''}</span>
                          </button>
                          <button
                            onClick={() => setFollowUpLead(lead)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px]"
                          >
                            Follow up
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls Bar */}
          {filteredLeads.length > 0 && (
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2 text-slate-600 font-medium">
                <span>
                  Showing <strong className="text-slate-900">{startIndex + 1}</strong> to{' '}
                  <strong className="text-slate-900">{endIndex}</strong> of{' '}
                  <strong className="text-slate-900">{totalItems}</strong> leads
                </span>
                <span className="text-slate-300">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page number buttons */}
                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      p =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - safeCurrentPage) <= 1
                    )
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const hasGap = prevPage && p - prevPage > 1;
                      return (
                        <React.Fragment key={p}>
                          {hasGap && <span className="text-slate-400 px-0.5">...</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                              safeCurrentPage === p
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
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
