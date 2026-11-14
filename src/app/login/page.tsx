'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, User, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, signup, loginAsDemo } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (mode === 'signup') {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name.');
        setLoading(false);
        return;
      }
      const res = await signup(email.trim(), password.trim(), fullName.trim());
      if (res.success) {
        if (res.message) {
          setInfoMsg(res.message);
          setMode('signin');
        } else {
          router.replace('/today');
        }
      } else {
        setErrorMsg(res.error || 'Failed to create account.');
      }
    } else {
      const res = await login(email.trim(), password.trim());
      if (res.success) {
        router.replace('/today');
      } else {
        setErrorMsg(res.error || 'Failed to sign in. Please check credentials.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 max-w-sm mx-auto">
      <div className="w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        {/* App Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            CR
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            LeadFlow CRM
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {mode === 'signup'
              ? 'Create your account (first user becomes Admin)'
              : 'Sign in to access leads and follow-ups'}
          </p>
        </div>

        {/* Tab switch between Sign in & Create Account */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
              setInfoMsg('');
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            {infoMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1 block">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="agent@company.com"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>
              {loading
                ? mode === 'signup'
                  ? 'Creating account...'
                  : 'Signing in...'
                : mode === 'signup'
                ? 'Create Account'
                : 'Sign In'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
