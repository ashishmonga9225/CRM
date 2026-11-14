'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Lock,
  Mail,
  Shield,
  ArrowLeft,
  Check,
  LogOut,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Calendar,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { fetchLeads } from '@/lib/storage';
import { exportLeadsToCSV } from '@/lib/exportImport';

const LAST_BACKUP_KEY = 'crm_last_backup_timestamp_v1';

export default function SettingsPage() {
  const router = useRouter();
  const { user, updateProfile, changePassword, logout } = useAuth();

  // Name state
  const [name, setName] = useState(user?.name || '');
  const [nameMsg, setNameMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingName, setSavingName] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  // WhatsApp state
  const [whatsappPhone, setWhatsappPhone] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('crm_user_whatsapp_phone') || '';
    }
    return '';
  });
  const [waMsg, setWaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Backup state
  const [lastBackup, setLastBackup] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LAST_BACKUP_KEY) || 'Never';
    }
    return 'Never';
  });

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingName(true);
    setNameMsg(null);

    const res = await updateProfile(name.trim());
    if (res.success) {
      setNameMsg({ type: 'success', text: 'Name updated successfully.' });
    } else {
      setNameMsg({ type: 'error', text: res.error || 'Failed to update name.' });
    }
    setSavingName(false);
  };

  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = whatsappPhone.replace(/\D/g, '');
    if (clean && (clean.length < 10 || clean.length > 12)) {
      setWaMsg({ type: 'error', text: 'Please enter a valid 10-digit WhatsApp number.' });
      return;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_user_whatsapp_phone', clean);
    }
    setWaMsg({ type: 'success', text: 'WhatsApp sender number saved successfully!' });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSavingPass(true);
    const res = await changePassword(newPassword);
    if (res.success) {
      setPassMsg({ type: 'success', text: 'Password changed successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPassMsg({ type: 'error', text: res.error || 'Failed to change password.' });
    }
    setSavingPass(false);
  };

  const handleManualBackup = async () => {
    const leads = await fetchLeads();
    exportLeadsToCSV(leads);
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
    <div className="space-y-5 pb-24 max-w-xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
              Account
            </span>
            <h1 className="text-xl font-black text-slate-900">Profile & Settings</h1>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Info Pill */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase bg-slate-100 text-slate-700 border border-slate-200">
          Role: {user?.role || 'Executive'}
        </span>
      </div>

      {/* 1. Update Profile Name */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Edit Name
          </h3>
        </div>

        {nameMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              nameMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {nameMsg.text}
          </div>
        )}

        <form onSubmit={handleUpdateName} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={savingName}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{savingName ? 'Updating...' : 'Save Name'}</span>
          </button>
        </form>
      </div>

      {/* 2. WhatsApp Configuration */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              WhatsApp Configuration
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Active
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Configure your WhatsApp sender number. When you tap <strong>WhatsApp</strong> on any lead, WhatsApp opens with pre-filled real estate templates:
        </p>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 text-xs text-emerald-950 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-emerald-900">
            <span>💬</span> Default Opening Message:
          </div>
          <p className="italic text-[11px] leading-relaxed bg-white/80 p-2.5 rounded-xl border border-emerald-100">
            &ldquo;Hi {'{Client Name}'}, {name || 'Ashish'} this side. We have received your query regarding property. Are you looking for investment or self-use?&rdquo;
          </p>
        </div>

        {waMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              waMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {waMsg.text}
          </div>
        )}

        <form onSubmit={handleSaveWhatsApp} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              My WhatsApp Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={whatsappPhone}
                onChange={e => setWhatsappPhone(e.target.value)}
                placeholder="e.g. 9812345678 or +91 9812345678"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Your registered phone number for WhatsApp messaging and lead queries.
            </p>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Save WhatsApp Number</span>
          </button>
        </form>
      </div>

      {/* 3. Change Password */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Change Password
          </h3>
        </div>

        {passMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold ${
              passMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {passMsg.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={savingPass}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{savingPass ? 'Updating...' : 'Update Password'}</span>
          </button>
        </form>
      </div>

      {/* 4. Weekly Excel Backup Manager (Version 1 Feature) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Weekly Excel Backup
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            Active
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Keep your lead data safe by downloading a full Excel/CSV backup every week. You can trigger an instant backup anytime below:
        </p>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Last Backup Created
            </span>
            <span className="font-bold text-slate-800">{lastBackup}</span>
          </div>

          <button
            onClick={handleManualBackup}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Run Backup Now</span>
          </button>
        </div>
      </div>
    </div>
  );
}
