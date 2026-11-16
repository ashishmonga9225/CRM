'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Mail,
  Lock,
  User,
  CheckCircle,
  AlertCircle,
  Trash2,
  Power,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowLeft,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Profile } from '@/lib/types';
import { fetchTeamMembers } from '@/lib/storage';
import { useAuth } from '@/lib/auth';

export default function TeamManagementPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // New child account form
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'executive' | 'admin'>('executive');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password reset modal
  const [resetModalUser, setResetModalUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  // Delete modal
  const [deleteModalUser, setDeleteModalUser] = useState<Profile | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const loadTeam = async () => {
    try {
      const data = await fetchTeamMembers();
      setMembers(data);
    } catch (err) {
      console.error('Failed to load team:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTeam();
  };

  const handleCreateChildLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim() || undefined,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setFormError(data.error || 'Failed to create child login');
      } else {
        setFormSuccess(`Child login for "${data.user?.full_name || email}" created successfully! They can log in immediately.`);
        setFullName('');
        setEmail('');
        setPassword('');
        setRole('executive');
        loadTeam();
        setTimeout(() => {
          setShowAddModal(false);
          setFormSuccess('');
        }, 1800);
      }
    } catch (err: any) {
      setFormError(err.message || 'Network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (targetUser: Profile) => {
    const nextState = !targetUser.is_active;
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUser.id,
          action: 'toggle_active',
          isActive: nextState,
        }),
      });
      if (res.ok) {
        setMembers(prev =>
          prev.map(m => (m.id === targetUser.id ? { ...m, is_active: nextState } : m))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleChangeRole = async (targetUser: Profile, newRoleVal: 'admin' | 'executive') => {
    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUser.id,
          action: 'change_role',
          newRole: newRoleVal,
        }),
      });
      if (res.ok) {
        setMembers(prev =>
          prev.map(m => (m.id === targetUser.id ? { ...m, role: newRoleVal } : m))
        );
      }
    } catch (err) {
      console.error('Failed to change role', err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword) return;

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }

    setResetSubmitting(true);
    setResetError('');
    setResetMsg('');

    try {
      const res = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetModalUser.id,
          action: 'change_password',
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setResetError(data.error || 'Failed to reset password');
      } else {
        setResetMsg('Password updated successfully!');
        setTimeout(() => {
          setResetModalUser(null);
          setNewPassword('');
          setResetMsg('');
        }, 1500);
      }
    } catch (err: any) {
      setResetError(err.message || 'Error occurred');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeleteSubmitting(true);
    try {
      const reassignId = user?.id || '';
      const res = await fetch(
        `/api/team?userId=${deleteModalUser.id}&reassignTo=${reassignId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        setMembers(prev => prev.filter(m => m.id !== deleteModalUser.id));
        setDeleteModalUser(null);
      }
    } catch (err) {
      console.error('Delete user failed:', err);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Restrict access if user is not Super Admin
  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Super Admin Access Only</h2>
        <p className="text-sm text-slate-500">
          Only the Super Administrator (Ashish) has permission to manage team accounts and child logins.
        </p>
        <Link
          href="/today"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const executiveCount = members.filter(m => m.role === 'executive').length;
  const adminCount = members.filter(m => m.role === 'admin').length;
  const totalAssignedLeads = members.reduce((sum, m) => sum + (m.lead_count || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Super Admin Control Center</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Team & Child Logins
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Create child logins for sales executives and assign leads. Each child account only sees their own leads. Only Super Admin has access to view all company data.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            title="Refresh team list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setFormError('');
              setFormSuccess('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Child Login</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Team</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{members.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Registered accounts</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Child Logins</span>
            <User className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-1">{executiveCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Sales Executives</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Super Admins</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 mt-1">{adminCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Full data access</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Assigned Leads</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 mt-1">{totalAssignedLeads}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all agents</p>
        </div>
      </div>

      {/* Info Notice about Data Isolation */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 leading-relaxed">
          <p className="font-bold text-blue-950">Data Isolation Rules Enforced:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-800">
            <li>Child logins (Executives) can <strong>only view leads explicitly assigned to them</strong> or created by them.</li>
            <li>No child login can view another executive&apos;s leads or notes.</li>
            <li>You as Super Login (Ashish) can see all company leads, reassign leads individually or in bulk, and manage logins anytime.</li>
          </ul>
        </div>
      </div>

      {/* Team Roster Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
            <span>Active Team Members</span>
            <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {members.length}
            </span>
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Click on any agent to view their assigned leads
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs animate-pulse">
            Loading team logins...
          </div>
        ) : members.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No team members found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              + Create first child login
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {members.map(member => {
              const isCurrentUser = member.id === user?.id;
              const isSuperAdmin = member.role === 'admin';

              return (
                <div
                  key={member.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    !member.is_active ? 'bg-slate-50/60 opacity-70' : 'hover:bg-slate-50/40'
                  }`}
                >
                  {/* Left: User Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-sm flex-shrink-0 ${
                        isSuperAdmin
                          ? 'bg-purple-600 text-white shadow-purple-200'
                          : 'bg-blue-600 text-white shadow-blue-200'
                      }`}
                    >
                      {member.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-sm text-slate-900 truncate">
                          {member.full_name || 'Team Member'}
                        </h3>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isSuperAdmin
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isSuperAdmin ? '👑 Super Admin' : '👤 Child Login'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            member.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {member.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 truncate">
                        <span className="flex items-center gap-1 truncate font-medium">
                          <Mail className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="truncate">{member.email || 'No email on record'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle / Right: Assigned Leads Count & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                    {/* Leads count pill */}
                    <Link
                      href={`/leads?agent=${member.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 text-xs font-semibold transition-colors"
                      title="View leads assigned to this user"
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>{member.lead_count ?? 0} leads</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      {/* Password Reset */}
                      <button
                        onClick={() => {
                          setResetModalUser(member);
                          setNewPassword('');
                          setResetError('');
                          setResetMsg('');
                        }}
                        className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Reset Password"
                      >
                        <Key className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden md:inline">Reset Pass</span>
                      </button>

                      {/* Toggle Active/Inactive */}
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleToggleActive(member)}
                          className={`p-2 rounded-xl border transition-colors text-xs font-semibold flex items-center gap-1 ${
                            member.is_active
                              ? 'border-slate-200 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                          title={member.is_active ? 'Disable Login' : 'Enable Login'}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span className="hidden md:inline">
                            {member.is_active ? 'Disable' : 'Enable'}
                          </span>
                        </button>
                      )}

                      {/* Delete Child Login */}
                      {!isCurrentUser && (
                        <button
                          onClick={() => setDeleteModalUser(member)}
                          className="p-2 rounded-xl border border-red-200 bg-white hover:bg-red-50 text-red-600 transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: CREATE CHILD LOGIN */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Create Child Login</h3>
                  <p className="text-[11px] text-blue-100">Set up credentials for an executive</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateChildLogin} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Verma"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Login Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="rohan@leadflowcrm.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Give this password to your executive. They can sign in immediately.
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Access Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('executive')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'executive'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Child Login</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Only sees assigned leads. Cannot view others&apos; data.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'admin'
                        ? 'border-purple-600 bg-purple-50/50 ring-2 ring-purple-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Shield className="w-3.5 h-3.5 text-purple-600" />
                      <span>Super Admin</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Full access to all leads, team logins, and exports.
                    </p>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition-all"
                >
                  {submitting ? 'Creating Login...' : 'Create Child Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Reset Password for {resetModalUser.full_name}
                </h3>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              {resetError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                  {resetError}
                </div>
              )}
              {resetMsg && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  {resetMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl shadow"
                >
                  {resetSubmitting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-black text-base text-slate-900">
                Delete &quot;{deleteModalUser.full_name}&quot;?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Their account login will be deleted. All of their assigned leads ({deleteModalUser.lead_count || 0}) will automatically be transferred back to you (Super Admin) so no data is lost.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl shadow"
              >
                {deleteSubmitting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
