'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Tag,
  Plus,
  Users,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';
import { Project, Lead } from '@/lib/types';
import { fetchProjects, fetchLeads, createProject } from '@/lib/storage';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [builder, setBuilder] = useState('');
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState<Project['property_type']>('high_rise');
  const [notes, setNotes] = useState('');

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [projData, leadData] = await Promise.all([fetchProjects(), fetchLeads()]);
    setProjects(projData);
    setLeads(leadData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createProject({
      name: name.trim(),
      builder: builder.trim() || undefined,
      location: location.trim() || undefined,
      property_type: propertyType,
      notes: notes.trim() || undefined,
    });

    setName('');
    setBuilder('');
    setLocation('');
    setNotes('');
    setShowAddModal(false);
    loadData();
  };

  const getLeadsForProject = (projId: string) => {
    return leads.filter(l => l.project_id === projId);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
            Portfolio ({projects.length})
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Listed Projects
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Project</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-sm my-6 space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No projects added yet</p>
          <p className="text-xs text-slate-400">
            Add your active real estate projects to associate leads with them.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow"
          >
            Add First Project
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(proj => {
            const projectLeads = getLeadsForProject(proj.id);
            const isExpanded = selectedProjectId === proj.id;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {proj.name}
                    </h3>
                    {proj.builder && (
                      <p className="text-xs font-bold text-blue-600">{proj.builder}</p>
                    )}
                  </div>

                  {proj.property_type && (
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                      {proj.property_type.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium">
                  {proj.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {proj.location}
                    </span>
                  )}
                  {proj.notes && (
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      {proj.notes}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setSelectedProjectId(isExpanded ? null : proj.id)
                    }
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>{projectLeads.length} Interested Leads</span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  <span className="text-[10px] text-slate-400">
                    {proj.is_active ? 'Active Selling' : 'Completed'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="pt-2 space-y-2 animate-in fade-in duration-200">
                    {projectLeads.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2">
                        No leads currently assigned to this project.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 bg-slate-50 rounded-xl p-2 border border-slate-100">
                        {projectLeads.map(lead => (
                          <div
                            key={lead.id}
                            className="py-2 flex items-center justify-between text-xs"
                          >
                            <div>
                              <Link
                                href={`/leads/${lead.id}`}
                                className="font-bold text-slate-900 hover:text-blue-600"
                              >
                                {lead.name}
                              </Link>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {lead.phone}
                              </div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-white border border-slate-200">
                              {lead.status.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Add New Project
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Godrej Woods"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Builder / Developer
                </label>
                <input
                  type="text"
                  value={builder}
                  onChange={e => setBuilder(e.target.value)}
                  placeholder="e.g. Godrej Properties"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Sector 43, Noida"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Property Type
                </label>
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  <option value="high_rise">High Rise</option>
                  <option value="villa">Villa</option>
                  <option value="plot">Plot</option>
                  <option value="commercial">Commercial</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Notes / Configurations
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. 2BHK, 3BHK Luxury Resort Homes"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Save Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
